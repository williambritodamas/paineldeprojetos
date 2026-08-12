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

// Dados utilizados para criar um projeto.
export interface CriarProjetoDTO {
  name: string;
  description?: string | null;
  icon?: string | null;
  port: number;
  active: boolean;
  folderPath?: string | null;
  script?: string;
  autostart?: boolean;
  pm2Name?: string | null;
}

// Dados utilizados para atualizar um projeto.
export interface AtualizarProjetoDTO extends Partial<CriarProjetoDTO> {}

// Filtros utilizados na busca administrativa.
export interface FiltroBuscaProjetos {
  busca?: string;
  status?: "todos" | "ativos" | "inativos";
}

export type { Project, User };