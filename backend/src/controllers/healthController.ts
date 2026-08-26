// Controller de health check de portas.
// Expõe endpoints para verificar o status das portas dos projetos.

import { Request, Response } from "express";
import * as healthService from "../services/healthService";

// GET /api/health/ports — verifica todas as portas ativas.
export async function verificarTodas(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const resultados = await healthService.verificarTodasPortas();
    res.json(resultados);
  } catch (erro) {
    res.status(500).json({ error: "Erro ao verificar portas." });
  }
}

// GET /api/health/ports/:projectId — verifica a porta de um projeto.
export async function verificarUma(
  req: Request,
  res: Response
): Promise<void> {
  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "ID do projeto inválido." });
    return;
  }

  try {
    const resultado = await healthService.verificarPortaProjeto(projectId);
    if (!resultado) {
      res.status(404).json({ error: "Projeto não encontrado." });
      return;
    }
    res.json(resultado);
  } catch (erro) {
    res.status(500).json({ error: "Erro ao verificar porta." });
  }
}
