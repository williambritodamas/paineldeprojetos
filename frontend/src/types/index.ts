// Tipos compartilhados do frontend.
// Evitam o uso de `any` e garantem consistência com a API.

export interface ProjectProcess {
  id: number;
  origem: "principal" | "extra";
  label: string;
  port: number;
  folderPath: string;
  script: string;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
  pm2Name: string;
  pm2Status?:
    | "online"
    | "parado"
    | "erro"
    | "iniciando"
    | "desconhecido"
    | "nao_registrado"
    | "indisponivel";
  pm2Reinicios?: number;
  pm2UptimeMs?: number | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
  environment?: string | null;
  categoryId?: number | null;
  category?: Category | null;
  folderPath?: string | null;
  script?: string;
  autostart?: boolean;
  pm2Name?: string | null;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
  pm2Status?:
    | "online"
    | "parado"
    | "erro"
    | "iniciando"
    | "desconhecido"
    | "nao_registrado"
    | "indisponivel";
  pm2Reinicios?: number;
  pm2UptimeMs?: number | null;
  processes?: ProjectProcess[];
  createdAt: string;
  updatedAt: string;
}

export interface CriarProcessoDTO {
  id?: number;
  label: string;
  folderPath: string;
  script?: string;
  port: number;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
}

export interface CriarProjetoDTO {
  name: string;
  description?: string | null;
  icon?: string | null;
  port: number;
  active: boolean;
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
  processes?: CriarProcessoDTO[];
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

export interface FiltroProjeto {
  busca?: string;
  status?: "todos" | "ativos" | "inativos";
  orderBy?: OrdenacaoProjeto;
  environment?: AmbienteProjeto;
  categoryId?: number;
}

export interface ConfigRodape {
  autor: string;
  gestor: string;
}