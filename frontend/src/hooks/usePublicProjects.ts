// Hook para carregar os projetos públicos (ativos).

import { useState, useEffect, useCallback } from "react";
import type { Project } from "../types";
import * as projectService from "../services/projectService";

export function usePublicProjects() {
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await projectService.getProjects();
      setProjetos(dados);
    } catch (erroAoCarregar) {
      setErro("Erro ao carregar os projetos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { projetos, carregando, erro, recarregar: carregar };
}