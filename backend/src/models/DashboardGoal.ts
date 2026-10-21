import db from "../../database/data.js";
import type { ReportKind } from "./ReportImport.js";

export type DashboardGoal = {
  kind: ReportKind;
  targetValue: string;
};

const defaultGoals: Record<ReportKind, string> = {
  pix: "5000",
  recarga: "40000",
};

export function findDashboardGoal(kind: ReportKind): DashboardGoal {
  const record = db.prepare(`
    SELECT kind, target_value FROM dashboard_goals WHERE kind = ?
  `).get(kind) as { kind: ReportKind; target_value: string } | undefined;

  return record
    ? { kind: record.kind, targetValue: record.target_value }
    : { kind, targetValue: defaultGoals[kind] };
}

export function saveDashboardGoal(kind: ReportKind, targetValue: number): DashboardGoal {
  const normalizedTarget = String(targetValue);
  db.prepare(`
    INSERT INTO dashboard_goals (kind, target_value)
    VALUES (?, ?)
    ON CONFLICT(kind) DO UPDATE SET target_value = excluded.target_value
  `).run(kind, normalizedTarget);

  return { kind, targetValue: normalizedTarget };
}
