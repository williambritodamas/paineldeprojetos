// Serviços de projetos.
// Centraliza todas as chamadas relacionadas aos projetos.

import api from "./api";
import type {
  AtualizarProjetoDTO,
  CriarProjetoDTO,
  FiltroProjeto,
  Project,
} from "../types";

// GET /api/projects — públicos, retorna projetos ativos.
export async function getProjects(): Promise<Project[]> {
  const resposta = await api.get<Project[]>("/projects");
  return resposta.data;
}

// GET /api/admin/projects — administrativo, permite busca e filtro.
export async function getAdminProjects(
  filtro?: FiltroProjeto
): Promise<Project[]> {
  const resposta = await api.get<Project[]>("/admin/projects", {
    params: filtro,
  });
  return resposta.data;
}

// GET /api/projects/:id
export async function getProject(id: number): Promise<Project> {
  const resposta = await api.get<Project>(`/projects/${id}`);
  return resposta.data;
}

// POST /api/projects
export async function createProject(
  dados: CriarProjetoDTO
): Promise<Project> {
  const resposta = await api.post<Project>("/projects", dados);
  return resposta.data;
}

// PUT /api/projects/:id
export async function updateProject(
  id: number,
  dados: AtualizarProjetoDTO
): Promise<Project> {
  const resposta = await api.put<Project>(`/projects/${id}`, dados);
  return resposta.data;
}

// DELETE /api/projects/:id
export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}

// Resposta das ações de PM2. "selfGerenciado" indica que o alvo era o
// próprio processo do painel (recriado pelo helper destacado no servidor).
export interface RespostaAcaoPm2 {
  ok?: boolean;
  selfGerenciado?: boolean;
}

// POST /api/admin/pm2/:id/enable
export async function habilitarAutostart(
  id: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(`/admin/pm2/${id}/enable`);
  return resposta.data;
}

// POST /api/admin/pm2/:id/disable
export async function desabilitarAutostart(
  id: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(`/admin/pm2/${id}/disable`);
  return resposta.data;
}

// POST /api/admin/pm2/:id/iniciar
export async function iniciarProcessoPm2(
  id: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(
    `/admin/pm2/${id}/iniciar`
  );
  return resposta.data;
}

// POST /api/admin/pm2/:id/reiniciar
export async function reiniciarProcessoPm2(
  id: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(
    `/admin/pm2/${id}/reiniciar`
  );
  return resposta.data;
}

// POST /api/admin/pm2/:id/parar
export async function pararProcessoPm2(id: number): Promise<void> {
  await api.post(`/admin/pm2/${id}/parar`);
}

// POST /api/admin/pm2/processos/:processId/iniciar
export async function iniciarProcessoExtra(
  processId: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(
    `/admin/pm2/processos/${processId}/iniciar`
  );
  return resposta.data;
}

// POST /api/admin/pm2/processos/:processId/reiniciar
export async function reiniciarProcessoExtra(
  processId: number
): Promise<RespostaAcaoPm2> {
  const resposta = await api.post<RespostaAcaoPm2>(
    `/admin/pm2/processos/${processId}/reiniciar`
  );
  return resposta.data;
}

// POST /api/admin/pm2/processos/:processId/parar
export async function pararProcessoExtra(processId: number): Promise<void> {
  await api.post(`/admin/pm2/processos/${processId}/parar`);
}