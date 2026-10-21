import Database from "better-sqlite3";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const pastaAtual = dirname(fileURLToPath(import.meta.url));
const caminhoDoBanco = resolve(pastaAtual, "database.db");

const db:Database.Database = new Database(caminhoDoBanco);

db.exec(`
    -- Contas da aplicação e seus papéis de acesso.
    CREATE TABLE IF NOT EXISTS testecpd (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    login TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK 
    (role IN ('user', 'admin'))
    );

    -- Refresh tokens são persistidos para permitir renovação e encerramento de sessão.
    CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    usuario_id INTERGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (usuario_id)
    REFERENCES testecpd(id)
    ON DELETE CASCADE
    );

    -- Liga o código de operador da planilha ao nome completo exibido nos dashboards.
    CREATE TABLE IF NOT EXISTS Operadores (
    codigo TEXT PRIMARY KEY NOT NULL,
    nome_completo TEXT NOT NULL
    );

    -- Guarda cada importação e suas linhas, além de qual conta enviou o arquivo.
    CREATE TABLE IF NOT EXISTS report_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL CHECK (kind IN ('pix', 'recarga')),
    file_name TEXT NOT NULL,
    value_column TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    total_value TEXT NOT NULL,
    rows_json TEXT NOT NULL,
    imported_by INTEGER,
    imported_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (imported_by) REFERENCES testecpd(id) ON DELETE SET NULL
    );

    -- A consulta da importação mais recente usa este índice composto.
    CREATE INDEX IF NOT EXISTS idx_report_imports_latest
    ON report_imports(kind, imported_at DESC, id DESC);

    -- Uma meta atual por tipo; os padrões são 5.000 Pix e R$ 40.000 de Recarga.
    CREATE TABLE IF NOT EXISTS dashboard_goals (
    kind TEXT PRIMARY KEY NOT NULL CHECK (kind IN ('pix', 'recarga')),
    target_value TEXT NOT NULL
    );

    INSERT INTO dashboard_goals (kind, target_value) VALUES ('pix', '5000')
    ON CONFLICT(kind) DO NOTHING;

    INSERT INTO dashboard_goals (kind, target_value) VALUES ('recarga', '40000')
    ON CONFLICT(kind) DO NOTHING;
`);

db.pragma("foreign_keys = ON");

export default db;
