// Serviços de servidores.
// Centraliza todas as chamadas relacionadas aos servidores.

import api from "./api";
import type { Server } from "../types";

// GET /api/servers — públicas, retorna todos os servidores.
export async function getServers(): Promise<Server[]> {
  const resposta = await api.get<Server[]>("/servers");
  return resposta.data;
}

// GET /api/servers/:id
export async function getServer(id: number): Promise<Server> {
  const resposta = await api.get<Server>(`/servers/${id}`);
  return resposta.data;
}

// POST /api/servers — requer admin.
export async function createServer(
  dados: { name: string; host?: string; description?: string }
): Promise<Server> {
  const resposta = await api.post<Server>("/servers", dados);
  return resposta.data;
}

// PUT /api/servers/:id — requer admin.
export async function updateServer(
  id: number,
  dados: { name?: string; host?: string; description?: string }
): Promise<Server> {
  const resposta = await api.put<Server>(`/servers/${id}`, dados);
  return resposta.data;
}

// DELETE /api/servers/:id — requer admin.
export async function deleteServer(id: number): Promise<void> {
  await api.delete(`/servers/${id}`);
}
