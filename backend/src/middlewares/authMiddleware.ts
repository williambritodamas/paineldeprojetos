// Middleware de autenticação.
// Protege as rotas administrativas exigindo um token JWT válido.

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { erroHttp } from "../utils/helpers";

export interface RequisicaoAutenticada extends Request {
  userId?: number;
  username?: string;
  userRole?: "admin" | "user";
}

// Verifica o token de autorização no cabeçalho e libera a requisição.
export function authMiddleware(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): void {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    erroHttp(res, 401, "Autenticação necessária.");
    return;
  }

  const token = cabecalho.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub?: number;
      username?: string;
      role?: string;
    };

    if (!payload.sub) {
      erroHttp(res, 401, "Autenticação necessária.");
      return;
    }

    req.userId = payload.sub;
    req.username = payload.username;
    req.userRole = payload.role === "admin" ? "admin" : "user";
    next();
  } catch {
    erroHttp(res, 401, "Sessão expirada ou inválida.");
  }
}