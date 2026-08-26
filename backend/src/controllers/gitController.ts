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

// POST /api/admin/git/:id/pull — executa git pull + comandos pós-pull.
export async function gitPull(req: Request, res: Response): Promise<void> {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "ID do projeto inválido." });
    return;
  }

  // Opções recebidas do frontend. Se não enviar, faz apenas pull.
  const options: gitService.GitPullOptions = {
    pull: true,
    npmInstall: Boolean(req.body?.npmInstall),
    prismaMigrate: Boolean(req.body?.prismaMigrate),
    npmBuild: Boolean(req.body?.npmBuild),
  };

  const resultado = await gitService.gitPullExtended(projectId, options);
  if (!resultado) {
    res.status(404).json({ error: "Projeto não encontrado." });
    return;
  }

  if (resultado.success) {
    res.json({
      message: "Comandos executados com sucesso.",
      steps: resultado.steps,
    });
  } else {
    res.status(400).json({
      error: "Falha ao executar comandos.",
      steps: resultado.steps,
    });
  }
}
