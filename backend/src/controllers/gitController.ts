// Controller de operações Git.
// Expõe endpoints para gerenciar repositórios dos projetos.

import { Request, Response } from "express";
import * as gitService from "../services/gitService";

// GET /api/admin/git/updates — verifica atualizações de todos os projetos.
export async function checkAllUpdates(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const resultados = await gitService.checkAllUpdates();
    res.json(resultados);
  } catch (erro) {
    res.status(500).json({ error: "Erro ao verificar atualizações." });
  }
}

// GET /api/admin/git/:id/updates — verifica atualizações de um projeto.
export async function checkUpdates(
  req: Request,
  res: Response
): Promise<void> {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "ID do projeto inválido." });
    return;
  }

  const resultado = await gitService.checkUpdates(projectId);
  if (!resultado) {
    res.status(404).json({ error: "Projeto não encontrado ou sem pasta configurada." });
    return;
  }

  res.json(resultado);
}

// POST /api/admin/git/:id/pull — executa git pull na pasta do projeto.
export async function gitPull(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "ID do projeto inválido." });
    return;
  }

  const resultado = await gitService.gitPull(projectId);
  if (!resultado) {
    res.status(404).json({ error: "Projeto não encontrado." });
    return;
  }

  if (resultado.success) {
    res.json({
      message: "Git pull executado com sucesso.",
      output: resultado.output,
      warning: resultado.error,
    });
  } else {
    res.status(400).json({
      error: "Falha ao executar git pull.",
      details: resultado.error,
      output: resultado.output,
    });
  }
}
