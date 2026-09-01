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

export interface GitPullOptions {
  pull?: boolean;
  npmInstall?: boolean;
  prismaMigrate?: boolean;
  npmBuild?: boolean;
}

export interface GitPullStep {
  command: string;
  label: string;
  success: boolean;
  output: string;
  error: string | null;
}

export interface GitPullExtendedResult {
  success: boolean;
  steps: GitPullStep[];
}

export type GitSeverity = "updated" | "available" | "critical" | "urgent";

export interface GitCommit {
  hash: string;
  hashAbreviado: string;
  mensagem: string;
  autor: string;
  data: string;
  isNew: boolean;
}

export interface GitUpdatesInfo {
  hasUpdates: boolean;
  behind: number;
  ahead: number;
  currentBranch: string;
  remoteHash: string | null;
  localHash: string | null;
  daysBehind: number;
  severity: GitSeverity;
}

// Calcula a severidade com base nos commits e dias de diferença.
// - updated:  sem commits pendentes
// - available: 1 a 3 commits atrás
// - critical:  4 a 10 commits atrás
// - urgent:    mais de 10 commits OU mais de 3 dias sem pull
function calcularSeveridade(
  behind: number,
  daysBehind: number
): GitSeverity {
  if (behind === 0) return "updated";
  if (behind <= 3) return "available";
  if (behind <= 10 && daysBehind < 3) return "critical";
  return "urgent";
}

// Obtém a data do último commit de um hash.
async function obterDataCommit(
  folderPath: string,
  ref: string
): Promise<Date | null> {
  try {
    const { stdout } = await execAsync(
      `git log -1 --format=%cd ${ref}`,
      { cwd: folderPath, timeout: 5000 }
    );
    const dataStr = stdout.trim();
    if (!dataStr) return null;
    const data = new Date(dataStr);
    return isNaN(data.getTime()) ? null : data;
  } catch {
    return null;
  }
}

// Verifica se há atualizações disponíveis no repositório remoto.
export async function checkUpdates(
  projectId: number
): Promise<GitUpdatesInfo | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  const defaultResult: GitUpdatesInfo = {
    hasUpdates: false,
    behind: 0,
    ahead: 0,
    currentBranch: "main",
    remoteHash: null,
    localHash: null,
    daysBehind: 0,
    severity: "updated",
  };

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

    // Obtém hash local.
    const { stdout: localOut } = await execAsync(
      "git rev-parse HEAD",
      { cwd: projeto.folderPath, timeout: 5000 }
    );
    const localHash = localOut.trim();

    // Tenta obter o hash remoto.
    let remoteHash: string | null = null;
    try {
      const { stdout: remoteOut } = await execAsync(
        "git rev-parse @{u}",
        { cwd: projeto.folderPath, timeout: 5000 }
      );
      remoteHash = remoteOut.trim();
    } catch {
      // Sem upstream configurado.
      return { ...defaultResult, currentBranch, localHash };
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

    // Calcula dias de diferença entre último commit local e remoto.
    let daysBehind = 0;
    if (behind > 0 && remoteHash) {
      const dataLocal = await obterDataCommit(projeto.folderPath, "HEAD");
      const dataRemota = await obterDataCommit(projeto.folderPath, remoteHash);

      if (dataLocal && dataRemota) {
        const diffMs = dataRemota.getTime() - dataLocal.getTime();
        daysBehind = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    const severity = calcularSeveridade(behind, daysBehind);

    return {
      hasUpdates: behind > 0,
      behind,
      ahead,
      currentBranch,
      remoteHash,
      localHash,
      daysBehind,
      severity,
    };
  } catch {
    return null;
  }
}

// Verifica atualizações de todos os projetos com folderPath.
export async function checkAllUpdates(): Promise<
  Array<{ projectId: number } & GitUpdatesInfo>
> {
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

  return resultados.filter(
    (r) => r.localHash !== null && r.severity !== undefined
  ) as Array<{ projectId: number } & GitUpdatesInfo>;
}

// Executa git pull na pasta do projeto.
export async function gitPull(
  projectId: number
): Promise<GitPullResult | null> {
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
      error:
        erro.stderr?.trim() ||
        erro.message ||
        "Erro ao executar git pull.",
    };
  }
}

// Executa um comando e retorna o resultado.
async function executarComando(
  comando: string,
  cwd: string,
  timeout: number
): Promise<GitPullStep> {
  const label = comando;
  try {
    const { stdout, stderr } = await execAsync(comando, { cwd, timeout });
    return {
      command: comando,
      label,
      success: true,
      output: stdout.trim(),
      error: stderr.trim() || null,
    };
  } catch (erro: any) {
    return {
      command: comando,
      label,
      success: false,
      output: erro.stdout?.trim() || "",
      error: erro.stderr?.trim() || erro.message || "Erro ao executar comando.",
    };
  }
}

