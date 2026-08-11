// Serviço de projetos.
// Responsável pelas regras de negócio e acesso ao banco via Prisma.

import { prisma } from "../config";
import type {
  AtualizarProjetoDTO,
  CriarProjetoDTO,
  FiltroBuscaProjetos,
} from "../types";
import type { ProjetoRetorno } from "../types/respostas";

function montarProjetoRetorno(projeto: {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
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
    createdAt: projeto.createdAt.toISOString(),
    updatedAt: projeto.updatedAt.toISOString(),
  };
}

// Lista projetos ativos para a tela pública.
export async function listarProjetosAtivos(): Promise<ProjetoRetorno[]> {
  const projetos = await prisma.project.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return projetos.map(montarProjetoRetorno);
}

// Lista projetos com busca e filtro por status para a área administrativa.
export async function listarProjetosComFiltro(
  filtro: FiltroBuscaProjetos
): Promise<ProjetoRetorno[]> {
  const { busca, status } = filtro;

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
    | { active?: boolean }
    | { active?: boolean; OR: Array<{ [campo: string]: unknown }> } = condicoesBusca.length
      ? { OR: condicoesBusca }
      : {};

  if (status === "ativos") {
    onde.active = true;
  } else if (status === "inativos") {
    onde.active = false;
  }

  const projetos = await prisma.project.findMany({
    where: onde,
    orderBy: { name: "asc" },
  });

  return projetos.map(montarProjetoRetorno);
}

// Retorna um projeto específico.
export async function obterProjeto(id: number): Promise<ProjetoRetorno | null> {
  const projeto = await prisma.project.findUnique({ where: { id } });
  return projeto ? montarProjetoRetorno(projeto) : null;
}

// Cria um novo projeto.
export async function criarProjeto(
  dados: CriarProjetoDTO
): Promise<ProjetoRetorno> {
  const projeto = await prisma.project.create({
    data: {
      name: dados.name.trim(),
      description: dados.description?.trim() || null,
      icon: dados.icon?.trim() || null,
      port: dados.port,
      active: dados.active,
    },
  });
  return montarProjetoRetorno(projeto);
}

// Atualiza um projeto existente.
export async function atualizarProjeto(
  id: number,
  dados: AtualizarProjetoDTO
): Promise<ProjetoRetorno | null> {
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

  const projeto = await prisma.project.update({
    where: { id },
    data: dadosAtualizados,
  });

  return montarProjetoRetorno(projeto);
}

// Exclui um projeto existente.
export async function excluirProjeto(id: number): Promise<boolean> {
  const existente = await prisma.project.findUnique({ where: { id } });

  if (!existente) {
    return false;
  }

  await prisma.project.delete({ where: { id } });
  return true;
}