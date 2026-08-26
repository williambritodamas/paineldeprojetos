// Hook para monitorar atualizações git dos projetos com polling.

import { useState, useEffect, useCallback, useRef } from "react";
import type { GitUpdatesInfo } from "../services/gitService";
import * as gitService from "../services/gitService";

interface Options {
  intervalMs?: number;
  enabled?: boolean;
}

export function useGitUpdates(options: Options = {}) {
  const { intervalMs = 60000, enabled = true } = options;
  const [statusUpdates, setStatusUpdates] = useState<GitUpdatesInfo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<Date | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verificarAtualizacoes = useCallback(async () => {
    try {
      const dados = await gitService.checkAllUpdates();
      setStatusUpdates(dados);
      setUltimaVerificacao(new Date());
    } catch {
      // Silencioso: não interrompe o polling em caso de erro
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setCarregando(false);
      return;
    }

    verificarAtualizacoes();

    intervaloRef.current = setInterval(verificarAtualizacoes, intervalMs);

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [verificarAtualizacoes, intervalMs, enabled]);

  const getStatusProjeto = useCallback(
    (projectId: number): GitUpdatesInfo | undefined => {
      return statusUpdates.find((s) => s.projectId === projectId);
    },
    [statusUpdates]
  );

  return {
    statusUpdates,
    carregando,
    ultimaVerificacao,
    getStatusProjeto,
    verificarAgora: verificarAtualizacoes,
  };
}
