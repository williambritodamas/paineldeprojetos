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
  pm2Name: string | null;
  // Status atual do processo no PM2 (adicionado pela listagem admin).
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