// Serviços de operações Git.
// Centraliza todas as chamadas relacionadas ao git.

import api from "./api";

export interface GitPullResult {
  message: string;
  output: string;
  warning?: string;
}

export type GitSeverity = "updated" | "available" | "critical" | "urgent";

export interface GitUpdatesInfo {
  projectId: number;
  hasUpdates: boolean;
  behind: number;
  ahead: number;
  currentBranch: string;
  remoteHash: string | null;
  localHash: string | null;
  daysBehind: number;
  severity: GitSeverity;
}

// GET /api/admin/git/updates — verifica atualizações de todos os projetos.
export async function checkAllUpdates(): Promise<GitUpdatesInfo[]> {
  const resposta = await api.get<GitUpdatesInfo[]>("/admin/git/updates");
  return resposta.data;
}

// GET /api/admin/git/:id/updates — verifica atualizações de um projeto.
export async function checkUpdates(projectId: number): Promise<GitUpdatesInfo> {
  const resposta = await api.get<GitUpdatesInfo>(
    `/admin/git/${projectId}/updates`
  );
  return resposta.data;
}

// POST /api/admin/git/:id/pull — executa git pull no projeto.
export async function gitPull(projectId: number): Promise<GitPullResult> {
  const resposta = await api.post<GitPullResult>(
    `/admin/git/${projectId}/pull`
  );
  return resposta.data;
}
