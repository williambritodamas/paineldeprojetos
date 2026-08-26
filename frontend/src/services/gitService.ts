// Serviços de operações Git.
// Centraliza todas as chamadas relacionadas ao git.

import api from "./api";

export interface GitPullResult {
  message: string;
  output: string;
  warning?: string;
}

// POST /api/admin/git/:id/pull — executa git pull no projeto.
export async function gitPull(projectId: number): Promise<GitPullResult> {
  const resposta = await api.post<GitPullResult>(`/admin/git/${projectId}/pull`);
  return resposta.data;
}
