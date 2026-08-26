// Serviços de health check.
// Centraliza todas as chamadas relacionadas ao monitoramento de portas.

import api from "./api";

export interface StatusPorta {
  projectId: number;
  port: number;
  host: string;
  aberta: boolean;
  latenciaMs: number | null;
  verificadoEm: string;
}

// GET /api/health/ports — verifica todas as portas ativas.
export async function getPortStatus(): Promise<StatusPorta[]> {
  const resposta = await api.get<StatusPorta[]>("/health/ports");
  return resposta.data;
}

// GET /api/health/ports/:projectId — verifica a porta de um projeto.
export async function getPortStatusByProject(
  projectId: number
): Promise<StatusPorta> {
  const resposta = await api.get<StatusPorta>(`/health/ports/${projectId}`);
  return resposta.data;
}
