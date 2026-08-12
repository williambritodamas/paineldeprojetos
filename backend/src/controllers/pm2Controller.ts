// Controller de operações PM2.
// Apenas usuários com papel "admin" acessam estas rotas.

import type { Response } from "express";
import type { RequisicaoAutenticada } from "../middlewares/authMiddleware";
import * as projectService from "../services/projectService";
import * as pm2Service from "../services/pm2Service";
import { erroHttp, ErroNegocio, sucessoHttp } from "../utils/helpers";
import type { ProjetoRetornoAdmin } from "../types/respostas";

// Localiza o projeto administrativo, respondendo erro quando inválido.
async function obterProjetoOuErro(
  req: RequisicaoAutenticada,
  res: Response
): Promise<ProjetoRetornoAdmin | null> {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return null;
  }

  const projeto = await projectService.obterProjetoAdmin(id);

  if (!projeto) {
    erroHttp(res, 404, "Projeto não encontrado.");
    return null;
  }

  return projeto;
}

// Trata erros de negócio e demais erros na resposta.
function tratarErro(res: Response, erro: unknown, mensagem: string): void {
  if (erro instanceof ErroNegocio) {
    erroHttp(res, erro.status, erro.message);
    return;
  }
  erroHttp(res, 500, mensagem);
}

// POST /api/admin/pm2/:id/enable
export async function habilitar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.habilitarAutostart(projeto);
    const atualizado = await projectService.atualizarProjeto(projeto.id, {
      autostart: true,
    });
    sucessoHttp(res, atualizado);
  } catch (erro) {
    tratarErro(
      res,
      erro,
      "Erro ao habilitar a inicialização automática. Verifique os logs do servidor."
    );
  }
}

// POST /api/admin/pm2/:id/disable
export async function desabilitar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.desabilitarAutostart(projeto);
    const atualizado = await projectService.atualizarProjeto(projeto.id, {
      autostart: false,
    });
    sucessoHttp(res, atualizado);
  } catch (erro) {
    tratarErro(
      res,
      erro,
      "Erro ao desabilitar a inicialização automática. Verifique os logs do servidor."
    );
  }
}

// POST /api/admin/pm2/:id/iniciar
export async function iniciar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.iniciarProcesso(projeto);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao iniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/:id/reiniciar
export async function reiniciar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.reiniciarProcesso(projeto);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao reiniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/:id/parar
export async function parar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.pararProcesso(projeto);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao parar o processo no PM2.");
  }
}