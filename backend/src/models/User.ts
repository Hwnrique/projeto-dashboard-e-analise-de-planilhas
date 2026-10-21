import db from "../../database/data.js";
import type { Cadastro, Login } from "../schemas/authSchema.js";

type Usuario = {
    id: number;
    nome: string,
    login: string,
    senha: string,
    role: "user" | "admin"
}

type NovoUsuario = Cadastro & {
  role: "user" | "admin"
}

export function insertUser(data: NovoUsuario) {
  const { nome, login, senha, role } = data;

  const command = db.prepare(
    `INSERT INTO testecpd (nome, login, senha, role) 
         VALUES (?, ?, ?, ?)
        `,
  );

  return command.run(nome, login, senha, role);
}

export function findUserByLogin(login: string) {
  const command = db.prepare(`SELECT * FROM testecpd WHERE login = ?`);

  return command.get(login) as Usuario | undefined;
}

export function findUserById(id: number) {

  const command = db.prepare(`SELECT * FROM testecpd WHERE id = ?`);

  return command.get(id) as Usuario | undefined;

}

export function listUsers() {
  const command = db.prepare(`SELECT id, nome, login, role FROM testecpd ORDER BY nome COLLATE NOCASE`);

  return command.all() as Pick<Usuario, "id" | "nome" | "login" | "role">[];
}

export function findPublicUserById(id: number) {
  const command = db.prepare(`SELECT id, nome, login, role FROM testecpd WHERE id = ?`);
  return command.get(id) as Pick<Usuario, "id" | "nome" | "login" | "role"> | undefined;
}

export function updateUserById(id: number, data: Pick<Usuario, "nome" | "login" | "senha">) {
  const command = db.prepare(`
    UPDATE testecpd
    SET nome = ?, login = ?, senha = ?
    WHERE id = ?
  `);

  return command.run(data.nome, data.login, data.senha, id);
}

export function deleteUserById(id: string | number) {
  const command = db.prepare(`DELETE FROM testecpd WHERE id = ?`);

  return command.run(id);
}
