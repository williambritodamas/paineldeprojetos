// Controller de projetos.
// Recebe as requisições e delega para o serviço de projetos.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as projectService from "../services/projectService";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";
import { validarProjeto } from "../utils/validators";

// GET /api/projects — público: exibe apenas projetos ativos.
export async function listar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  try {
    const projetos = await projectService.listarProjetosAtivos();
    sucessoHttp(res, projetos);
  } catch {
    erroHttp(res, 500, "Erro ao listar projetos.");
  }
}

// GET /api/admin/projects — administrativo: permite busca e filtro.
export async function listarAdministrativo(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  try {
    const buscaParam = typeof req.query.busca === "string" ? req.query.busca : "";
    const statusParam =
      typeof req.query.status === "string"
        ? (req.query.status as "todos" | "ativos" | "inativos")
        : "todos";

    const projetos = await projectService.listarProjetosComFiltro({
      busca: buscaParam,
      status: statusParam,
    });

    sucessoHttp(res, projetos);
  } catch {
    erroHttp(res, 500, "Erro ao listar projetos.");
  }
}

// GET /api/projects/:id — público.
export async function obter(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const projeto = await projectService.obterProjeto(id);

    if (!projeto) {
      erroHttp(res, 404, "Projeto não encontrado.");
      return;
    }

    sucessoHttp(res, projeto);
  } catch {
    erroHttp(res, 500, "Erro ao obter o projeto.");
  }
}

// POST /api/projects — requer autenticação.
// Campos de execução (PM2) são aceitos apenas para administradores.
export async function criar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const corpo = lerCorpo(req);
  const ehAdmin = req.userRole === "admin";

  const erro = validarProjeto({
    name: corpo.name,
    description: corpo.description,
    icon: corpo.icon,
    port: corpo.port,
    active: corpo.active,
    folderPath: ehAdmin ? corpo.folderPath : undefined,
    script: ehAdmin ? corpo.script : undefined,
    autostart: ehAdmin ? corpo.autostart : undefined,
  });

  if (erro) {
    erroHttp(res, 400, erro);
    return;
  }

  try {
    const projeto = await projectService.criarProjeto({
      name: String(corpo.name),
      description:
        corpo.description !== undefined && corpo.description !== null
          ? String(corpo.description)
          : null,
      icon:
        corpo.icon !== undefined && corpo.icon !== null ? String(corpo.icon) : null,
      port: Number(corpo.port),
      active: Boolean(corpo.active),
      folderPath:
        ehAdmin && typeof corpo.folderPath === "string"
          ? corpo.folderPath
          : null,
      script:
        ehAdmin && typeof corpo.script === "string"
          ? corpo.script
          : undefined,
      autostart:
        ehAdmin && typeof corpo.autostart === "boolean"
          ? corpo.autostart
          : undefined,
    });

    sucessoHttp(res, projeto);
  } catch (erroCriar) {
    erroHttp(res, 500, "Erro ao criar o projeto.");
  }
}

// PUT /api/projects/:id — requer autenticação.
// Campos de execução (PM2) são aceitos apenas para administradores.
export async function atualizar(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  const corpo = lerCorpo(req);
  const ehAdmin = req.userRole === "admin";

  const erro = validarProjeto({
    name: corpo.name,
    description: corpo.description,
    icon: corpo.icon,
    port: corpo.port,
    active: corpo.active,
    folderPath: ehAdmin ? corpo.folderPath : undefined,
    script: ehAdmin ? corpo.script : undefined,
    autostart: ehAdmin ? corpo.autostart : undefined,
  });

  if (erro) {
    erroHttp(res, 400, erro);
    return;
  }

  try {
    const projeto = await projectService.atualizarProjeto(id, {
      name: corpo.name !== undefined ? String(corpo.name) : undefined,
      description:
        corpo.description !== undefined && corpo.description !== null
          ? String(corpo.description)
          : corpo.description !== undefined && corpo.description === null
            ? ""
            : undefined,
      icon:
        corpo.icon !== undefined && corpo.icon !== null
          ? String(corpo.icon)
          : corpo.icon !== undefined && corpo.icon === null
            ? ""
            : undefined,
      port: corpo.port !== undefined ? Number(corpo.port) : undefined,
      active: corpo.active !== undefined ? Boolean(corpo.active) : undefined,
      folderPath:
        ehAdmin && typeof corpo.folderPath === "string"
          ? corpo.folderPath
          : ehAdmin && corpo.folderPath === null
            ? null
            : undefined,
      script:
        ehAdmin && typeof corpo.script === "string"
          ? corpo.script
          : undefined,
      autostart:
        ehAdmin && typeof corpo.autostart === "boolean"
          ? corpo.autostart
          : undefined,
    });

    if (!projeto) {
      erroHttp(res, 404, "Projeto não encontrado.");
      return;
    }

    sucessoHttp(res, projeto);
  } catch (erroAtualizar) {
    erroHttp(res, 500, "Erro ao atualizar o projeto.");
  }
}

// DELETE /api/projects/:id — requer autenticação.
export async function excluir(req: RequisicaoAutenticada, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return;
  }

  try {
    const excluido = await projectService.excluirProjeto(id);

    if (!excluido) {
      erroHttp(res, 404, "Projeto não encontrado.");
      return;
    }

    res.status(204).send();
  } catch (erroExcluir) {
    erroHttp(res, 500, "Erro ao excluir o projeto.");
  }
}