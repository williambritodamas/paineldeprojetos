// Serviço de integração com o PM2 do servidor.
// Gerencia os processos dos projetos: iniciar, parar, reiniciar,
// habilitar/desabilitar inicialização automática (pm2 save) e status.
//
// Um projeto pode ter vários processos (principal + adicionais). Cada um é
// representado por uma "UnidadeProcesso" e gerenciado de forma independente.
//
// O nome do processo principal usa o campo configurável "pm2Name" do projeto
// (ex.: "workshop") quando preenchido; senão, cai no padrão estável
// "proj-<id>". Os processos adicionais usam "proj-<id>-<slug(nome)>".

import os from "os";
import path from "path";
import fs from "fs";
import pm2 from "pm2";
import { ErroNegocio } from "../utils/helpers";

// Unidade de processo executável no PM2.
export interface UnidadeProcesso {
  // Nome efetivo do processo no PM2.
  processName: string;
  folderPath: string | null;
  script: string;
  // Porta em que o processo roda. Injetada como variável "PORT" (a menos
  // que o usuário a defina manualmente no env, que tem prioridade).
  port?: number | null;
  // Variáveis de ambiente em texto "CHAVE=valor" por linha.
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

// Status simplificado de um processo do PM2.
export interface StatusProcesso {
  existe: boolean;
  status:
    | "online"
    | "parado"
    | "erro"
    | "iniciando"
    | "desconhecido";
  reinicios: number;
  uptimeMs: number | null;
}

// Estrutura retornada pela função list() do PM2.
interface EstruturaProcesso {
  name?: string;
  pm2_env?: {
    name?: string;
    status?: string;
    restart_time?: number;
    pm_uptime?: number;
  };
}

// Serializa as operações para evitar conexões simultâneas com o daemon.
let filaOperacao: Promise<void> = Promise.resolve();

function serializar<T>(operacao: () => Promise<T>): Promise<T> {
  const resultado = filaOperacao.then(operacao);
  filaOperacao = resultado.then(
    () => undefined,
    () => undefined
  );
  return resultado;
}

// Nome do processo principal no PM2.
// Usa o nome configurado (pm2Name) quando informado; caso contrário,
// mantém o padrão estável "proj-<id>".
export function nomeProcesso(projeto: {
  id: number;
  pm2Name?: string | null;
}): string {
  const nomeConfigurado = projeto.pm2Name?.trim();
  return nomeConfigurado && nomeConfigurado.length > 0
    ? nomeConfigurado
    : `proj-${projeto.id}`;
}

// Deixa o texto pronto para compor um nome de processo no PM2.
function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Nome de um processo adicional no PM2: usa o rótulo informado (ex.: "sigpat-back").
// O rótulo deve ser único entre os projetos, pois nomes repetidos colidem no PM2.
export function nomeProcessoExtra(label: string): string {
  const slug = slugificar(label);
  return slug || "processo";
}

// Monta a unidade do processo principal do projeto.
export function montarUnidadePrincipal(projeto: {
  id: number;
  folderPath: string | null;
  script: string;
  pm2Name?: string | null;
  port?: number;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
}): UnidadeProcesso {
  return {
    processName: nomeProcesso(projeto),
    folderPath: projeto.folderPath,
    script: projeto.script,
    port: projeto.port,
    env: projeto.env,
    autorestart: projeto.autorestart,
    restartDelay: projeto.restartDelay,
    maxRestarts: projeto.maxRestarts,
    maxMemoryRestart: projeto.maxMemoryRestart,
  };
}

// Monta a unidade de um processo adicional do projeto.
export function montarUnidadeExtra(processo: {
  label: string;
  folderPath: string;
  script: string;
  port?: number;
  env?: string | null;
  autorestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
  maxMemoryRestart?: string | null;
}): UnidadeProcesso {
  return {
    processName: nomeProcessoExtra(processo.label),
    folderPath: processo.folderPath,
    script: processo.script,
    port: processo.port,
    env: processo.env,
    autorestart: processo.autorestart,
    restartDelay: processo.restartDelay,
    maxRestarts: processo.maxRestarts,
    maxMemoryRestart: processo.maxMemoryRestart,
  };
}

// Monta todas as unidades (principal + adicionais) de um projeto.
export function montarUnidadesProjeto(
  projeto: {
    id: number;
    folderPath: string | null;
    script: string;
    pm2Name?: string | null;
    port?: number;
    env?: string | null;
    autorestart?: boolean;
    restartDelay?: number;
    maxRestarts?: number;
    maxMemoryRestart?: string | null;
  },
  processosExtras: Array<{
    label: string;
    folderPath: string;
    script: string;
    port?: number;
    env?: string | null;
    autorestart?: boolean;
    restartDelay?: number;
    maxRestarts?: number;
    maxMemoryRestart?: string | null;
  }>
): UnidadeProcesso[] {
  const unidades = [montarUnidadePrincipal(projeto)];

  for (const processo of processosExtras) {
    unidades.push(montarUnidadeExtra(processo));
  }

  return unidades;
}

function conectarAoPm2(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    pm2.connect((erro) => {
      if (erro) {
        rejeitar(erro);
      } else {
        resolver();
      }
    });
  });
}

