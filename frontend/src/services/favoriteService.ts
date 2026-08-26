// Serviços de favoritos.
// Centraliza todas as chamadas relacionadas aos favoritos.

import api from "./api";

// GET /api/favorites — retorna IDs dos projetos favoritos do usuário.
export async function getFavoritos(): Promise<number[]> {
  const resposta = await api.get<{ projetosIds: number[] }>("/favorites");
  return resposta.data.projetosIds;
}

// POST /api/favorites/:projectId — alterna favorito (adiciona/remove).
export async function toggleFavorito(projectId: number): Promise<boolean> {
  const resposta = await api.post<{ favorito: boolean }>(
    `/favorites/${projectId}`
  );
  return resposta.data.favorito;
}
