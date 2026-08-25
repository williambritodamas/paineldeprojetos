// Hook para acessar as categorias disponíveis.

import { useState, useEffect, useCallback } from "react";
import type { Category } from "../types";
import * as categoryService from "../services/categoryService";

export function useCategories() {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarCategorias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await categoryService.getCategories();
      setCategorias(dados);
    } catch {
      setErro("Erro ao carregar categorias.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  return {
    categorias,
    carregando,
    erro,
    recarregar: carregarCategorias,
  };
}
