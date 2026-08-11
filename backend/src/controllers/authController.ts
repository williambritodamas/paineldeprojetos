// Controller de autenticação.
// Recebe as requisições e delega para o serviço de autenticação.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as authService from "../services/authService";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";
import { validarLogin } from "../utils/validators";
import type { LoginDTO } from "../types";

// POST /api/auth/login
export async function login(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const corpo = lerCorpo(req);
  const erro = validarLogin({
    username: corpo.username,
    password: corpo.password,
  });

  if (erro) {
    erroHttp(res, 400, erro);
    return;
  }

  try {
    const dadosLogin: LoginDTO = {
      username: String(corpo.username),
      password: String(corpo.password),
    };

    const resultado = await authService.autenticar(dadosLogin);
    sucessoHttp(res, resultado);
  } catch (erroLogin) {
    erroHttp(res, 401, "Usuário ou senha inválidos.");
  }
}

// GET /api/auth/me
export async function me(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  if (!req.userId) {
    erroHttp(res, 401, "Autenticação necessária.");
    return;
  }

  const usuario = await authService.obterUsuarioAtual(req.userId);

  if (!usuario) {
    erroHttp(res, 404, "Usuário não encontrado.");
    return;
  }

  sucessoHttp(res, usuario);
}