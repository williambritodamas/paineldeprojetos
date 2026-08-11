// Serviço de autenticação.
// Responsável por validar credenciais e gerar o token JWT.

import bcrypt from "bcryptjs";
import { prisma } from "../config";
import type { LoginDTO } from "../types";
import { gerarToken } from "../utils/helpers";
import type { RespostaLogin, UsuarioRetorno } from "../types/respostas";

function montarUsuarioRetorno(usuario: {
  id: number;
  name: string;
  username: string;
}): UsuarioRetorno {
  return {
    id: usuario.id,
    name: usuario.name,
    username: usuario.username,
  };
}

// Autentica o usuário com usuário e senha.
export async function autenticar(dados: LoginDTO): Promise<RespostaLogin> {
  const usuario = await prisma.user.findUnique({
    where: { username: dados.username.trim() },
  });

  if (!usuario) {
    throw new Error("Usuário ou senha inválidos.");
  }

  const senhaConfere = await bcrypt.compare(dados.password, usuario.password);

  if (!senhaConfere) {
    throw new Error("Usuário ou senha inválidos.");
  }

  const token = gerarToken({ id: usuario.id, username: usuario.username });

  return {
    token,
    user: montarUsuarioRetorno(usuario),
  };
}

// Retorna os dados públicos do usuário autenticado.
export async function obterUsuarioAtual(
  id: number
): Promise<UsuarioRetorno | null> {
  const usuario = await prisma.user.findUnique({ where: { id } });

  if (!usuario) {
    return null;
  }

  return montarUsuarioRetorno(usuario);
}