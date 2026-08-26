// Hook para monitorar portas dos projetos com polling.

import { useState, useEffect, useCallback, useRef } from "react";
import type { StatusPorta } from "../services/healthService";
import * as healthService from "../services/healthService";

interface Options {
  intervalMs?: number;
  enabled?: boolean;
}

export function usePortMonitor(options: Options = {}) {
  const { intervalMs = 30000, enabled = true } = options;
  const [statusPortas, setStatusPortas] = useState<StatusPorta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<Date | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verificarPortas = useCallback(async () => {
    try {
      const dados = await healthService.getPortStatus();
      setStatusPortas(dados);
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

    verificarPortas();

    intervaloRef.current = setInterval(verificarPortas, intervalMs);

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [verificarPortas, intervalMs, enabled]);

  const getStatusProjeto = useCallback(
    (projectId: number): StatusPorta | undefined => {
      return statusPortas.find((s) => s.projectId === projectId);
    },
    [statusPortas]
  );

  return {
    statusPortas,
    carregando,
    ultimaVerificacao,
    getStatusProjeto,
    verificarAgora: verificarPortas,
  };
}