function desconectarDoPm2(): void {
  try {
    pm2.disconnect();
  } catch {
    // Não há o que desconectar.
  }
}

async function executarNoPm2<T>(
  operacao: (cliente: typeof pm2) => Promise<T>
): Promise<T> {
  await conectarAoPm2();
  try {
    return await operacao(pm2);
  } finally {
    desconectarDoPm2();
  }
}

function listarProcessos(): Promise<EstruturaProcesso[]> {
  return new Promise((resolver, rejeitar) => {
    pm2.list((erro, lista) => {
      if (erro) {
        rejeitar(erro);
      } else {
        resolver((lista as EstruturaProcesso[]) ?? []);
      }
    });
  });
}

function iniciarProcessoNoPm2(config: object): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    pm2.start(config, (erro) => {
      if (erro) {
        rejeitar(erro);
      } else {
        resolver();
      }
    });
  });
}

function pararProcessoNoPm2(nome: string): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    pm2.stop(nome, (erro) => {
      if (erro) {
        rejeitar(erro);
      } else {
        resolver();
      }
    });
  });
}

function excluirProcessoNoPm2(nome: string): Promise<void> {
  return new Promise((resolver) => {
    // Processo pode não existir (delete retorna erro); a remoção é best-effort.
    pm2.delete(nome, () => resolver());
  });
}

// Local do arquivo de dump usado na restauração do boot.
function caminhoDump(): string {
  return path.join(
    process.env.PM2_HOME || path.join(os.homedir(), ".pm2"),
    "dump.pm2"
  );
}

// Escreve um dump vazio quando o PM2 recusa salvar uma lista vazia.
function escreverDumpVazio(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    fs.writeFile(caminhoDump(), "[]", (erro) => {
      if (erro) {
        rejeitar(erro);
      } else {
        resolver();
      }
    });
  });
}

function salvarDump(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    // dump grava a lista de processos no dump.pm2 (persistência do boot),
    // equivalente ao comando "pm2 save".
    pm2.dump((erro) => {
      if (!erro) {
        resolver();
        return;
      }

      // O PM2 recusa gravar quando a lista fica vazia. Nesse caso,
      // escrevemos um dump vazio manualmente para que o dump antigo
      // (com o processo já removido) não seja restaurado no boot.
      const mensagem = String(erro?.message ?? erro);
      if (
        mensagem.toLowerCase().includes("empty") ||
        mensagem.toLowerCase().includes("cannot save")
      ) {
        escreverDumpVazio().then(resolver, rejeitar);
      } else {
        rejeitar(erro);
      }
    });
  });
}

function normalizarStatus(status: string): StatusProcesso["status"] {
  if (status === "online") {
    return "online";
  }
  if (status === "stopped" || status === "stopping") {
    return "parado";
  }
  if (status === "errored") {
    return "erro";
  }
  if (status === "launching") {
    return "iniciando";
  }
  return "desconhecido";
}

// Mapa de status por nome de processo, usado pela listagem admin.
export async function listarStatusPorProcesso(): Promise<
  Map<string, StatusProcesso>
> {
  return serializar(() =>
    executarNoPm2(async () => {
      const lista = await listarProcessos();
      const mapa = new Map<string, StatusProcesso>();

      for (const processo of lista) {
        const nome = processo.pm2_env?.name ?? processo.name;
        if (!nome) {
          continue;
        }

        const statusPuro = processo.pm2_env?.status ?? "unknown";
        const status = normalizarStatus(statusPuro);
        const pmUptime = processo.pm2_env?.pm_uptime;

        mapa.set(nome, {
          existe: true,
          status,
          reinicios: processo.pm2_env?.restart_time ?? 0,
          uptimeMs:
            status === "online" && typeof pmUptime === "number"
              ? Date.now() - pmUptime
              : null,
        });
      }

      return mapa;
    })
  );
}

// Divide o comando digitado (ex.: "npm run dev") em binário e argumentos.
function parsearComando(comando: string): { script: string; args: string[] } {
  const partes = comando.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    throw new ErroNegocio(400, "Informe o comando de execução do projeto.");
  }

  return { script: partes[0], args: partes.slice(1) };
}