// Executa git pull + comandos pós-pull conforme opções selecionadas.
export async function gitPullExtended(
  projectId: number,
  options: GitPullOptions
): Promise<GitPullExtendedResult | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  const cwd = projeto.folderPath;
  const steps: GitPullStep[] = [];

  // 1. Git pull (sempre primeiro se marcado)
  if (options.pull) {
    const step = await executarComando("git pull", cwd, 30000);
    steps.push(step);
    if (!step.success) {
      return { success: false, steps };
    }
  }

  // 2. npm install
  if (options.npmInstall) {
    const step = await executarComando("npm install", cwd, 120000);
    steps.push(step);
    if (!step.success) {
      return { success: false, steps };
    }
  }

  // 3. npx prisma migrate dev
  if (options.prismaMigrate) {
    const step = await executarComando(
      "npx prisma migrate dev",
      cwd,
      60000
    );
    steps.push(step);
    if (!step.success) {
      return { success: false, steps };
    }
  }

  // 4. npm run build
  if (options.npmBuild) {
    const step = await executarComando("npm run build", cwd, 120000);
    steps.push(step);
    if (!step.success) {
      return { success: false, steps };
    }
  }

  return { success: true, steps };
}

// Obtém a ref remota do branch (ex: origin/main).
async function obterRefRemota(folderPath: string): Promise<string | null> {
  try {
    const { stdout: branchOut } = await execAsync(
      "git rev-parse --abbrev-ref HEAD",
      { cwd: folderPath, timeout: 5000 }
    );
    const branch = branchOut.trim();

    const { stdout: remoteOut } = await execAsync(
      `git rev-parse --abbrev-ref ${branch}@{upstream}`,
      { cwd: folderPath, timeout: 5000 }
    );
    return remoteOut.trim();
  } catch {
    return null;
  }
}

// Obtém os N commits mais recentes do branch remoto.
export async function getRecentCommits(
  projectId: number,
  count: number = 2
): Promise<GitCommit[] | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  try {
    // Busca atualizações do remoto.
    await execAsync("git fetch --quiet", {
      cwd: projeto.folderPath,
      timeout: 15000,
    });

    const refRemota = await obterRefRemota(projeto.folderPath);
    const refLog = refRemota || "HEAD";

    // Busca hashes dos commits novos (remoto ainda não pullados).
    const hashesNovos = new Set<string>();
    if (refRemota) {
      try {
        const { stdout: novosOut } = await execAsync(
          "git rev-list HEAD..@{u}",
          { cwd: projeto.folderPath, timeout: 5000 }
        );
        novosOut
          .trim()
          .split("\n")
          .filter(Boolean)
          .forEach((h) => hashesNovos.add(h));
      } catch { /* ignora */ }
    }

    const { stdout } = await execAsync(
      `git log -${count} --format="%H|%s|%cd|%an" --date=short ${refLog}`,
      { cwd: projeto.folderPath, timeout: 10000 }
    );

    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, mensagem, data, autor] = line.split("|");
        return {
          hash,
          hashAbreviado: hash.substring(0, 7),
          mensagem,
          autor,
          data,
          isNew: hashesNovos.has(hash),
        };
      });
  } catch {
    return null;
  }
}

// Obtém todos os commits do branch remoto (sem limite).
export async function getAllRemoteCommits(
  projectId: number
): Promise<GitCommit[] | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  try {
    await execAsync("git fetch --quiet", {
      cwd: projeto.folderPath,
      timeout: 15000,
    });

    const refRemota = await obterRefRemota(projeto.folderPath);
    const refLog = refRemota || "HEAD";

    // Busca hashes dos commits novos (remoto ainda não pullados).
    const hashesNovos = new Set<string>();
    if (refRemota) {
      try {
        const { stdout: novosOut } = await execAsync(
          "git rev-list HEAD..@{u}",
          { cwd: projeto.folderPath, timeout: 5000 }
        );
        novosOut
          .trim()
          .split("\n")
          .filter(Boolean)
          .forEach((h) => hashesNovos.add(h));
      } catch { /* ignora */ }
    }

    const { stdout } = await execAsync(
      `git log --format="%H|%s|%cd|%an" --date=short ${refLog}`,
      { cwd: projeto.folderPath, timeout: 15000 }
    );

    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, mensagem, data, autor] = line.split("|");
        return {
          hash,
          hashAbreviado: hash.substring(0, 7),
          mensagem,
          autor,
          data,
          isNew: hashesNovos.has(hash),
        };
      });
  } catch {
    return null;
  }
}

export interface CheckoutResult {
  success: boolean;
  message: string;
  error: string | null;
}

// Faz checkout isolado (detached HEAD) para um commit específico.
export async function checkoutCommit(
  projectId: number,
  commitHash: string
): Promise<CheckoutResult | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, folderPath: true },
  });

  if (!projeto || !projeto.folderPath) {
    return null;
  }

  try {
    await execAsync(`git cat-file -t ${commitHash}`, {
      cwd: projeto.folderPath,
      timeout: 5000,
    });

    const { stdout, stderr } = await execAsync(
      `git checkout ${commitHash}`,
      { cwd: projeto.folderPath, timeout: 15000 }
    );

    return {
      success: true,
      message: stdout.trim() || `Checkout realizado para ${commitHash.substring(0, 7)}`,
      error: stderr.trim() || null,
    };
  } catch (erro: any) {
    return {
      success: false,
      message: "Erro ao realizar checkout.",
      error:
        erro.stderr?.trim() ||
        erro.message ||
        "Erro desconhecido ao executar git checkout.",
    };
  }
}
