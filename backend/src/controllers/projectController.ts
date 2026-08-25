// Controller de projetos.
// Recebe as requisições e delega para o serviço de projetos.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as projectService from "../services/projectService";
import * as pm2Service from "../services/pm2Service";
import { erroHttp, lerCorpo, sucessoHttp } from "../utils/helpers";
import { validarProjeto } from "../utils/validators";
import type { StatusProcesso } from "../services/pm2Service";
import type { OrdenacaoProjeto } from "../types";
import type { StatusPm2 } from "../types/respostas";

// Monta o status PM2 de um processo a partir do mapa de status.
function montarStatusProcesso(
  statusPorProcesso: Map<string, StatusProcesso>,
  pm2Disponivel: boolean,
  nomeProcessoPm2: string
): {
  pm2Status: StatusPm2;
  pm2Reinicios: number;
  pm2UptimeMs: number | null;
} {
  if (!pm2Disponivel) {
    return { pm2Status: "indisponivel", pm2Reinicios: 0, pm2UptimeMs: null };
  }

  const processo = statusPorProcesso.get(nomeProcessoPm2);

  return {
    pm2Status: processo ? processo.status : "nao_registrado",
    pm2Reinicios: processo?.reinicios ?? 0,
    pm2UptimeMs: processo?.uptimeMs ?? null,
  };
}

// Sanitiza a lista de processos adicionais vindos do corpo da requisição.
function sanitizarProcessos(
  processos: unknown,
  ehAdmin: boolean
): Array<{
  id?: number;
  label: string;
  folderPath: string;
  script?: string;
  port: number;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
}> | undefined {
  if (!ehAdmin || !Array.isArray(processos)) {
    return undefined;
  }

  return processos.map((processo) => {
    const corpo = processo as Record<string, unknown>;
    return {
      id: typeof corpo.id === "number" ? corpo.id : undefined,
      label: String(corpo.label),
      folderPath: String(corpo.folderPath),
      script:
        corpo.script !== undefined && corpo.script !== null
          ? String(corpo.script)
          : undefined,
      port: Number(corpo.port),
      env:
        typeof corpo.env === "string"
          ? corpo.env
          : corpo.env === null
            ? null
            : undefined,
      autorestart:
        typeof corpo.autorestart === "boolean" ? corpo.autorestart : undefined,
      restartDelay:
        typeof corpo.restartDelay === "number" ? corpo.restartDelay : undefined,
      maxRestarts:
        typeof corpo.maxRestarts === "number" ? corpo.maxRestarts : undefined,
      maxMemoryRestart:
        typeof corpo.maxMemoryRestart === "string"
          ? corpo.maxMemoryRestart
          : corpo.maxMemoryRestart === null
            ? null
            : undefined,
    };
  });
}

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
// Inclui o status atual de cada projeto no PM2.
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
    const orderByParam =
      typeof req.query.orderBy === "string"
        ? (req.query.orderBy as OrdenacaoProjeto)
        : undefined;

    const projetos = await projectService.listarProjetosComFiltro({
      busca: buscaParam,
      status: statusParam,
      orderBy: orderByParam,
    });

    // Status do PM2 é opcional: se o daemon estiver indisponível,
    // os projetos são retornados normalmente sem o detalhe.
    let statusPorProcesso: Map<string, StatusProcesso> = new Map();
    let pm2Disponivel = false;
    try {
      statusPorProcesso = await pm2Service.listarStatusPorProcesso();
      pm2Disponivel = true;
    } catch {
      // PM2 indisponível no momento.
    }

    const resultado = projetos.map((projeto) => {
      const principal = montarStatusProcesso(
        statusPorProcesso,
        pm2Disponivel,
        pm2Service.nomeProcesso({
          id: projeto.id,
          pm2Name: projeto.pm2Name,
        })
      );

      const processes = projeto.processes.map((processo) => ({
        ...processo,
        ...montarStatusProcesso(
          statusPorProcesso,
          pm2Disponivel,
          processo.pm2Name
        ),
      }));

      return {
        ...projeto,
        ...principal,
        processes,
      };
    });

    sucessoHttp(res, resultado);
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
    pm2Name: ehAdmin ? corpo.pm2Name : undefined,
    processes: ehAdmin ? corpo.processes : undefined,
    env: ehAdmin ? corpo.env : undefined,
    autorestart: ehAdmin ? corpo.autorestart : undefined,
    restartDelay: ehAdmin ? corpo.restartDelay : undefined,
    maxRestarts: ehAdmin ? corpo.maxRestarts : undefined,
    maxMemoryRestart: ehAdmin ? corpo.maxMemoryRestart : undefined,
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
      pm2Name:
        ehAdmin && typeof corpo.pm2Name === "string"
          ? corpo.pm2Name
          : ehAdmin && corpo.pm2Name === null
            ? null
            : undefined,
      processes: sanitizarProcessos(corpo.processes, ehAdmin),
      env:
        ehAdmin && typeof corpo.env === "string"
          ? corpo.env
          : ehAdmin && corpo.env === null
            ? null
            : undefined,
      autorestart:
        ehAdmin && typeof corpo.autorestart === "boolean"
          ? corpo.autorestart
          : undefined,
      restartDelay:
        ehAdmin && typeof corpo.restartDelay === "number"
          ? corpo.restartDelay
          : undefined,
      maxRestarts:
        ehAdmin && typeof corpo.maxRestarts === "number"
          ? corpo.maxRestarts
          : undefined,
      maxMemoryRestart:
        ehAdmin && typeof corpo.maxMemoryRestart === "string"
          ? corpo.maxMemoryRestart
          : ehAdmin && corpo.maxMemoryRestart === null
            ? null
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
    pm2Name: ehAdmin ? corpo.pm2Name : undefined,
    processes: ehAdmin ? corpo.processes : undefined,
    env: ehAdmin ? corpo.env : undefined,
    autorestart: ehAdmin ? corpo.autorestart : undefined,
    restartDelay: ehAdmin ? corpo.restartDelay : undefined,
    maxRestarts: ehAdmin ? corpo.maxRestarts : undefined,
    maxMemoryRestart: ehAdmin ? corpo.maxMemoryRestart : undefined,
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
      pm2Name:
        ehAdmin && typeof corpo.pm2Name === "string"
          ? corpo.pm2Name
          : ehAdmin && corpo.pm2Name === null
            ? null
            : undefined,
      processes: sanitizarProcessos(corpo.processes, ehAdmin),
      env:
        ehAdmin && typeof corpo.env === "string"
          ? corpo.env
          : ehAdmin && corpo.env === null
            ? null
            : undefined,
      autorestart:
        ehAdmin && typeof corpo.autorestart === "boolean"
          ? corpo.autorestart
          : undefined,
      restartDelay:
        ehAdmin && typeof corpo.restartDelay === "number"
          ? corpo.restartDelay
          : undefined,
      maxRestarts:
        ehAdmin && typeof corpo.maxRestarts === "number"
          ? corpo.maxRestarts
          : undefined,
      maxMemoryRestart:
        ehAdmin && typeof corpo.maxMemoryRestart === "string"
          ? corpo.maxMemoryRestart
          : ehAdmin && corpo.maxMemoryRestart === null
            ? null
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