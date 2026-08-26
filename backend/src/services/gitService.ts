// Service de operações Git.
// Executa git pull na pasta do projeto para atualizar o código.

import { exec } from "child_process";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const execAsync = promisify(exec);

export interface GitPullResult {
  success: boolean;
  output: string;
  error: string | null;
}

// Executa git pull na pasta do projeto.
export async function gitPull(projectId: number): Promise<GitPullResult | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true, name: true },
  });

  if (!projeto) {
    return null;
  }

  if (!projeto.folderPath) {
    return {
      success: false,
      output: "",
      error: "Projeto não possui caminho de pasta configurado.",
    };
  }

  try {
    const { stdout, stderr } = await execAsync("git pull", {
      cwd: projeto.folderPath,
      timeout: 30000,
    });

    return {
      success: true,
      output: stdout.trim(),
      error: stderr.trim() || null,
    };
  } catch (erro: any) {
    return {
      success: false,
      output: erro.stdout?.trim() || "",
      error: erro.stderr?.trim() || erro.message || "Erro ao executar git pull.",
    };
  }
}