// Transforma o texto "CHAVE=valor" (uma por linha) em um objeto de ambiente.
function parsearEnv(texto: string | null | undefined): Record<string, string> {
  const ambiente: Record<string, string> = {};

  if (!texto) {
    return ambiente;
  }

  for (const linha of texto.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (limpa.length === 0 || limpa.startsWith("#")) {
      continue;
    }

    const indiceIgual = limpa.indexOf("=");
    if (indiceIgual <= 0) {
      continue;
    }

    const chave = limpa.slice(0, indiceIgual).trim();
    const valor = limpa.slice(indiceIgual + 1).trim();

    if (chave.length > 0) {
      ambiente[chave] = valor;
    }
  }

  return ambiente;
}

// Monta as variáveis de ambiente do processo no PM2.
// A porta é injetada como "PORT", a menos que o usuário a defina no env
// manual (a definição manual tem prioridade).
function montarAmbiente(unidade: UnidadeProcesso): Record<string, string> {
  const ambiente = parsearEnv(unidade.env);

  if (
    typeof unidade.port === "number" &&
    !Number.isNaN(unidade.port) &&
    ambiente.PORT === undefined
  ) {
    ambiente.PORT = String(unidade.port);
  }

  return ambiente;
}

// Extras fixos que nunca devem vazar do painel para os processos dos projetos.
const CHAVES_FIXAS_IGNORADAS = [
  "PORT",
  "INIT_CWD",
  "OLDPWD",
  "npm_config_local_prefix",
  "npm_config_global_prefix",
  "npm_package_line",
  "npm_lifecycle_event",
  "npm_lifecycle_script",
  // Variáveis internas do PM2 herdadas do processo que aciona o PM2 (o próprio
  // painel). Se "pm_id" chegar ao processo filho, o God.executeApp reutiliza o
  // id do painel em vez de gerar um novo, sobrescrevendo a entrada do painel e
  // reiniciando-o com o config do filho.
  "pm_id",
  "pm_uptime",
  "pm_cwd",
  "pm_exec_path",
  "pm_out_log_path",
  "pm_err_log_path",
  "pm_pid_path",
  "unique_id",
  "instance_var",
  "NODE_APP_INSTANCE",
  "name",
  "namespace",
  "merge_logs",
  "autostart",
  "autorestart",
  "exec_mode",
  "exec_interpreter",
  "kill_retry_time",
  "km_link",
  "automation",
  "node_version",
  "exit_code",
  "created_at",
  "PM2_HOME",
  "PM2_USAGE",
  "pmx",
];

// Fallback quando o .env do painel não pode ser lido (chaves conhecidas).
const CHAVES_FALLBACK_IGNORADAS = [
  ...CHAVES_FIXAS_IGNORADAS,
  "FRONTEND_URL",
  "DATABASE_URL",
  "JWT_SECRET",
  "ADMIN_NAME",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "AUTOR_SISTEMA",
  "GESTOR_SETOR",
];

// Lista as chaves que o painel não deve repassar aos processos dos projetos.
// Por padrão, o PM2 mescla o ambiente do próprio painel no processo filho
// (Common.js prepareAppConf). Sem filtro, variáveis do painel (ex.: a
// FRONTEND_URL, DATABASE_URL e JWT_SECRET do .env dele) sobrescrevem as
// variáveis dos projetos. O "filter_env" (deny-list por substring) remove
// essas chaves do ambiente herdado, mantendo PATH, HOME, NVM_* etc.
//
// A lista é montada dinamicamente a partir do .env do painel, para que
// qualquer variável adicionada no futuro também seja bloqueada.
function montarFiltroEnvPainel(): string[] {
  try {
    const caminhoEnv = path.join(process.cwd(), ".env");
    if (fs.existsSync(caminhoEnv)) {
      const conteudo = fs.readFileSync(caminhoEnv, "utf8");
      const chavesDoPainel = Object.keys(parsearEnv(conteudo));
      if (chavesDoPainel.length > 0) {
        return [...new Set([...CHAVES_FIXAS_IGNORADAS, ...chavesDoPainel])];
      }
    }
  } catch {
    // Sem leitura disponível: cai no fallback abaixo.
  }

  return CHAVES_FALLBACK_IGNORADAS;
}

// Exige que a unidade tenha a pasta configurada.
function validarUnidade(unidade: UnidadeProcesso): void {
  if (!unidade.folderPath || unidade.folderPath.trim().length === 0) {
    throw new ErroNegocio(
      400,
      "Configure o caminho da pasta do processo antes de gerenciá-lo pelo PM2."
    );
  }
}

