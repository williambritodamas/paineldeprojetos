// Serviços de autenticação.
// Centraliza as chamadas relacionadas a login e usuário atual.

import api from "./api";
import type {
  LoginDTO,
  RespostaAutenticacao,
  User,
} from "../types";

// POST /api/auth/login
export async function login(dados: LoginDTO): Promise<RespostaAutenticacao> {
  const resposta = await api.post<RespostaAutenticacao>("/auth/login", dados);
  return resposta.data;
}

// GET /api/auth/me
export async function obterUsuarioAtual(): Promise<User> {
  const resposta = await api.get<User>("/auth/me");
  return resposta.data;
}