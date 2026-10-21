import db from "../../database/data.js";

export type Operator = {
  code: string;
  fullName: string;
};

export function listOperators(): Operator[] {
  const rows = db.prepare(`
    SELECT codigo, nome_completo
    FROM Operadores
    ORDER BY nome_completo COLLATE NOCASE, codigo
  `).all() as { codigo: string; nome_completo: string }[];

  return rows.map((row) => ({ code: row.codigo, fullName: row.nome_completo }));
}

export function findOperatorNames(): Map<string, string> {
  const rows = db.prepare(`SELECT codigo, nome_completo FROM Operadores`).all() as {
    codigo: string;
    nome_completo: string;
  }[];
  return new Map(rows.map((row) => [row.codigo, row.nome_completo]));
}

export function saveOperator(data: Operator): Operator {
  db.prepare(`
    INSERT INTO Operadores (codigo, nome_completo)
    VALUES (?, ?)
    ON CONFLICT(codigo) DO UPDATE SET nome_completo = excluded.nome_completo
  `).run(data.code, data.fullName);

  return data;
}
