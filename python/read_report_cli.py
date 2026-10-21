"""CLI JSON adapter used by the TypeScript API to call the report reader."""

from __future__ import annotations

import json
import sys
from decimal import Decimal
from pathlib import Path

from report_reader import ReportKind, ReportReadError, read_report

def main() -> int:
    if len(sys.argv) != 4:
        print("Uso: read_report_cli.py <arquivo> <pix|recarga> <nome-original>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    kind = sys.argv[2]
    original_name = sys.argv[3]
    if kind not in ("pix", "recarga"):
        print("Tipo de relatório inválido", file=sys.stderr)
        return 2

    try:
        report = read_report(path, kind)  # type: ignore[arg-type]
    except (OSError, ReportReadError) as error:
        print(str(error), file=sys.stderr)
        return 2
    except Exception:
        print("Arquivo Excel inválido ou corrompido", file=sys.stderr)
        return 2

    total = sum((row.value for row in report.rows), Decimal("0"))
    print(json.dumps({
        "kind": report.kind,
        "fileName": original_name,
        "valueColumn": report.value_column,
        "rowCount": len(report.rows),
        "totalValue": str(total),
        "rows": [
            {"operator": row.operator, "value": str(row.value)}
            for row in report.rows
        ],
    }, ensure_ascii=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
