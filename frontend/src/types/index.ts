// Tipos compartilhados do frontend.
// Evitam o uso de `any` e garantem consistência com a API.

export interface Project {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CriarProjetoDTO {
  name: string;
  description?: string | null;
  icon?: string | null;
  port: number;
  active: boolean;
}

export type AtualizarProjetoDTO = Partial<CriarProjetoDTO>;

export interface User {
  id: number;
  name: string;
  username: string;
  role: "admin" | "user";
}

export interface CriarUsuarioDTO {
  name: string;
  username: string;
  password: string;
  role: "admin" | "user";
}

export type AtualizarUsuarioDTO = Partial<CriarUsuarioDTO>;

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RespostaAutenticacao {
  token: string;
  user: User;
}

export interface FiltroProjeto {
  busca?: string;
  status?: "todos" | "ativos" | "inativos";
}

export interface ConfigRodape {
  autor: string;
  gestor: string;
}