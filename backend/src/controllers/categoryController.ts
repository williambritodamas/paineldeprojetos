// Controller de categorias.
// Recebe as requisições e delega para o serviço de categorias.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as categoryService from "../services/categoryService";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";

// GET /api/categories — público: lista categorias.
export async function listar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  try {
    const categorias = await categoryService.listarCategorias();
    sucessoHttp(res, categorias);
  } catch {
    erroHttp(res, 500, "Erro ao listar categorias.");
  }
}

// GET /api/categories/:id — público.
export async function obter(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const categoria = await categoryService.obterCategoria(id);

    if (!categoria) {
      erroHttp(res, 404, "Categoria não encontrada.");
      return;
    }

    sucessoHttp(res, categoria);
  } catch {
    erroHttp(res, 500, "Erro ao obter a categoria.");
  }
}

// POST /api/admin/categories — requer admin.
export async function criar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const corpo = lerCorpo(req);

  if (!corpo.name || typeof corpo.name !== "string" || corpo.name.trim().length === 0) {
    erroHttp(res, 400, "O nome da categoria é obrigatório.");
    return;
  }

  try {
    const categoria = await categoryService.criarCategoria({
      name: String(corpo.name),
      slug: typeof corpo.slug === "string" ? corpo.slug : undefined,
    });
    sucessoHttp(res, categoria);
  } catch (erro: unknown) {
    const mensagem =
      erro instanceof Error && erro.message.includes("Unique constraint")
        ? "Já existe uma categoria com esse nome."
        : "Erro ao criar a categoria.";
    erroHttp(res, 500, mensagem);
  }
}

// PUT /api/admin/categories/:id — requer admin.
export async function atualizar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  const corpo = lerCorpo(req);

  if (corpo.name !== undefined && (typeof corpo.name !== "string" || corpo.name.trim().length === 0)) {
    erroHttp(res, 400, "O nome da categoria é obrigatório.");
    return;
  }

  try {
    const categoria = await categoryService.atualizarCategoria(id, {
      name: corpo.name !== undefined ? String(corpo.name) : undefined,
      slug: corpo.slug !== undefined ? String(corpo.slug) : undefined,
    });

    if (!categoria) {
      erroHttp(res, 404, "Categoria não encontrada.");
      return;
    }

    sucessoHttp(res, categoria);
  } catch (erro: unknown) {
    const mensagem =
      erro instanceof Error && erro.message.includes("Unique constraint")
        ? "Já existe uma categoria com esse nome."
        : "Erro ao atualizar a categoria.";
    erroHttp(res, 500, mensagem);
  }
}

// DELETE /api/admin/categories/:id — requer admin.
export async function excluir(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const excluido = await categoryService.excluirCategoria(id);

    if (!excluido) {
      erroHttp(res, 404, "Categoria não encontrada.");
      return;
    }

    res.status(204).send();
  } catch {
    erroHttp(res, 500, "Erro ao excluir a categoria.");
  }
}
