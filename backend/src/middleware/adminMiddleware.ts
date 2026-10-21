import type { Request, Response, NextFunction } from "express";
import { findUserById } from "../models/User.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      message: "Não autenticado",
    });
  }

  const usuario = findUserById(req.user.id);

  if (!usuario) {
    return res.status(401).json({
      message: "Usuário não encontrado",
    });
  }

  if (usuario.role !== "admin") {
    return res.status(403).json({
      message: "Acesso permitido somente a admins",
    });
  }

  next();
}
