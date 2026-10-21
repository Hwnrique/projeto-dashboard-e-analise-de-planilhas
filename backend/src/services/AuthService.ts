import { findUserById, insertUser } from "../models/User.js";
import jwt from "jsonwebtoken";
import { findUserByLogin } from "../models/User.js";
import type { Cadastro, Login } from "../schemas/authSchema.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  createRefreshToken,
  findRefreshToken,
  removeRefreshToken,
  rotateToken,
} from "../models/RefreshToken.js";
import { REFRESH_TOKEN_TTL_MS } from "../config/authCookie.js";

export default class AuthService {
  static async cadastro(data: Cadastro) {
    const usuario = findUserByLogin(data.login);

    if (usuario) {
      throw new Error("Dados inválidos");
    }

    const hashSenha = await bcrypt.hash(data.senha, 10);

    const resultado = insertUser({
      ...data,
      senha: hashSenha,
      role: "user",
    });

    return {
      message: "Login Criado com Sucesso!",
      id: Number(resultado.lastInsertRowid),
    };
  }

  static async login(data: Login) {
    const usuario = findUserByLogin(data.login);

    if (!usuario) {
      throw new Error("Login ou senha inválidos");
    }

    const correctPassword = await bcrypt.compare(data.senha, usuario.senha);

    if (!correctPassword) {
      throw new Error("Login ou senha inválidos");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("Erro na requisição da URI");
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        login: usuario.login,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toString();

    createRefreshToken({
      token: refreshToken,
      usuario_id: usuario.id,
      expires_at: expiresAt,
    });

    return {
      message: "Login realizado com sucesso!",
      accessToken: token,
      user: { id: usuario.id, nome: usuario.nome, login: usuario.login, role: usuario.role },
      refreshToken,
    };
  }

  static refresh(refreshToken: string) {
    const token = findRefreshToken(refreshToken);

    if (!token) {
      throw new Error("Refresh token inválido");
    }

    const now = new Date();
    const expire = new Date(token.expires_at);

    if (expire <= now) {
      removeRefreshToken(refreshToken)
      throw new Error("Refresh token expirado");
    }

    const user = findUserById(token.usuario_id);

    if(!user) {
      throw new Error("Usuário não encontrado!")
    }

    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newExpiration = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toString();

    rotateToken(refreshToken, {
      token: newRefreshToken,
      usuario_id: token.usuario_id,
      expires_at: newExpiration
    })

    const accessToken = jwt.sign(
      {
        id: user.id,
        login: user.login
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "15m",
      },
    );

    return {
      accessToken,
      refreshToken: newRefreshToken
    }; 
  }

  static logout(refreshToken: string) {

    removeRefreshToken(refreshToken);

    return {message: "Logout efetuado com sucesso"}

  }
}
