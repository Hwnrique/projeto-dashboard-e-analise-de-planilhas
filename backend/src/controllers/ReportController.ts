import type { Request, Response } from "express";
import ReportImportService, { ReportImportError } from "../services/ReportImportService.js";
import type { ReportKind } from "../models/ReportImport.js";
import { findDashboardGoal, saveDashboardGoal } from "../models/DashboardGoal.js";

function parseKind(value: string): ReportKind | null {
  return value === "pix" || value === "recarga" ? value : null;
}

export default class ReportController {
  static latest(req: Request, res: Response) {
    const kindParam = req.params.kind;
    const kind = parseKind(typeof kindParam === "string" ? kindParam : "");
    if (!kind) return res.status(404).json({ message: "Tipo de relatório não encontrado" });
    return res.json({
      report: ReportImportService.latest(kind),
      targetValue: findDashboardGoal(kind).targetValue,
    });
  }

  static updateGoal(req: Request, res: Response) {
    const kindParam = req.params.kind;
    const kind = parseKind(typeof kindParam === "string" ? kindParam : "");
    if (!kind) return res.status(404).json({ message: "Tipo de relatório não encontrado" });

    const targetValue = Number(req.body?.targetValue);
    if (!Number.isFinite(targetValue) || targetValue <= 0 || targetValue > 1_000_000_000) {
      return res.status(400).json({ message: "Informe uma meta maior que zero e válida" });
    }
    if (kind === "pix" && !Number.isInteger(targetValue)) {
      return res.status(400).json({ message: "A meta de Pix deve ser um número inteiro" });
    }

    return res.json({
      message: "Meta atualizada com sucesso",
      goal: saveDashboardGoal(kind, targetValue),
    });
  }

  static async upload(req: Request, res: Response) {
    const kindParam = req.params.kind;
    const kind = parseKind(typeof kindParam === "string" ? kindParam : "");
    if (!kind) return res.status(404).json({ message: "Tipo de relatório não encontrado" });

    const fileName = req.get("X-File-Name");
    if (!fileName || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Envie um arquivo válido" });
    }

    try {
      const report = await ReportImportService.importReport(
        kind,
        fileName,
        req.body,
        req.user!.id,
      );
      return res.status(201).json({ report });
    } catch (error) {
      if (error instanceof ReportImportError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Erro ao importar o relatório" });
    }
  }
}
