// Hook para acessar os projetos administrativos com busca e filtro.

import { useState, useEffect, useCallback } from "react";
import type { FiltroProjeto, Project } from "../types";
import * as projectService from "../services/projectService";

export function useAdminProjects() {
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroProjeto>({
    busca: "",
    status: "todos",
  });

  const carregarProjetos = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await projectService.getAdminProjects(filtro);
      setProjetos(dados);
    } catch (erroAoCarregar) {
      setErro("Erro ao carregar os projetos.");
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  // Recarrega sempre que a busca ou o filtro mudar.
  useEffect(() => {
    carregarProjetos();
  }, [carregarProjetos]);

  return {
    projetos,
    carregando,
    erro,
    filtro,
    setFiltro,
    recarregar: carregarProjetos,
  };
}