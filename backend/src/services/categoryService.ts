// Serviço de categorias.
// Responsável pelas regras de negócio e acesso ao banco via Prisma.

import { prisma } from "../config";
import type { CriarCategoriaDTO, AtualizarCategoriaDTO } from "../types";

// Gera um slug a partir do nome.
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Lista todas as categorias.
export async function listarCategorias() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true } } },
  });
}

// Retorna uma categoria por ID.
export async function obterCategoria(id: number) {
  return prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { projects: true } } },
  });
}

// Cria uma nova categoria.
export async function criarCategoria(dados: CriarCategoriaDTO) {
  const slug = dados.slug?.trim() || gerarSlug(dados.name);

  return prisma.category.create({
    data: {
      name: dados.name.trim(),
      slug,
    },
  });
}

// Atualiza uma categoria existente.
export async function atualizarCategoria(
  id: number,
  dados: AtualizarCategoriaDTO
) {
  const existente = await prisma.category.findUnique({ where: { id } });

  if (!existente) {
    return null;
  }

  const dadosAtualizados: { name?: string; slug?: string } = {};

  if (dados.name !== undefined) {
    dadosAtualizados.name = dados.name.trim();
  }
  if (dados.slug !== undefined) {
    dadosAtualizados.slug = dados.slug?.trim() || gerarSlug(dados.name || existente.name);
  } else if (dados.name !== undefined) {
    dadosAtualizados.slug = gerarSlug(dados.name);
  }

  return prisma.category.update({
    where: { id },
    data: dadosAtualizados,
  });
}

// Exclui uma categoria existente.
export async function excluirCategoria(id: number): Promise<boolean> {
  const existente = await prisma.category.findUnique({ where: { id } });

  if (!existente) {
    return false;
  }

  // Desvincula projetos antes de excluir
  await prisma.project.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  await prisma.category.delete({ where: { id } });
  return true;
}
