// Hook para gerenciar favoritos do usuário.

import { useState, useEffect, useCallback } from "react";
import * as favoriteService from "../services/favoriteService";

export function useFavorites() {
  const [favoritosIds, setFavoritosIds] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarFavoritos = useCallback(async () => {
    setCarregando(true);
    try {
      const ids = await favoriteService.getFavoritos();
      setFavoritosIds(ids);
    } catch {
      setFavoritosIds([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarFavoritos();
  }, [carregarFavoritos]);

  const toggleFavorito = useCallback(
    async (projectId: number) => {
      const agoraFavorito = await favoriteService.toggleFavorito(projectId);
      setFavoritosIds((ids) => {
        if (agoraFavorito) {
          return [...ids, projectId];
        }
        return ids.filter((id) => id !== projectId);
      });
      return agoraFavorito;
    },
    []
  );

  const isFavorito = useCallback(
    (projectId: number) => favoritosIds.includes(projectId),
    [favoritosIds]
  );

  return {
    favoritosIds,
    carregando,
    toggleFavorito,
    isFavorito,
    recarregar: carregarFavoritos,
  };
}
