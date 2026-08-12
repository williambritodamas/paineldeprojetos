// Utilitários do servidor.

import type { Request, Response } from "express";
import type { RespostaAutenticacao } from "../types";
import jwt from "jsonwebtoken";
import { config } from "../config";

// Envia uma resposta de erro padronizada.
export function erroHttp(
  res: Response,
  status: number,
  mensagem: string
): Response {
  return res.status(status).json({ error: mensagem });
}

// Envia uma resposta de sucesso padronizada.
export function sucessoHttp<T>(res: Response, dados: T): Response {
  return res.json(dados);
}

// Gera o token JWT para o usuário autenticado.
export function gerarToken(
  usuario: { id: number; username: string; role: "admin" | "user" }
): RespostaAutenticacao["token"] {
  return jwt.sign(
    { sub: usuario.id, username: usuario.username, role: usuario.role },
    config.jwtSecret,
    { expiresIn: "8h" }
  );
}

// Lê o corpo da requisição com segurança (evita payloads inválidos).
export function lerCorpo(req: Request): Record<string, unknown> {
  if (typeof req.body !== "object" || req.body === null) {
    return {};
  }
  return req.body;
}

// Erro de negócio com status HTTP próprio, tratado nos controllers.
export class ErroNegocio extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}