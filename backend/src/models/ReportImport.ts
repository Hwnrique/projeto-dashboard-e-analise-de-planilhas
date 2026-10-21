import db from "../../database/data.js";
import { findOperatorNames } from "./Operator.js";

export type ReportKind = "pix" | "recarga";

export type ImportedReportRow = {
  operator: string;
  operatorName: string | null;
  value: string;
};

export type StoredReportRow = Pick<ImportedReportRow, "operator" | "value">;

export type ReportImport = {
  id: number;
  kind: ReportKind;
  fileName: string;
  valueColumn: string;
  rowCount: number;
  totalValue: string;
  rows: ImportedReportRow[];
  importedAt: string;
};

type ReportImportRecord = {
  id: number;
  kind: ReportKind;
  file_name: string;
  value_column: string;
  row_count: number;
  total_value: string;
  rows_json: string;
  imported_at: string;
};

function normalizeValueColumn(valueColumn: string): string {
  const normalized = valueColumn
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (normalized.startsWith("quantidadedetransa")) return "Quantidade de Transacoes";
  return valueColumn;
}

function mapRecord(record: ReportImportRecord): ReportImport {
  const namesByCode = findOperatorNames();
  const storedRows = JSON.parse(record.rows_json) as StoredReportRow[];
  return {
    id: record.id,
    kind: record.kind,
    fileName: record.file_name,
    valueColumn: normalizeValueColumn(record.value_column),
    rowCount: record.row_count,
    totalValue: record.total_value,
    rows: storedRows.map((row) => ({
      ...row,
      operatorName: namesByCode.get(row.operator) ?? null,
    })).sort((left, right) => Number(right.value) - Number(left.value)),
    importedAt: record.imported_at,
  };
}

export function findLatestReportImport(kind: ReportKind): ReportImport | null {
  const record = db.prepare(`
    SELECT id, kind, file_name, value_column, row_count, total_value, rows_json, imported_at
    FROM report_imports
    WHERE kind = ?
    ORDER BY imported_at DESC, id DESC
    LIMIT 1
  `).get(kind) as ReportImportRecord | undefined;

  return record ? mapRecord(record) : null;
}

export function insertReportImport(data: {
  kind: ReportKind;
  fileName: string;
  valueColumn: string;
  rowCount: number;
  totalValue: string;
  rows: StoredReportRow[];
  importedBy: number;
}): ReportImport {
  const result = db.prepare(`
    INSERT INTO report_imports
      (kind, file_name, value_column, row_count, total_value, rows_json, imported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.kind,
    data.fileName,
    data.valueColumn,
    data.rowCount,
    data.totalValue,
    JSON.stringify(data.rows),
    data.importedBy,
  );

  const inserted = db.prepare(`
    SELECT id, kind, file_name, value_column, row_count, total_value, rows_json, imported_at
    FROM report_imports
    WHERE id = ?
  `).get(Number(result.lastInsertRowid)) as ReportImportRecord;

  return mapRecord(inserted);
}
