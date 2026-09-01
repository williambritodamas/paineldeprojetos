// Hook para monitorar commits git dos projetos com polling.

import { useState, useEffect, useCallback, useRef } from "react";
import type { GitCommit } from "../services/gitService";
import * as gitService from "../services/gitService";

interface Options {
  intervalMs?: number;
  enabled?: boolean;
}

export function useGitCommits(options: Options = {}) {
  const { intervalMs = 60000, enabled = true } = options;
  const [commits, setCommits] = useState<
    Record<number, GitCommit[]>
  >({});
  const [carregando, setCarregando] = useState(true);
  const [ultimaVerificacao, setUltimaVerificacao] = useState<Date | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verificarCommits = useCallback(async () => {
    try {
      const updates = await gitService.checkAllUpdates();
      const resultados: Record<number, GitCommit[]> = {};
      await Promise.all(
        updates.map(async (u) => {
          try {
            const c = await gitService.getRecentCommits(u.projectId);
            if (c) {
              resultados[u.projectId] = c;
            }
          } catch { /* ignora */ }
        })
      );
      setCommits(resultados);
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

    verificarCommits();

    intervaloRef.current = setInterval(verificarCommits, intervalMs);

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [verificarCommits, intervalMs, enabled]);

  const getCommitsProjeto = useCallback(
    (projectId: number): GitCommit[] | undefined => {
      return commits[projectId];
    },
    [commits]
  );

  return {
    commits,
    carregando,
    ultimaVerificacao,
    getCommitsProjeto,
    verificarAgora: verificarCommits,
  };
}