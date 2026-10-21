import type { Request, Response } from "express";
import UserService from "../services/UserService.js";
import { deleteUserById, findPublicUserById, listUsers } from "../models/User.js";

export default class UserController {
  static me(req: Request, res: Response) {
    const user = req.user ? findPublicUserById(req.user.id) : undefined;
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    return res.json(user);
  }

  static list(_req: Request, res: Response) {
    return res.json(listUsers());
  }

  static async update(req: Request, res: Response) {
    const actorId = req.user?.id;
    const targetId = Number(req.params.id);
    const { nome, login, senha } = req.body;

    if (!actorId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!nome || !login || !senha) {
      return res.status(400).json({
        message: "Nome, login e senha são obrigatórios",
      });
    }

    const resultado = await UserService.updateUser(actorId, targetId, {
      nome,
      login,
      senha,
    });

    if (resultado.tipo === "actor-inexistente") {
      return res.status(401).json({ message: "Usuário autenticado não encontrado" });
    }

    if (resultado.tipo === "target-inexistente") {
      return res.status(404).json({ message: "Usuário alvo não encontrado" });
    }

    if (resultado.tipo === "proibido") {
      return res.status(403).json({
        message: "Sem permissão para alterar esta conta",
      });
    }

    return res.json({ message: "Usuário atualizado com sucesso" });
  }

  static remove(req: Request, res: Response) {
    const id = req.params.id;

    if(typeof id !== 'string') {
      return res.status(400).json({
        message: "Id inválido"
      })
    }

    const userId = Number(id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const resultado = deleteUserById(userId);

    if (resultado.changes === 0) {
      return res.status(404).json({ message: "Usuário não encontrado!" });
    }

    return res.json({ message: "Usuário Deletado" });
  }
}
