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