// Serviços de categorias.
// Centraliza todas as chamadas relacionadas às categorias.

import api from "./api";
import type { Category } from "../types";

// GET /api/categories — públicas, retorna todas as categorias.
export async function getCategories(): Promise<Category[]> {
  const resposta = await api.get<Category[]>("/categories");
  return resposta.data;
}

// GET /api/categories/:id
export async function getCategory(id: number): Promise<Category> {
  const resposta = await api.get<Category>(`/categories/${id}`);
  return resposta.data;
}

// POST /api/categories — requer admin.
export async function createCategory(
  dados: { name: string; slug?: string }
): Promise<Category> {
  const resposta = await api.post<Category>("/categories", dados);
  return resposta.data;
}

// PUT /api/categories/:id — requer admin.
export async function updateCategory(
  id: number,
  dados: { name?: string; slug?: string }
): Promise<Category> {
  const resposta = await api.put<Category>(`/categories/${id}`, dados);
  return resposta.data;
}

// DELETE /api/categories/:id — requer admin.
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
