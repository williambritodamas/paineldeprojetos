// Serviços de usuários.
// Centraliza as chamadas de gestão de usuários (somente admin).

import api from "./api";
import type {
  AtualizarUsuarioDTO,
  CriarUsuarioDTO,
  User,
} from "../types";

// GET /api/admin/users
export async function getUsers(): Promise<User[]> {
  const resposta = await api.get<User[]>("/admin/users");
  return resposta.data;
}

// POST /api/admin/users
export async function createUser(dados: CriarUsuarioDTO): Promise<User> {
  const resposta = await api.post<User>("/admin/users", dados);
  return resposta.data;
}

// PUT /api/admin/users/:id
export async function updateUser(
  id: number,
  dados: AtualizarUsuarioDTO
): Promise<User> {
  const resposta = await api.put<User>(`/admin/users/${id}`, dados);
  return resposta.data;
}

// DELETE /api/admin/users/:id
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}