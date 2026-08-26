// Service de favoritos.
// Gerencia a adição e remoção de projetos favoritos pelo usuário.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verifica se um projeto é favorito do usuário.
export async function isFavorito(
  userId: number,
  projectId: number
): Promise<boolean> {
  const favorito = await prisma.favorite.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
  return favorito !== null;
}

// Retorna todos os IDs de projetos favoritos do usuário.
export async function listarFavoritosDoUsuario(
  userId: number
): Promise<number[]> {
  const favoritos = await prisma.favorite.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return favoritos.map((f) => f.projectId);
}

// Adiciona um projeto aos favoritos do usuário.
export async function adicionarFavorito(
  userId: number,
  projectId: number
): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId },
    update: {},
  });
}

// Remove um projeto dos favoritos do usuário.
export async function removerFavorito(
  userId: number,
  projectId: number
): Promise<boolean> {
  try {
    await prisma.favorite.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    return true;
  } catch {
    return false;
  }
}
