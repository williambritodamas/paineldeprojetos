// Middleware de autenticação.
// Protege as rotas administrativas exigindo um token JWT válido.
// O papel do usuário é consultado no banco a cada requisição,
// garantindo que mudanças de papel valham imediatamente e que
// tokens antigos (sem o campo role) continuem funcionando.

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config, prisma } from "../config";
import { erroHttp } from "../utils/helpers";

export interface RequisicaoAutenticada extends Request {
  userId?: number;
  username?: string;
  userRole?: "admin" | "user";
}

// Verifica o token de autorização no cabeçalho e libera a requisição.
export async function authMiddleware(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    // Autoridade: consulta o papel atual no banco (não confia no token).
    const usuario = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!usuario) {
      erroHttp(res, 401, "Usuário não encontrado.");
      return;
    }

    req.userId = usuario.id;
    req.username = usuario.username;
    req.userRole = usuario.role === "admin" ? "admin" : "user";
    next();
  } catch {
    erroHttp(res, 401, "Sessão expirada ou inválida.");
  }
}