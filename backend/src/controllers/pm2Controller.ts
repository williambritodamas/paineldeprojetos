// Controller de operações PM2.
// Apenas usuários com papel "admin" acessam estas rotas.
//
// O "Início automático" (enable/disable) atua sobre todos os processos do
// projeto (principal + adicionais). As demais ações (iniciar, reiniciar,
// parar) atuam sobre um processo específico: o principal via /pm2/:id e os
// adicionais via /pm2/processos/:processId.

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

// Localiza um processo adicional, respondendo erro quando inválido.
async function obterProcessoExtraOuErro(
  req: RequisicaoAutenticada,
  res: Response
): Promise<pm2Service.UnidadeProcesso | null> {
  const id = Number(req.params.processId);

  if (!Number.isInteger(id)) {
    erroHttp(res, 400, "Identificador inválido.");
    return null;
  }

  const processo = await projectService.obterProcesso(id);

  if (!processo) {
    erroHttp(res, 404, "Processo não encontrado.");
    return null;
  }

  return pm2Service.montarUnidadeExtra(processo.projectId, processo);
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
    const unidades = pm2Service.montarUnidadesProjeto(projeto, projeto.processes);
    await pm2Service.habilitarAutostart(unidades);
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
    const unidades = pm2Service.montarUnidadesProjeto(projeto, projeto.processes);
    await pm2Service.desabilitarAutostart(unidades);
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

// POST /api/admin/pm2/:id/iniciar — processo principal.
export async function iniciar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.iniciarProcesso(pm2Service.montarUnidadePrincipal(projeto));
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao iniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/:id/reiniciar — processo principal.
export async function reiniciar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.reiniciarProcesso(pm2Service.montarUnidadePrincipal(projeto));
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao reiniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/:id/parar — processo principal.
export async function parar(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const projeto = await obterProjetoOuErro(req, res);
  if (!projeto) {
    return;
  }

  try {
    await pm2Service.pararProcesso(pm2Service.montarUnidadePrincipal(projeto));
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao parar o processo no PM2.");
  }
}

// POST /api/admin/pm2/processos/:processId/iniciar — processo adicional.
export async function iniciarProcessoExtra(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const unidade = await obterProcessoExtraOuErro(req, res);
  if (!unidade) {
    return;
  }

  try {
    await pm2Service.iniciarProcesso(unidade);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao iniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/processos/:processId/reiniciar — processo adicional.
export async function reiniciarProcessoExtra(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const unidade = await obterProcessoExtraOuErro(req, res);
  if (!unidade) {
    return;
  }

  try {
    await pm2Service.reiniciarProcesso(unidade);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao reiniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/processos/:processId/parar — processo adicional.
export async function pararProcessoExtra(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const unidade = await obterProcessoExtraOuErro(req, res);
  if (!unidade) {
    return;
  }

  try {
    await pm2Service.pararProcesso(unidade);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao parar o processo no PM2.");
  }
}