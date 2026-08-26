// Hook para acessar os servidores disponíveis.

import { useState, useEffect, useCallback } from "react";
import type { Server } from "../types";
import * as serverService from "../services/serverService";

export function useServers() {
  const [servidores, setServidores] = useState<Server[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarServidores = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await serverService.getServers();
      setServidores(dados);
    } catch {
      setErro("Erro ao carregar servidores.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarServidores();
  }, [carregarServidores]);

  return {
    servidores,
    carregando,
    erro,
    recarregar: carregarServidores,
  };
}
