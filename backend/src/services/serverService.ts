// Serviço de servidores.
// Responsável pelas regras de negócio e acesso ao banco via Prisma.

import { prisma } from "../config";
import type { CriarServidorDTO, AtualizarServidorDTO } from "../types";

// Lista todos os servidores.
export async function listarServidores() {
  return prisma.server.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  });
}

// Retorna um servidor por ID.
export async function obterServidor(id: number) {
  return prisma.server.findUnique({
    where: { id },
    include: { _count: { select: { projects: true } } },
  });
}

// Cria um novo servidor.
export async function criarServidor(dados: CriarServidorDTO) {
  return prisma.server.create({
    data: {
      name: dados.name.trim(),
      host: dados.host?.trim() || null,
      description: dados.description?.trim() || null,
    },
  });
}

// Atualiza um servidor existente.
export async function atualizarServidor(
  id: number,
  dados: AtualizarServidorDTO
) {
  const existente = await prisma.server.findUnique({ where: { id } });

  if (!existente) {
    return null;
  }

  const dadosAtualizados: { name?: string; host?: string | null; description?: string | null } = {};

  if (dados.name !== undefined) {
    dadosAtualizados.name = dados.name.trim();
  }
  if (dados.host !== undefined) {
    dadosAtualizados.host = dados.host?.trim() || null;
  }
  if (dados.description !== undefined) {
    dadosAtualizados.description = dados.description?.trim() || null;
  }

  return prisma.server.update({
    where: { id },
    data: dadosAtualizados,
  });
}

// Exclui um servidor existente.
export async function excluirServidor(id: number): Promise<boolean> {
  const existente = await prisma.server.findUnique({ where: { id } });

  if (!existente) {
    return false;
  }

  // Desvincula projetos antes de excluir
  await prisma.project.updateMany({
    where: { serverId: id },
    data: { serverId: null },
  });

  await prisma.server.delete({ where: { id } });
  return true;
}
