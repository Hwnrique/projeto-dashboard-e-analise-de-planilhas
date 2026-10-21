import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  findLatestReportImport,
  insertReportImport,
  type ReportImport,
  type ReportKind,
  type StoredReportRow,
} from "../models/ReportImport.js";

const execFileAsync = promisify(execFile);
const supportedExtensions = new Set([".csv", ".xls", ".xlsx", ".xlsm"]);
const reportPrefixes: Record<ReportKind, string> = {
  pix: "PESQUISA_TRANSACOES_DETALHES_",
  recarga: "RELATORIO_RECARGA_CELULAR_",
};

type PythonReport = {
  kind: ReportKind;
  fileName: string;
  valueColumn: string;
  rowCount: number;
  totalValue: string;
  rows: StoredReportRow[];
};

export class ReportImportError extends Error {}

function findPythonScript(): string {
  const moduleDirectory = fileURLToPath(new URL(".", import.meta.url));
  const candidates = [
    resolve(process.cwd(), "python", "read_report_cli.py"),
    resolve(process.cwd(), "..", "python", "read_report_cli.py"),
    resolve(moduleDirectory, "../../../python/read_report_cli.py"),
    resolve(moduleDirectory, "../../../../python/read_report_cli.py"),
  ];
  const script = candidates.find((candidate) => existsSync(candidate));
  if (!script) throw new Error("Não foi possível localizar o leitor Python de relatórios");
  return script;
}

function findPythonExecutable(script: string): string {
  if (process.env.PYTHON_EXECUTABLE) return process.env.PYTHON_EXECUTABLE;
  const projectRoot = resolve(script, "..", "..");
  const virtualEnvPython = process.platform === "win32"
    ? resolve(projectRoot, ".venv", "Scripts", "python.exe")
    : resolve(projectRoot, ".venv", "bin", "python");
  return existsSync(virtualEnvPython) ? virtualEnvPython : "python";
}

function safeOriginalName(rawName: string): string {
  let decodedName: string;
  try {
    decodedName = decodeURIComponent(rawName);
  } catch {
    throw new ReportImportError("Nome do arquivo inválido");
  }
  return basename(decodedName.replaceAll("\\", "/"));
}

export default class ReportImportService {
  static latest(kind: ReportKind): ReportImport | null {
    return findLatestReportImport(kind);
  }

  static async importReport(
    kind: ReportKind,
    rawFileName: string,
    content: Buffer,
    importedBy: number,
  ): Promise<ReportImport> {
    const fileName = safeOriginalName(rawFileName);
    const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

    if (!fileName.startsWith(reportPrefixes[kind])) {
      throw new ReportImportError("O arquivo não corresponde ao relatório desta página");
    }
    if (!supportedExtensions.has(extension)) {
      throw new ReportImportError("Formato inválido. Envie CSV, XLS, XLSX ou XLSM");
    }
    if (content.length === 0) throw new ReportImportError("O arquivo está vazio");

    const script = findPythonScript();
    const python = findPythonExecutable(script);
    const temporaryDirectory = await mkdtemp(join(tmpdir(), "fcx-report-"));
    const temporaryFile = join(temporaryDirectory, `report${extension}`);

    try {
      await writeFile(temporaryFile, content);
      const { stdout } = await execFileAsync(
        python,
        [script, temporaryFile, kind, fileName],
        { cwd: resolve(script, "..", ".."), maxBuffer: 10 * 1024 * 1024, timeout: 60_000 },
      );
      const report = JSON.parse(stdout) as PythonReport;
      return insertReportImport({
        ...report,
        importedBy,
      });
    } catch (error) {
      if (error instanceof ReportImportError) throw error;
      const stderr = typeof error === "object" && error !== null && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "").trim()
        : "";
      if (stderr) throw new ReportImportError(stderr);
      throw new ReportImportError("Não foi possível processar o relatório enviado");
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
}
