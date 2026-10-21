"""Leitura e validação dos relatórios CSV e Excel exportados pelo WMS.

Os relatórios usam ponto e vírgula como separador e, no arquivo Pix,
valores monetários no formato brasileiro (por exemplo: ``8.259,69``).
"""

from __future__ import annotations

import csv
from datetime import datetime
from io import StringIO
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Literal

ReportKind = Literal["pix", "recarga"]

REPORT_PREFIXES: dict[ReportKind, str] = {
    "pix": "PESQUISA_TRANSACOES_DETALHES_",
    "recarga": "RELATORIO_RECARGA_CELULAR_",
}

@dataclass(frozen=True)
class ReportRow:
    """Uma linha normalizada do relatório, mantendo o operador como texto."""

    operator: str
    value: Decimal

@dataclass(frozen=True)
class Report:
    """Relatório lido e validado."""

    kind: ReportKind
    file_name: str
    value_column: str
    rows: tuple[ReportRow, ...]

class ReportReadError(ValueError):
    """Erro de formato ou conteúdo em um relatório exportado."""

def _find_report(directory: Path, kind: ReportKind) -> Path:
    prefix = REPORT_PREFIXES[kind]
    candidates = [
        path
        for path in directory.iterdir()
        if path.is_file()
        and path.name.startswith(prefix)
        and path.suffix.lower() in {".csv", ".xlsx", ".xls", ".xlsm"}
    ]

    if not candidates:
        raise FileNotFoundError(
            f"Nenhum CSV ou Excel de {kind} encontrado com o prefixo {prefix!r} em {directory}"
        )

    timestamp_pattern = re.compile(
        r"_(\d{2})_(\d{2})_(\d{4})_(\d{2})_(\d{2})_(\d{2})\.(?:csv|xlsx|xls|xlsm)$",
        re.IGNORECASE,
    )

    def generated_at(path: Path) -> datetime:
        match = timestamp_pattern.search(path.name)
        if match:
            day, month, year, hour, minute, second = map(int, match.groups())
            return datetime(year, month, day, hour, minute, second)
        return datetime.fromtimestamp(path.stat().st_mtime)

    return max(candidates, key=generated_at)

def _parse_decimal(value: object, *, row_number: int, column: str) -> Decimal:
    if value is None or isinstance(value, bool):
        raise ReportReadError(f"Linha {row_number}: campo {column!r} vazio ou inválido")

    normalized = str(value).strip()
    if not normalized:
        raise ReportReadError(f"Linha {row_number}: campo {column!r} vazio")

    if re.fullmatch(r"\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?", normalized):
        normalized = normalized.replace(".", "").replace(",", ".")

    try:
        parsed = Decimal(normalized)
    except InvalidOperation as error:
        raise ReportReadError(
            f"Linha {row_number}: valor inválido em {column!r}: {value!r}"
        ) from error

    if not parsed.is_finite() or parsed < 0:
        raise ReportReadError(
            f"Linha {row_number}: {column!r} deve ser um número finito não negativo"
        )
    return parsed

def read_report(path: str | Path, kind: ReportKind) -> Report:
    """Lê um CSV ou Excel WMS, validando cabeçalhos e normalizando seus dados."""

    report_path = Path(path)
    quantity_headers = {"Quantidade de Transações", "Quantidade de Transacoes"}
    valid_headers = (
        {("Operador", header) for header in quantity_headers}
        if kind == "pix"
        else {
            ("Operador", "Valor Total"),
            *(("Operador", header) for header in quantity_headers),
        }
    )
    rows: list[ReportRow] = []

    suffix = report_path.suffix.lower()
    if suffix == ".csv":
        content = report_path.read_bytes()
        try:
            decoded_content = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            decoded_content = content.decode("cp1252")
        table = list(csv.reader(StringIO(decoded_content), delimiter=";"))
    elif suffix in {".xlsx", ".xlsm"}:
        try:
            from openpyxl import load_workbook
        except ImportError as error:
            raise ReportReadError(
                "Para ler arquivos Excel, instale as dependências de python/requirements.txt"
            ) from error

        workbook = load_workbook(report_path, read_only=True, data_only=True)
        worksheet = workbook.active
        worksheet.reset_dimensions()
        table = list(worksheet.iter_rows(values_only=True))
        workbook.close()
    elif suffix == ".xls":
        try:
            import xlrd
        except ImportError as error:
            raise ReportReadError(
                "Para ler arquivos .xls, instale as dependências de python/requirements.txt"
            ) from error

        workbook = xlrd.open_workbook(report_path, on_demand=True)
        worksheet = workbook.sheet_by_index(0)
        table = [worksheet.row_values(row_index) for row_index in range(worksheet.nrows)]
        workbook.release_resources()
    else:
        raise ReportReadError(
            f"Formato {suffix or '(sem extensão)'} não suportado; use CSV, XLS, XLSX ou XLSM"
        )

    header_index = next(
        (
            index
            for index, row in enumerate(table)
            if tuple(str(value).strip() if value is not None else "" for value in row)
            in valid_headers
        ),
        None,
    )
    if header_index is None:
        received_headers = tuple(table[0]) if table else ()
        raise ReportReadError(
            f"Cabeçalho inválido em {report_path.name!r}: esperado "
            f"uma das opções {sorted(valid_headers)}, recebido {received_headers}"
        )
    source_value_column = str(table[header_index][1]).strip()
    value_column = (
        "Quantidade de Transacoes"
        if source_value_column in quantity_headers
        else source_value_column
    )

    seen_operators: set[str] = set()
    for row_number, row in enumerate(table[header_index + 1 :], start=header_index + 2):
        if not row or all(value is None or str(value).strip() == "" for value in row):
            continue
        if len(row) != 2:
            raise ReportReadError(f"Linha {row_number}: quantidade de colunas inválida")

        raw_operator, raw_value = row
        if raw_operator is None or isinstance(raw_operator, bool):
            operator = ""
        elif isinstance(raw_operator, float) and raw_operator.is_integer():
            operator = str(int(raw_operator))
        else:
            operator = str(raw_operator).strip()
        if not operator:
            raise ReportReadError(f"Linha {row_number}: operador vazio")
        if operator in seen_operators:
            raise ReportReadError(f"Linha {row_number}: operador duplicado {operator!r}")
        seen_operators.add(operator)

        parsed_value = _parse_decimal(
            raw_value,
            row_number=row_number,
            column=value_column,
        )
        if value_column == "Quantidade de Transacoes" and parsed_value != parsed_value.to_integral_value():
            raise ReportReadError(
                f"Linha {row_number}: quantidade de transações deve ser inteira"
            )
        rows.append(ReportRow(operator=operator, value=parsed_value))

    if not rows:
        raise ReportReadError(f"O relatório {report_path.name!r} não contém dados")

    return Report(
        kind=kind,
        file_name=report_path.name,
        value_column=value_column,
        rows=tuple(rows),
    )

def read_latest_reports(directory: str | Path) -> dict[ReportKind, Report]:
    """Lê a exportação mais recente de Pix e Recarga no diretório informado."""

    report_directory = Path(directory)
    return {
        kind: read_report(_find_report(report_directory, kind), kind)
        for kind in ("pix", "recarga")
    }
