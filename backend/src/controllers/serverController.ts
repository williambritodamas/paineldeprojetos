// Controller de servidores.
// Recebe as requisições e delega para o serviço de servidores.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as serverService from "../services/serverService";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";

// GET /api/servers — público: lista servidores.
export async function listar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  try {
    const servidores = await serverService.listarServidores();
    sucessoHttp(res, servidores);
  } catch {
    erroHttp(res, 500, "Erro ao listar servidores.");
  }
}

// GET /api/servers/:id — público.
export async function obter(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const servidor = await serverService.obterServidor(id);

    if (!servidor) {
      erroHttp(res, 404, "Servidor não encontrado.");
      return;
    }

    sucessoHttp(res, servidor);
  } catch {
    erroHttp(res, 500, "Erro ao obter o servidor.");
  }
}

// POST /api/admin/servers — requer admin.
export async function criar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const corpo = lerCorpo(req);

  if (!corpo.name || typeof corpo.name !== "string" || corpo.name.trim().length === 0) {
    erroHttp(res, 400, "O nome do servidor é obrigatório.");
    return;
  }

  try {
    const servidor = await serverService.criarServidor({
      name: String(corpo.name),
      host: typeof corpo.host === "string" ? corpo.host : undefined,
      description: typeof corpo.description === "string" ? corpo.description : undefined,
    });
    sucessoHttp(res, servidor);
  } catch (erro: unknown) {
    const mensagem =
      erro instanceof Error && erro.message.includes("Unique constraint")
        ? "Já existe um servidor com esse nome."
        : "Erro ao criar o servidor.";
    erroHttp(res, 500, mensagem);
  }
}

// PUT /api/admin/servers/:id — requer admin.
export async function atualizar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  const corpo = lerCorpo(req);

  if (corpo.name !== undefined && (typeof corpo.name !== "string" || corpo.name.trim().length === 0)) {
    erroHttp(res, 400, "O nome do servidor é obrigatório.");
    return;
  }

  try {
    const servidor = await serverService.atualizarServidor(id, {
      name: corpo.name !== undefined ? String(corpo.name) : undefined,
      host: corpo.host !== undefined ? String(corpo.host) : undefined,
      description: corpo.description !== undefined ? String(corpo.description) : undefined,
    });

    if (!servidor) {
      erroHttp(res, 404, "Servidor não encontrado.");
      return;
    }

    sucessoHttp(res, servidor);
  } catch (erro: unknown) {
    const mensagem =
      erro instanceof Error && erro.message.includes("Unique constraint")
        ? "Já existe um servidor com esse nome."
        : "Erro ao atualizar o servidor.";
    erroHttp(res, 500, mensagem);
  }
}

// DELETE /api/admin/servers/:id — requer admin.
export async function excluir(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const excluido = await serverService.excluirServidor(id);

    if (!excluido) {
      erroHttp(res, 404, "Servidor não encontrado.");
      return;
    }

    res.status(204).send();
  } catch {
    erroHttp(res, 500, "Erro ao excluir o servidor.");
  }
}
