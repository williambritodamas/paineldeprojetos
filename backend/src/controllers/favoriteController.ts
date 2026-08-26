// Controller de favoritos.
// Expõe endpoints para gerenciar favoritos do usuário autenticado.

import { Request, Response } from "express";
import * as favoriteService from "../services/favoriteService";

// GET /api/favorites — retorna IDs dos projetos favoritos do usuário.
export async function listarFavoritos(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as any).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const projetosIds = await favoriteService.listarFavoritosDoUsuario(userId);
  res.json({ projetosIds });
}

// POST /api/favorites/:projectId — adiciona/remova dos favoritos (toggle).
export async function toggleFavorito(
  req: Request,
  res: Response
): Promise<void> {
  const userId = (req as any).userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }

  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "ID do projeto inválido." });
    return;
  }

  const jaFavorito = await favoriteService.isFavorito(userId, projectId);

  if (jaFavorito) {
    await favoriteService.removerFavorito(userId, projectId);
    res.json({ favorito: false });
  } else {
    await favoriteService.adicionarFavorito(userId, projectId);
    res.json({ favorito: true });
  }
}
