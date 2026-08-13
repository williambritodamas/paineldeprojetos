// Tipos dos dados retornados pela API.
// Evitam depender diretamente do formato do Prisma nos controllers.

export type StatusPm2 =
  | "online"
  | "parado"
  | "erro"
  | "iniciando"
  | "desconhecido"
  | "nao_registrado"
  | "indisponivel";

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

// Dados de um processo (principal ou adicional) na visualização administrativa.
export interface ProcessoRetorno {
  // ProjectProcess.id (extras) ou Project.id (principal).
  id: number;
  origem: "principal" | "extra";
  label: string;
  port: number;
  folderPath: string;
  script: string;
  // Variáveis de ambiente do processo (CHAVE=valor por linha).
  env: string | null;
  // Reinicia o processo automaticamente se ele cair.
  autorestart: boolean;
  // Atraso em ms entre reinícios automáticos.
  restartDelay: number;
  // Limite de reinícios antes de marcar o processo como "errored".
  maxRestarts: number;
  // Limite de memória que dispara reinício quando estourado (ex.: "512M").
  maxMemoryRestart: string | null;
  // Nome efetivo do processo no PM2.
  pm2Name: string;
  pm2Status?: StatusPm2;
  pm2Reinicios?: number;
  pm2UptimeMs?: number | null;
}

// Retorno administrativo: inclui os dados de execução via PM2.
export interface ProjetoRetornoAdmin extends ProjetoRetorno {
  folderPath: string | null;
  script: string;
  autostart: boolean;
  pm2Name: string | null;
  // Variáveis de ambiente do processo principal (CHAVE=valor por linha).
  env: string | null;
  // Reinicia o processo automaticamente se ele cair.
  autorestart: boolean;
  // Atraso em ms entre reinícios automáticos.
  restartDelay: number;
  // Limite de reinícios antes de marcar o processo como "errored".
  maxRestarts: number;
  // Limite de memória que dispara reinício quando estourado (ex.: "512M").
  maxMemoryRestart: string | null;
  // Status atual do processo principal no PM2 (adicionado pela listagem admin).
  pm2Status?: StatusPm2;
  pm2Reinicios?: number;
  pm2UptimeMs?: number | null;
  // Processos adicionais (sem o principal, que fica nos campos acima).
  processes: ProcessoRetorno[];
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