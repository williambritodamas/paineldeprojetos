// Tipos dos dados retornados pela API.
// Evitam depender diretamente do formato do Prisma nos controllers.

export interface ProjetoRetorno {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  port: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Retorno administrativo: inclui os dados de execução via PM2.
export interface ProjetoRetornoAdmin extends ProjetoRetorno {
  folderPath: string | null;
  script: string;
  autostart: boolean;
}

export interface UsuarioRetorno {
  id: number;
  name: string;
  username: string;
  role: "admin" | "user";
}

export interface RespostaLogin {
  token: string;
  user: UsuarioRetorno;
}