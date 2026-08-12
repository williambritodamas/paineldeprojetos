// Serviço de usuários.
// Responsável pelas regras de negócio de criação, edição e exclusão de usuários.

import bcrypt from "bcryptjs";
import { prisma } from "../config";
import type { AtualizarUsuarioDTO, CriarUsuarioDTO } from "../types";
import type { UsuarioRetorno } from "../types/respostas";

// Erro de negócio com status HTTP próprio para ser tratado no controller.
export class ErroNegocio extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

function montarUsuarioRetorno(usuario: {
  id: number;
  name: string;
  username: string;
  role: string;
}): UsuarioRetorno {
  return {
    id: usuario.id,
    name: usuario.name,
    username: usuario.username,
    role: usuario.role === "admin" ? "admin" : "user",
  };
}

// Lista todos os usuários cadastrados.
export async function listarUsuarios(): Promise<UsuarioRetorno[]> {
  const usuarios = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });
  return usuarios.map(montarUsuarioRetorno);
}

// Cria um novo usuário com senha protegida por bcrypt.
export async function criarUsuario(
  dados: CriarUsuarioDTO
): Promise<UsuarioRetorno> {
  const username = dados.username.trim();

  const existente = await prisma.user.findUnique({ where: { username } });
  if (existente) {
    throw new ErroNegocio(409, "Usuário já cadastrado.");
  }

  const senhaHash = await bcrypt.hash(dados.password, 10);

  const usuario = await prisma.user.create({
    data: {
      name: dados.name.trim(),
      username,
      password: senhaHash,
      role: dados.role,
    },
  });

  return montarUsuarioRetorno(usuario);
}

// Atualiza um usuário existente.
// O id do usuário logado impede que ele próprio seja rebaixado de admin.
export async function atualizarUsuario(
  id: number,
  dados: AtualizarUsuarioDTO,
  usuarioLogadoId: number
): Promise<UsuarioRetorno> {
  const existente = await prisma.user.findUnique({ where: { id } });

  if (!existente) {
    throw new ErroNegocio(404, "Usuário não encontrado.");
  }

  if (dados.username !== undefined) {
    const username = dados.username.trim();

    const comMesmoUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (comMesmoUsername && comMesmoUsername.id !== id) {
      throw new ErroNegocio(409, "Usuário já cadastrado.");
    }
  }

  if (
    dados.role === "user" &&
    existente.role === "admin" &&
    existente.id === usuarioLogadoId
  ) {
    throw new ErroNegocio(
      400,
      "Você não pode remover o próprio papel de administrador."
    );
  }

  const dadosAtualizados: {
    name?: string;
    username?: string;
    password?: string;
    role?: "admin" | "user";
  } = {};

  if (dados.name !== undefined) {
    dadosAtualizados.name = dados.name.trim();
  }
  if (dados.username !== undefined) {
    dadosAtualizados.username = dados.username.trim();
  }
  if (dados.password !== undefined) {
    dadosAtualizados.password = await bcrypt.hash(dados.password, 10);
  }
  if (dados.role !== undefined) {
    dadosAtualizados.role = dados.role;
  }

  const usuario = await prisma.user.update({
    where: { id },
    data: dadosAtualizados,
  });

  return montarUsuarioRetorno(usuario);
}

// Exclui um usuário existente.
// Impede excluir o próprio usuário logado e o último administrador.
export async function excluirUsuario(
  id: number,
  usuarioLogadoId: number
): Promise<void> {
  if (id === usuarioLogadoId) {
    throw new ErroNegocio(400, "Você não pode excluir o próprio usuário.");
  }

  const existente = await prisma.user.findUnique({ where: { id } });

  if (!existente) {
    throw new ErroNegocio(404, "Usuário não encontrado.");
  }

  if (existente.role === "admin") {
    const totalAdmins = await prisma.user.count({
      where: { role: "admin" },
    });

    if (totalAdmins <= 1) {
      throw new ErroNegocio(
        400,
        "Não é possível excluir o último administrador."
      );
    }
  }

  await prisma.user.delete({ where: { id } });
}