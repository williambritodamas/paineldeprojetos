// Serviço de projetos.
// Responsável pelas regras de negócio e acesso ao banco via Prisma.

import { prisma } from "../config";
import * as pm2Service from "./pm2Service";
import type {
  AtualizarProjetoDTO,
  CriarProjetoDTO,
  FiltroBuscaProjetos,
  OrdenacaoProjeto,
} from "../types";
import type { ProjetoRetorno, ProjetoRetornoAdmin } from "../types/respostas";

function montarCategoriaRetorno(categoria: {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: categoria.id,
    name: categoria.name,
    slug: categoria.slug,
    createdAt: categoria.createdAt.toISOString(),
    updatedAt: categoria.updatedAt.toISOString(),
  };
}

function montarProjetoRetorno(projeto: {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
  environment: string | null;
  categoryId: number | null;
  category: { id: number; name: string; slug: string; createdAt: Date; updatedAt: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjetoRetorno {
  return {
    id: projeto.id,
    name: projeto.name,
    description: projeto.description,
    icon: projeto.icon,
    port: projeto.port,
    active: projeto.active,
    environment: projeto.environment,
    categoryId: projeto.categoryId,
    category: projeto.category ? montarCategoriaRetorno(projeto.category) : null,
    createdAt: projeto.createdAt.toISOString(),
    updatedAt: projeto.updatedAt.toISOString(),
  };
}

function montarProjetoRetornoAdmin(projeto: {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
  environment: string | null;
  categoryId: number | null;
  category: { id: number; name: string; slug: string; createdAt: Date; updatedAt: Date } | null;
  folderPath: string | null;
  script: string;
  autostart: boolean;
  pm2Name: string | null;
  env: string | null;
  autorestart: boolean;
  restartDelay: number;
  maxRestarts: number;
  maxMemoryRestart: string | null;
  processes: Array<{
    id: number;
    label: string;
    folderPath: string;
    script: string;
    port: number;
    env: string | null;
    autorestart: boolean;
    restartDelay: number;
    maxRestarts: number;
    maxMemoryRestart: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}): ProjetoRetornoAdmin {
  return {
    ...montarProjetoRetorno(projeto),
    folderPath: projeto.folderPath,
    script: projeto.script,
    autostart: projeto.autostart,
    pm2Name: projeto.pm2Name,
    env: projeto.env,
    autorestart: projeto.autorestart,
    restartDelay: projeto.restartDelay,
    maxRestarts: projeto.maxRestarts,
    maxMemoryRestart: projeto.maxMemoryRestart,
    processes: projeto.processes.map((processo) => ({
      id: processo.id,
      origem: "extra",
      label: processo.label,
      port: processo.port,
      folderPath: processo.folderPath,
      script: processo.script,
      env: processo.env,
      autorestart: processo.autorestart,
      restartDelay: processo.restartDelay,
      maxRestarts: processo.maxRestarts,
      maxMemoryRestart: processo.maxMemoryRestart,
      pm2Name: pm2Service.nomeProcessoExtra(processo.label),
    })),
  };
}

// Mapeia o valor de ordenação para o objeto do Prisma.
function montarOrderBy(orderBy?: OrdenacaoProjeto) {
  switch (orderBy) {
    case "name_asc":
      return { name: "asc" as const };
    case "name_desc":
      return { name: "desc" as const };
    case "port_asc":
      return { port: "asc" as const };
    case "port_desc":
      return { port: "desc" as const };
    case "createdAt_asc":
      return { createdAt: "asc" as const };
    case "createdAt_desc":
      return { createdAt: "desc" as const };
    case "updatedAt_asc":
      return { updatedAt: "asc" as const };
    case "updatedAt_desc":
      return { updatedAt: "desc" as const };
    default:
      return { name: "asc" as const };
  }
}

// Lista projetos ativos para a tela pública.
export async function listarProjetosAtivos(): Promise<ProjetoRetorno[]> {
  const projetos = await prisma.project.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { category: true },
  });
  return projetos.map(montarProjetoRetorno);
}

// Lista projetos com busca e filtro por status para a área administrativa.
export async function listarProjetosComFiltro(
  filtro: FiltroBuscaProjetos
): Promise<ProjetoRetornoAdmin[]> {
  const { busca, status, orderBy, environment, categoryId } = filtro;

  const condicoesBusca: Array<{ [campo: string]: unknown }> = [];

  if (busca && busca.trim().length > 0) {
    const termo = busca.trim();
    const portaBuscada = Number(termo);

    condicoesBusca.push({ name: { contains: termo } });
    condicoesBusca.push({ description: { contains: termo } });

    if (Number.isInteger(portaBuscada)) {
      condicoesBusca.push({ port: portaBuscada });
    }
  }

  // Prisma exige pelo menos uma condição no OR quando informado.
  const onde:
    | { active?: boolean; environment?: string; categoryId?: number }
    | { active?: boolean; environment?: string; categoryId?: number; OR: Array<{ [campo: string]: unknown }> } = condicoesBusca.length
      ? { OR: condicoesBusca }
      : {};

  if (status === "ativos") {
    onde.active = true;
  } else if (status === "inativos") {
    onde.active = false;
  }

  if (environment) {
    onde.environment = environment;
  }

  if (categoryId) {
    onde.categoryId = categoryId;
  }

  const projetos = await prisma.project.findMany({
    where: onde,
    orderBy: montarOrderBy(orderBy),
    include: { processes: { orderBy: { label: "asc" } }, category: true },
  });

  return projetos.map(montarProjetoRetornoAdmin);
}

// Retorna um projeto específico (público, sem dados de execução).
export async function obterProjeto(id: number): Promise<ProjetoRetorno | null> {
  const projeto = await prisma.project.findUnique({
    where: { id },
    include: { category: true },
  });
  return projeto ? montarProjetoRetorno(projeto) : null;
}

// Retorna um projeto específico com os dados administrativos (PM2).
export async function obterProjetoAdmin(
  id: number
): Promise<ProjetoRetornoAdmin | null> {
  const projeto = await prisma.project.findUnique({
    where: { id },
    include: { processes: { orderBy: { label: "asc" } }, category: true },
  });
  return projeto ? montarProjetoRetornoAdmin(projeto) : null;
}

// Retorna um processo adicional específico com o projeto relacionado.
export async function obterProcesso(processoId: number) {
  return prisma.projectProcess.findUnique({
    where: { id: processoId },
    include: { project: true },
  });
}

// Cria um novo projeto.
export async function criarProjeto(
  dados: CriarProjetoDTO
): Promise<ProjetoRetornoAdmin> {
  const projeto = await prisma.project.create({
    data: {
      name: dados.name.trim(),
      description: dados.description?.trim() || null,
      icon: dados.icon?.trim() || null,
      port: dados.port,
      active: dados.active,
      environment: dados.environment?.trim() || null,
      categoryId: dados.categoryId ?? null,
      folderPath: dados.folderPath?.trim() || null,
      script: dados.script?.trim() || "npm start",
      autostart: dados.autostart ?? false,
      pm2Name: dados.pm2Name?.trim() || null,
      env: dados.env?.trim() || null,
      autorestart: dados.autorestart ?? true,
      restartDelay: dados.restartDelay ?? 1000,
      maxRestarts: dados.maxRestarts ?? 10,
      maxMemoryRestart: dados.maxMemoryRestart?.trim() || null,
      processes: {
        create: (dados.processes ?? []).map((processo) => ({
          label: processo.label.trim(),
          folderPath: processo.folderPath.trim(),
          script: processo.script?.trim() || "npm start",
          port: processo.port,
          env: processo.env?.trim() || null,
          autorestart: processo.autorestart ?? true,
          restartDelay: processo.restartDelay ?? 1000,
          maxRestarts: processo.maxRestarts ?? 10,
          maxMemoryRestart: processo.maxMemoryRestart?.trim() || null,
        })),
      },
    },
    include: { processes: true, category: true },
  });
  return montarProjetoRetornoAdmin(projeto);
}

// Atualiza um projeto existente.
export async function atualizarProjeto(
  id: number,
  dados: AtualizarProjetoDTO
): Promise<ProjetoRetornoAdmin | null> {
  const existente = await prisma.project.findUnique({ where: { id } });

  if (!existente) {
    return null;
  }

  // Prepara apenas os campos que foram informados.
  const dadosAtualizados: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    port?: number;
    active?: boolean;
    environment?: string | null;
    categoryId?: number | null;
    folderPath?: string | null;
    script?: string;
    autostart?: boolean;
    pm2Name?: string | null;
    env?: string | null;
    autorestart?: boolean;
    restartDelay?: number;
    maxRestarts?: number;
    maxMemoryRestart?: string | null;
    processes?: {
      deleteMany: {};
      create: Array<{
        label: string;
        folderPath: string;
        script: string;
        port: number;
        env: string | null;
        autorestart: boolean;
        restartDelay: number;
        maxRestarts: number;
        maxMemoryRestart: string | null;
      }>;
    };
  } = {};

  if (dados.name !== undefined) {
    dadosAtualizados.name = dados.name.trim();
  }
  if (dados.description !== undefined) {
    dadosAtualizados.description = dados.description?.trim() || null;
  }
  if (dados.icon !== undefined) {
    dadosAtualizados.icon = dados.icon?.trim() || null;
  }
  if (dados.port !== undefined) {
    dadosAtualizados.port = dados.port;
  }
  if (dados.active !== undefined) {
    dadosAtualizados.active = dados.active;
  }
  if (dados.environment !== undefined) {
    dadosAtualizados.environment = dados.environment?.trim() || null;
  }
  if (dados.categoryId !== undefined) {
    dadosAtualizados.categoryId = dados.categoryId ?? null;
  }
  if (dados.folderPath !== undefined) {
    dadosAtualizados.folderPath = dados.folderPath?.trim() || null;
  }
  if (dados.script !== undefined) {
    dadosAtualizados.script = dados.script?.trim() || "npm start";
  }
  if (dados.autostart !== undefined) {
    dadosAtualizados.autostart = dados.autostart;
  }
  if (dados.pm2Name !== undefined) {
    dadosAtualizados.pm2Name = dados.pm2Name?.trim() || null;
  }
  if (dados.env !== undefined) {
    dadosAtualizados.env = dados.env?.trim() || null;
  }
  if (dados.autorestart !== undefined) {
    dadosAtualizados.autorestart = dados.autorestart;
  }
  if (dados.restartDelay !== undefined) {
    dadosAtualizados.restartDelay = dados.restartDelay;
  }
  if (dados.maxRestarts !== undefined) {
    dadosAtualizados.maxRestarts = dados.maxRestarts;
  }
  if (dados.maxMemoryRestart !== undefined) {
    dadosAtualizados.maxMemoryRestart = dados.maxMemoryRestart?.trim() || null;
  }
  if (dados.processes !== undefined) {
    // Sincroniza os processos adicionais: remove os atuais e recria os
    // informados. Os nomes no PM2 derivam do rótulo, portanto não mudam
    // enquanto o rótulo for mantido.
    dadosAtualizados.processes = {
      deleteMany: {},
      create: (dados.processes ?? []).map((processo) => ({
        label: processo.label.trim(),
        folderPath: processo.folderPath.trim(),
        script: processo.script?.trim() || "npm start",
        port: processo.port,
        env: processo.env?.trim() || null,
        autorestart: processo.autorestart ?? true,
        restartDelay: processo.restartDelay ?? 1000,
        maxRestarts: processo.maxRestarts ?? 10,
        maxMemoryRestart: processo.maxMemoryRestart?.trim() || null,
      })),
    };
  }

  const projeto = await prisma.project.update({
    where: { id },
    data: dadosAtualizados,
    include: { processes: { orderBy: { label: "asc" } }, category: true },
  });

  return montarProjetoRetornoAdmin(projeto);
}

// Exclui um projeto existente.
export async function excluirProjeto(id: number): Promise<boolean> {
  const existente = await prisma.project.findUnique({ where: { id } });

  if (!existente) {
    return false;
  }

  // Remove os processos adicionais (o modelo também usa onDelete: Cascade).
  await prisma.projectProcess.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });
  return true;
}