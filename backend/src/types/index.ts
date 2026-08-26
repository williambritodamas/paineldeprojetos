// Tipos compartilhados e estruturas de entrada/saída da API.

import type { Project, User } from "@prisma/client";

// Usuário retornado para o frontend, sem a senha.
export interface DadosUsuarioPublico {
  id: number;
  name: string;
  username: string;
  role: "admin" | "user";
}

// Dados utilizados para criar um usuário.
export interface CriarUsuarioDTO {
  name: string;
  username: string;
  password: string;
  role: "admin" | "user";
}

// Dados utilizados para atualizar um usuário.
export interface AtualizarUsuarioDTO {
  name?: string;
  username?: string;
  password?: string;
  role?: "admin" | "user";
}

// Resposta completa da autenticação.
export interface RespostaAutenticacao {
  token: string;
  user: DadosUsuarioPublico;
}

// Dados de entrada do login.
export interface LoginDTO {
  username: string;
  password: string;
}

// Dados utilizados para criar um processo adicional do projeto.
export interface CriarProcessoDTO {
  // Presente apenas na edição, para sincronizar processos existentes.
  id?: number;
  label: string;
  folderPath: string;
  script?: string;
  port: number;
  // Variáveis de ambiente do processo (CHAVE=valor por linha).
  env?: string | null;
  // Reinicia o processo automaticamente se ele cair.
  autorestart?: boolean;
  // Atraso em ms entre reinícios automáticos.
  restartDelay?: number;
  // Limite de reinícios antes de marcar o processo como "errored".
  maxRestarts?: number;
  // Limite de memória que dispara reinício quando estourado (ex.: "512M").
  maxMemoryRestart?: string | null;
}

// Dados utilizados para criar um projeto.
export interface CriarProjetoDTO {
  name: string;
  description?: string | null;
  icon?: string | null;
  port: number;
  active: boolean;
  hidden?: boolean;
  environment?: string | null;
  categoryId?: number | null;
  serverId?: number | null;
  folderPath?: string | null;
  script?: string;
  autostart?: boolean;
  pm2Name?: string | null;
  processes?: CriarProcessoDTO[];
  // Variáveis de ambiente do processo principal (CHAVE=valor por linha).
  env?: string | null;
  // Reinicia o processo automaticamente se ele cair.
  autorestart?: boolean;
  // Atraso em ms entre reinícios automáticos.
  restartDelay?: number;
  // Limite de reinícios antes de marcar o processo como "errored".
  maxRestarts?: number;
  // Limite de memória que dispara reinício quando estourado (ex.: "512M").
  maxMemoryRestart?: string | null;
}

// Dados utilizados para atualizar um projeto.
export interface AtualizarProjetoDTO extends Partial<CriarProjetoDTO> {}

// Dados utilizados para criar uma categoria.
export interface CriarCategoriaDTO {
  name: string;
  slug?: string;
}

// Dados utilizados para atualizar uma categoria.
export interface AtualizarCategoriaDTO {
  name?: string;
  slug?: string;
}

// Dados utilizados para criar um servidor.
export interface CriarServidorDTO {
  name: string;
  host?: string;
  description?: string;
}

// Dados utilizados para atualizar um servidor.
export interface AtualizarServidorDTO {
  name?: string;
  host?: string;
  description?: string;
}

// Filtros utilizados na busca administrativa.
export type AmbienteProjeto =
  | "desenvolvimento"
  | "homologacao"
  | "producao";

export type OrdenacaoProjeto =
  | "name_asc"
  | "name_desc"
  | "port_asc"
  | "port_desc"
  | "createdAt_asc"
  | "createdAt_desc"
  | "updatedAt_asc"
  | "updatedAt_desc";

export interface FiltroBuscaProjetos {
  busca?: string;
  status?: "todos" | "ativos" | "inativos";
  orderBy?: OrdenacaoProjeto;
  environment?: AmbienteProjeto;
  categoryId?: number;
  serverId?: number;
}

export type { Project, User };