// Monta a configuração de início da unidade no PM2.
function montarConfigUnidade(unidade: UnidadeProcesso): object {
  validarUnidade(unidade);
  const { script, args } = parsearComando(unidade.script);

  const ambiente = montarAmbiente(unidade);
  const config: Record<string, unknown> = {
    name: unidade.processName,
    script,
    args,
    cwd: unidade.folderPath!.trim(),
    exec_mode: "fork",
    // Impede que variáveis do ambiente do painel vazem para o processo
    // filho (deny-list por substring). Mantém o sistema (PATH, HOME,
    // NVM_*) e remove as chaves próprias do painel.
    filter_env: montarFiltroEnvPainel(),
  };

  // Variáveis de ambiente: injeta "PORT" e as definidas no cadastro.
  // O PM2 mescla essas variáveis com as do ambiente do daemon.
  if (Object.keys(ambiente).length > 0) {
    config.env = ambiente;
  }

  // Opções de reinício automático.
  config.autorestart = unidade.autorestart ?? true;
  config.restart_delay = unidade.restartDelay ?? 1000;
  config.max_restarts = unidade.maxRestarts ?? 10;
  config.time = true;

  // Limite de memória que dispara reinício quando estourado (ex.: "512M").
  const memoria = unidade.maxMemoryRestart?.trim();
  if (memoria && memoria.length > 0) {
    config.max_memory_restart = memoria;
  }

  return config;
}

// Localiza uma unidade na lista de processos do PM2.
async function obterProcessoSeExistir(
  processName: string
): Promise<EstruturaProcesso | undefined> {
  const lista = await listarProcessos();
  return lista.find(
    (processo) => (processo.pm2_env?.name ?? processo.name) === processName
  );
}

// Garante que a unidade esteja registrada, senão lança erro.
async function garantirProcesso(unidade: UnidadeProcesso): Promise<string> {
  const existente = await obterProcessoSeExistir(unidade.processName);

  if (!existente) {
    throw new ErroNegocio(
      400,
      `O processo "${unidade.processName}" não está registrado no PM2.`
    );
  }

  return unidade.processName;
}

// Habilita a inicialização automática: registra todos os processos e salva o
// dump para que sejam restaurados no boot.
export async function habilitarAutostart(
  unidades: UnidadeProcesso[]
): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      for (const unidade of unidades) {
        // Remove o registro anterior (se existir) para que o processo seja
        // recriado com o ambiente limpo e o filter_env aplicado. O PM2, ao
        // reiniciar um nome já existente, reutiliza o ambiente antigo.
        await excluirProcessoNoPm2(unidade.processName);
        const config = montarConfigUnidade(unidade);
        await iniciarProcessoNoPm2(config);
      }
      await salvarDump();
    })
  );
}

// Desabilita a inicialização automática: remove todos os processos e salva o
// dump para que não sejam restaurados no boot.
export async function desabilitarAutostart(
  unidades: UnidadeProcesso[]
): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      for (const unidade of unidades) {
        await excluirProcessoNoPm2(unidade.processName);
      }
      await salvarDump();
    })
  );
}

// Inicia um processo (registra se necessário) sem alterar o autostart.
export async function iniciarProcesso(unidade: UnidadeProcesso): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const config = montarConfigUnidade(unidade);

      // Se já existe com o nome, remove antes de recriar para aplicar o
      // ambiente limpo (filter_env). O restart direto por nome reutilizaria
      // o ambiente antigo, possivelmente com variáveis do painel.
      const existente = await obterProcessoSeExistir(unidade.processName);
      if (existente) {
        await excluirProcessoNoPm2(unidade.processName);
      }

      await iniciarProcessoNoPm2(config);
    })
  );
}

// Reinicia um processo já registrado.
export async function reiniciarProcesso(unidade: UnidadeProcesso): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      // O processo precisa estar registrado para o reinício fazer sentido.
      await garantirProcesso(unidade);

      // Recria o registro com a configuração atual (incluindo o env editado
      // do projeto). O pm2.restart por nome apenas reutilizaria o ambiente
      // antigo e ignoraria mudanças nas variáveis de ambiente.
      await excluirProcessoNoPm2(unidade.processName);
      const config = montarConfigUnidade(unidade);
      await iniciarProcessoNoPm2(config);
    })
  );
}

// Para um processo já registrado.
export async function pararProcesso(unidade: UnidadeProcesso): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const nome = await garantirProcesso(unidade);
      await pararProcessoNoPm2(nome);
    })
  );
}