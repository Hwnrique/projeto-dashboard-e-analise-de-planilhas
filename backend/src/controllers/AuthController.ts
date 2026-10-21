import type { Request, Response } from "express";
import {
  REFRESH_COOKIE_NAME,
  refreshCookieClearOptions,
  refreshCookieOptions,
} from "../config/authCookie.js";
import AuthService from "../services/AuthService.js";
import { readCookie } from "../utils/cookies.js";

export default class AuthController {
  static async cadastro(req: Request, res: Response) {
    try {
      const resultado = await AuthService.cadastro(req.body);
      return res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const resultado = await AuthService.login(req.body);
      const { refreshToken, ...resposta } = resultado;

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
      return res.status(200).json(resposta);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  static refresh(req: Request, res: Response) {
    const refreshToken = readCookie(req.headers.cookie, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token ausente" });
    }

    try {
      const resultado = AuthService.refresh(refreshToken);
      const { refreshToken: novoRefreshToken, accessToken } = resultado;

      res.cookie(REFRESH_COOKIE_NAME, novoRefreshToken, refreshCookieOptions);
      return res.status(200).json({ accessToken });
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieClearOptions);

      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }

      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  static logout(req: Request, res: Response) {
    const refreshToken = readCookie(req.headers.cookie, REFRESH_COOKIE_NAME);

    try {
      if (refreshToken) {
        AuthService.logout(refreshToken);
      }

      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieClearOptions);
      return res.status(200).json({ message: "Logout efetuado com sucesso" });
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieClearOptions);

      if (error instanceof Error) {
        return res.status(401).json({ message: error.message });
      }

      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
}
