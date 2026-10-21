import type { Request, Response, NextFunction } from "express";
import { FRONTEND_ORIGINS } from "../config/frontendOrigin.js";

export function requireFrontendOrigin(req: Request, res: Response, next: NextFunction) {
  if (!FRONTEND_ORIGINS.has(req.get("origin") ?? "")) {
    return res.status(403).json({ message: "Origem da requisição não permitida" });
  }

  next();
}
