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
// Retorna a unidade de processo e o autostart do projeto pai (para manter o
// dump de boot consistente ao iniciar/reiniciar).
async function obterProcessoExtraOuErro(
  req: RequisicaoAutenticada,
  res: Response
): Promise<{ unidade: pm2Service.UnidadeProcesso; autostart: boolean } | null> {
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

  return {
    unidade: pm2Service.montarUnidadeExtra(processo),
    autostart: processo.project.autostart,
  };
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
    const selfGerenciado = await pm2Service.habilitarAutostart(unidades);
    const atualizado = await projectService.atualizarProjeto(projeto.id, {
      autostart: true,
    });
    sucessoHttp(res, { ...atualizado, selfGerenciado });
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
    const selfGerenciado = await pm2Service.desabilitarAutostart(unidades);
    const atualizado = await projectService.atualizarProjeto(projeto.id, {
      autostart: false,
    });
    sucessoHttp(res, { ...atualizado, selfGerenciado });
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
    const resultado = await pm2Service.iniciarProcesso(
      pm2Service.montarUnidadePrincipal(projeto),
      projeto.autostart
    );
    sucessoHttp(res, { ...resultado, ok: true });
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
    const resultado = await pm2Service.reiniciarProcesso(
      pm2Service.montarUnidadePrincipal(projeto),
      projeto.autostart
    );
    sucessoHttp(res, { ...resultado, ok: true });

    // Se é o próprio painel, aguarda o envio da resposta e encerra.
    // O PM2 com autorestart: true reinicia o processo automaticamente.
    if (resultado.selfGerenciado) {
      res.on("finish", () => {
        setTimeout(() => process.exit(1), 500);
      });
    }
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
  const processo = await obterProcessoExtraOuErro(req, res);
  if (!processo) {
    return;
  }

  try {
    const resultado = await pm2Service.iniciarProcesso(
      processo.unidade,
      processo.autostart
    );
    sucessoHttp(res, { ...resultado, ok: true });

    if (resultado.selfGerenciado) {
      res.on("finish", () => {
        setTimeout(() => process.exit(1), 500);
      });
    }
  } catch (erro) {
    tratarErro(res, erro, "Erro ao iniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/processos/:processId/reiniciar — processo adicional.
export async function reiniciarProcessoExtra(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const processo = await obterProcessoExtraOuErro(req, res);
  if (!processo) {
    return;
  }

  try {
    const resultado = await pm2Service.reiniciarProcesso(
      processo.unidade,
      processo.autostart
    );
    sucessoHttp(res, { ...resultado, ok: true });

    if (resultado.selfGerenciado) {
      res.on("finish", () => {
        setTimeout(() => process.exit(1), 500);
      });
    }
  } catch (erro) {
    tratarErro(res, erro, "Erro ao reiniciar o processo no PM2.");
  }
}

// POST /api/admin/pm2/processos/:processId/parar — processo adicional.
export async function pararProcessoExtra(
  req: RequisicaoAutenticada,
  res: Response
): Promise<void> {
  const processo = await obterProcessoExtraOuErro(req, res);
  if (!processo) {
    return;
  }

  try {
    await pm2Service.pararProcesso(processo.unidade);
    sucessoHttp(res, { ok: true });
  } catch (erro) {
    tratarErro(res, erro, "Erro ao parar o processo no PM2.");
  }
}