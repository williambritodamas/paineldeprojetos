// Controller de operações Git.
// Expõe endpoints para gerenciar repositórios dos projetos.

import { Request, Response } from "express";
import * as gitService from "../services/gitService";

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
