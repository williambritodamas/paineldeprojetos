// Service de operações Git.
// Executa git pull e verifica atualizações na pasta do projeto.

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

export interface GitUpdatesInfo {
  hasUpdates: boolean;
  behind: number;
  ahead: number;
  currentBranch: string;
  remoteHash: string | null;
  localHash: string | null;
}

// Verifica se há atualizações disponíveis no repositório remoto.
export async function checkUpdates(projectId: number): Promise<GitUpdatesInfo | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  try {
    // Busca atualizações do remoto sem alterar nada local.
    await execAsync("git fetch --quiet", {
      cwd: projeto.folderPath,
      timeout: 15000,
    });

    // Obtém o branch atual.
    const { stdout: branchOut } = await execAsync(
      "git rev-parse --abbrev-ref HEAD",
      { cwd: projeto.folderPath, timeout: 5000 }
    );
    const currentBranch = branchOut.trim();

    // Obtém hash local e remoto.
    const { stdout: localOut } = await execAsync(
      "git rev-parse HEAD",
      { cwd: projeto.folderPath, timeout: 5000 }
    );
    const localHash = localOut.trim();

    let remoteHash: string | null = null;
    try {
      const { stdout: remoteOut } = await execAsync(
        "git rev-parse @{u}",
        { cwd: projeto.folderPath, timeout: 5000 }
      );
      remoteHash = remoteOut.trim();
    } catch {
      // Sem upstream configurado — não há como comparar.
      return {
        hasUpdates: false,
        behind: 0,
        ahead: 0,
        currentBranch,
        remoteHash: null,
        localHash,
      };
    }

    // Conta commits de diferença.
    let behind = 0;
    let ahead = 0;

    try {
      const { stdout: behindOut } = await execAsync(
        "git rev-list --count HEAD..@{u}",
        { cwd: projeto.folderPath, timeout: 5000 }
      );
      behind = Number(behindOut.trim()) || 0;
    } catch { /* ignora */ }

    try {
      const { stdout: aheadOut } = await execAsync(
        "git rev-list --count @{u}..HEAD",
        { cwd: projeto.folderPath, timeout: 5000 }
      );
      ahead = Number(aheadOut.trim()) || 0;
    } catch { /* ignora */ }

    return {
      hasUpdates: behind > 0,
      behind,
      ahead,
      currentBranch,
      remoteHash,
      localHash,
    };
  } catch {
    // Erro ao acessar o repositório (não é um repo git, sem permissão, etc.)
    return null;
  }
}

// Verifica atualizações de todos os projetos com folderPath.
export async function checkAllUpdates(): Promise<Array<{ projectId: number } & GitUpdatesInfo>> {
  const projetos = await prisma.project.findMany({
    where: { active: true, folderPath: { not: null } },
    select: { id: true, folderPath: true },
  });

  const resultados = await Promise.all(
    projetos.map(async (projeto) => {
      const info = await checkUpdates(projeto.id);
      return { projectId: projeto.id, ...info };
    })
  );

  return resultados.filter((r) => r.localHash !== null) as Array<{ projectId: number } & GitUpdatesInfo>;
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
