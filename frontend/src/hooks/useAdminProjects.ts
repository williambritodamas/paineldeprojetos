// Hook para acessar os projetos administrativos com busca e filtro.

import { useState, useEffect, useCallback } from "react";
import type { FiltroProjeto, Project } from "../types";
import * as projectService from "../services/projectService";

const CHAVE_FILTRO_STORAGE = "painel_projetos_filtro";

function carregarFiltroSalvo(): FiltroProjeto {
  try {
    const salvo = localStorage.getItem(CHAVE_FILTRO_STORAGE);
    if (salvo) {
      const parseado = JSON.parse(salvo);
      return parseado;
    }
  } catch { /* ignora */ }
  return { busca: "", status: "todos" };
}

export function useAdminProjects() {
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroProjeto>(carregarFiltroSalvo);

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

  // Salva filtro no localStorage quando muda.
  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_FILTRO_STORAGE, JSON.stringify(filtro));
    } catch { /* ignora */ }
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