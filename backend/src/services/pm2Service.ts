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
import { execSync, spawn } from "child_process";
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
  // PID atual do processo (0 quando parado ou não informado).
  pid?: number;
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

// ---------- Auto-gerência do próprio painel ----------
//
// O painel também é um projeto gerenciado pelo PM2 ("painel-backend").
// As operações comuns usam o fluxo excluir -> iniciar orquestrado pela
// própria API; ao agir sobre si mesma, a API morreria no meio do caminho e
// o processo não voltaria. Por isso, quando a unidade alvo é o próprio
// processo, respondemos ao cliente e delegamos a recriação a um helper
// destacado (backend/scripts/pm2-self-helper.cjs).

// Identifica se a unidade apontada é o próprio processo da API.
// O PM2 injeta "pm_id" e "name" no ambiente de toda a árvore gerenciada.
export function ehProprioProcesso(nome: string): boolean {
  return (
    process.env.pm_id !== undefined &&
    typeof process.env.name === "string" &&
    process.env.name === nome
  );
}

// Localiza o helper destacado tanto no desenvolvimento (src/services)
// quanto na build (dist): sobe pastas até encontrar backend/scripts.
function caminhoHelperSelf(): string {
  let atual = __dirname;

  for (let nivel = 0; nivel < 5; nivel += 1) {
    const candidato = path.join(atual, "scripts", "pm2-self-helper.cjs");
    if (fs.existsSync(candidato)) {
      return candidato;
    }
    atual = path.join(atual, "..");
  }

  return path.join(process.cwd(), "scripts", "pm2-self-helper.cjs");
}

// Agenda a recriação do próprio painel via helper destacado e retorna na
// hora: o helper sobrevive ao encerramento da API e executa excluir ->
// iniciar -> dump no daemon, aplicando a configuração atual do banco.
export function recriarSelfDepois(unidade: UnidadeProcesso): void {
  const caminhoHelper = caminhoHelperSelf();
  if (!fs.existsSync(caminhoHelper)) {
    throw new ErroNegocio(
      500,
      "Helper de reinício do painel não encontrado em backend/scripts."
    );
  }

  const config = montarConfigUnidade(unidade);
  const arquivoInstrucao = path.join(
    os.tmpdir(),
    `painel-self-${Date.now()}-${process.pid}.json`
  );

  // Pode conter variáveis sensíveis; grava com permissão restrita.
  fs.writeFileSync(arquivoInstrucao, JSON.stringify({ config }), {
    mode: 0o600,
  });

  try {
    const filho = spawn(process.execPath, [caminhoHelper, arquivoInstrucao], {
      detached: true,
      stdio: "ignore",
    });
    filho.unref();
  } catch (erro) {
    fs.unlinkSync(arquivoInstrucao);
    throw new ErroNegocio(
      500,
      `Falha ao agendar a recriação do próprio painel: ${String(erro)}`
    );
  }
}

// Agenda o reinício do próprio painel via script detached simples.
// Diferente do recriarSelfDepois (que recria do zero), este apenas
// aciona pm2.restart após um delay — funciona como backup do autorestart.
export function agendarRestartSelf(nomeProcesso: string): void {
  let caminhoScript = "";
  let atual = __dirname;
  for (let nivel = 0; nivel < 5; nivel += 1) {
    const candidato = path.join(atual, "scripts", "pm2-restart-self.cjs");
    if (fs.existsSync(candidato)) {
      caminhoScript = candidato;
      break;
    }
    atual = path.join(atual, "..");
  }
  if (!caminhoScript) {
    caminhoScript = path.join(process.cwd(), "scripts", "pm2-restart-self.cjs");
  }
  if (!fs.existsSync(caminhoScript)) {
    return;
  }

  try {
    const filho = spawn(process.execPath, [caminhoScript, nomeProcesso], {
      detached: true,
      stdio: "ignore",
    });
    filho.unref();
  } catch {
    // Ignora falha — o autorestart do PM2 continua funcionando.
  }
}

// Remove entradas pelo nome diretamente do dump de boot (sem tocar nos
// processos vivos). Usado quando o painel desabilita o próprio início
// automático: mantém a API no ar e apenas a tira da restauração do boot.
function removerNomesDoDump(nomes: string[]): void {
  if (nomes.length === 0) {
    return;
  }

  try {
    const caminho = caminhoDump();
    if (!fs.existsSync(caminho)) {
      return;
    }

    const dump = JSON.parse(fs.readFileSync(caminho, "utf8"));
    if (!Array.isArray(dump)) {
      return;
    }

    const filtrado = dump.filter((item) => !nomes.includes(item?.name));
    if (filtrado.length !== dump.length) {
      fs.writeFileSync(caminho, JSON.stringify(filtrado, null, 2));
    }
  } catch {
    // Correção best-effort: não deve derrubar a operação original.
  }
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
}function desconectarDoPm2(): void {
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

function excluirProcessoNoPm2(
  nome: string,
  porta?: number | null
): Promise<void> {
  return new Promise((resolver) => {
    // Processo pode não existir (delete retorna erro); a remoção é best-effort.
    pm2.delete(nome, async () => {
      if (porta) {
        await derrubarProcessosDaPorta(porta);
      }
      resolver();
    });
  });
}

// Mata processos órfãos que ainda escutam na porta informada — e também os
// ancestrais deles (ex.: o "sh -c next dev" e o "next dev" que ficaram presos
// ao init). É a segurança extra do painel: mesmo que o PM2 mate só o pid raiz
// (SimpleKill, ou quando o raiz já morreu e os filhos ficaram órfãos presos ao
// init), garante que a porta seja liberada para que outro processo consiga
// subir sem conflito.
//
// NUNCA mata o daemon do PM2, o próprio painel ou processos ainda registrados
// no PM2 (inclusive de outros projetos): a subida pela cadeia de ancestrais
// para antes de qualquer PID protegido. Sem esse cuidado, a cadeia subiria até
// o daemon (o God do PM2) e derrubaria todo o PM2 junto.
//
// Usa "fuser <porta>/tcp" (confiável no ambiente) com fallback para "lsof".
async function derrubarProcessosDaPorta(
  porta: number | null | undefined
): Promise<void> {
  if (!porta || !Number.isInteger(porta)) {
    return;
  }

  const escutando = pidsEscutandoNaPorta(porta);

  if (escutando.length === 0) {
    return;
  }

  // PIDs que nunca podem ser mortos: o próprio painel, o daemon do PM2 e
  // todos os processos ainda registrados no PM2 (esses são de responsabilidade
  // do daemon, que os encerra com treekill).
  const protegidos = await pidsProtegidos();

  // Reúne os pids da porta e a cadeia de ancestrais, parando antes de
  // qualquer PID protegido. Matamos todos juntos (bottom-up) para não deixar
  // o "next dev"/"nest start" vivos depois que o filho que escuta a porta
  // morrer.
  const pids = new Map<number, number>();
  for (const pid of escutando) {
    const cadeia = ancestraisDoPid(pid, protegidos);
    for (let i = 0; i < cadeia.length; i += 1) {
      pids.set(cadeia[i], i);
    }
  }

  const alvos = [...pids.entries()]
    .sort((a, b) => b[1] - a[1]) // filhos (profundidade maior) primeiro.
    .map(([pid]) => pid);

  if (alvos.length === 0) {
    return;
  }

  for (const pid of alvos) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // O processo já encerrou entre a leitura e o kill.
    }
  }

  await new Promise((resolver) => setTimeout(resolver, 500));

  for (const pid of alvos) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // O processo já encerrou.
    }
  }
}

// Cadeia de ancestrais de um pid até o init (pid 1), do pid para cima, sem
// nunca incluir (nem ultrapassar) um PID protegido.
// Usa /proc para não depender de ferramentas externas.
function ancestraisDoPid(pid: number, pararEm: Set<number>): number[] {
  const cadeia: number[] = [];
  const visto = new Set<number>();
  let atual = pid;

  while (atual > 1 && !visto.has(atual)) {
    if (pararEm.has(atual)) {
      // Não mata processos protegidos (daemon, painel, registrados no PM2).
      break;
    }
    visto.add(atual);
    cadeia.push(atual);

    let ppid: number | null = null;
    try {
      const stat = fs.readFileSync(`/proc/${atual}/stat`, "utf8");
      // O comm do processo pode conter espaços e ")" — o ppid é o campo 4
      // (1-indexado), logo após o último ")" do comm.
      const posParen = stat.lastIndexOf(")");
      ppid = Number(stat.slice(posParen + 2).split(" ")[1]);
    } catch {
      // Processo já encerrou; encerra a subida.
      break;
    }

    if (!ppid || ppid <= 1) {
      break;
    }

    atual = ppid;
  }

  return cadeia;
}

// Conjunto de PIDs que o painel nunca deve matar.
async function pidsProtegidos(): Promise<Set<number>> {
  const protegidos = new Set<number>([process.pid]);

  const daemon = pidDoDaemonPm2();
  if (daemon) {
    protegidos.add(daemon);
  }

  try {
    const lista = await listarProcessos();
    for (const processo of lista) {
      if (typeof processo.pid === "number" && processo.pid > 1) {
        protegidos.add(processo.pid);
      }
    }
  } catch {
    // Sem lista disponível; os demais protegidos já bastam.
  }

  return protegidos;
}

// PID do daemon do PM2, lido do arquivo que o próprio PM2 mantém
// ($PM2_HOME/pm2.pid). Protege a cadeia de ancestrais de subir até o daemon.
function pidDoDaemonPm2(): number | null {
  try {
    const caminho = path.join(
      process.env.PM2_HOME || path.join(os.homedir(), ".pm2"),
      "pm2.pid"
    );
    if (!fs.existsSync(caminho)) {
      return null;
    }
    const pid = Number(fs.readFileSync(caminho, "utf8").trim());
    if (!Number.isInteger(pid) || pid <= 1) {
      return null;
    }
    return pid;
  } catch {
    return null;
  }
}

// Retorna os PIDs dos processos escutando na porta via fuser/lsof.
function pidsEscutandoNaPorta(porta: number): number[] {
  const tentativas = [`fuser ${porta}/tcp`, `lsof -ti tcp:${porta}`];

  for (const comando of tentativas) {
    let saida: string;
    try {
      saida = execSync(comando, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      // Porta livre ou comando indisponível; tenta o próximo.
      continue;
    }

    if (!saida) {
      continue;
    }

    const pids = saida
      // A saída do fuser vem como "3002/tcp: 84168 84139" e a do lsof
      // como um pid por linha. Extrai todos os números.
      .split(/[\s,]+/)
      .map((valor) => valor.replace(/[^0-9-]/g, ""))
      .map(Number)
      .filter((pid) => pid > 0);

    if (pids.length > 0) {
      return pids;
    }
  }

  return [];
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

// O pm2.dump grava o campo "cwd" de cada processo com o diretório de trabalho
// do processo que acionou o dump (no caso, o próprio painel), em vez do cwd
// real do processo. A restauração do boot (pm2 resurrect) usa esse campo, então
// um dump "contaminado" faria os projetos subirem na pasta errada. Para
// corrigir isso, reescrevemos o dump usando o env.PWD de cada processo, que
// reflete o diretório real de trabalho.
function corrigirCwdDoDump(): void {
  try {
    const caminho = caminhoDump();
    if (!fs.existsSync(caminho)) {
      return;
    }

    const dump = JSON.parse(fs.readFileSync(caminho, "utf8"));
    let alterado = false;

    for (const item of dump) {
      const pwd = item?.env?.PWD;
      if (typeof pwd === "string" && item.cwd !== pwd) {
        item.cwd = pwd;
        alterado = true;
      }
    }

    if (alterado) {
      fs.writeFileSync(caminho, JSON.stringify(dump, null, 2));
    }
  } catch {
    // Correção é best-effort: não deve derrubar a operação original.
  }
}

function salvarDump(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    // dump grava a lista de processos no dump.pm2 (persistência do boot),
    // equivalente ao comando "pm2 save".
    pm2.dump((erro) => {
      if (!erro) {
        corrigirCwdDoDump();
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
    // Mata a árvore inteira de processos ao parar/remover a unidade.
    // Sem isso, o PM2 usa "SimpleKill" (mata só o pid raiz) e os filhos
    // (ex.: next-server, nest) ficam órfãos segurando as portas.
    treekill: true,
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
// Retorna true quando a lista incluía o próprio painel (recriado pelo helper
// destacado, que também grava o dump final com ele incluído).
export async function habilitarAutostart(
  unidades: UnidadeProcesso[]
): Promise<boolean> {
  return serializar(() =>
    executarNoPm2(async () => {
      // O próprio painel não pode ser recriado por esta API (ela morreria
      // antes do início); fica para o helper destacado, após o dump.
      let unidadeSelf: UnidadeProcesso | null = null;

      for (const unidade of unidades) {
        if (ehProprioProcesso(unidade.processName)) {
          unidadeSelf = unidade;
          continue;
        }

        // Remove o registro anterior (se existir) para que o processo seja
        // recriado com o ambiente limpo e o filter_env aplicado. O PM2, ao
        // reiniciar um nome já existente, reutiliza o ambiente antigo.
        // A porta é derrubada junto para eliminar eventuais órfãos.
        await excluirProcessoNoPm2(unidade.processName, unidade.port);
        const config = montarConfigUnidade(unidade);
        await iniciarProcessoNoPm2(config);
      }
      await salvarDump();

      if (unidadeSelf) {
        recriarSelfDepois(unidadeSelf);
      }

      return unidadeSelf !== null;
    })
  );
}

// Desabilita a inicialização automática: remove todos os processos e salva o
// dump para que não sejam restaurados no boot.
// O próprio painel é apenas removido do dump (permanece online): parar a
// API derrubaria o painel inteiro. Retorna true quando isso ocorreu.
export async function desabilitarAutostart(
  unidades: UnidadeProcesso[]
): Promise<boolean> {
  return serializar(() =>
    executarNoPm2(async () => {
      const nomesSelf: string[] = [];

      for (const unidade of unidades) {
        if (ehProprioProcesso(unidade.processName)) {
          nomesSelf.push(unidade.processName);
          continue;
        }
        await excluirProcessoNoPm2(unidade.processName, unidade.port);
      }
      await salvarDump();

      removerNomesDoDump(nomesSelf);

      return nomesSelf.length > 0;
    })
  );
}

// Inicia um processo (registra se necessário) sem alterar o autostart.
// Quando "manterNoBoot" é true (projeto com início automático ativo), grava o
// dump para que o processo continue na lista de restauração do boot.
// Para o próprio painel, delega ao helper destacado.
export async function iniciarProcesso(
  unidade: UnidadeProcesso,
  manterNoBoot = false
): Promise<{ selfGerenciado: boolean }> {
  // Esta API é o próprio painel: se está respondendo, o processo existe.
  // O controller aciona process.exit() após enviar a resposta; o PM2 com
  // autorestart: true reinicia o processo automaticamente. O timer
  // agendado abaixo funciona como backup caso o autorestart falhe.
  if (ehProprioProcesso(unidade.processName)) {
    agendarRestartSelf(unidade.processName);
    return { selfGerenciado: true };
  }

  return serializar(() =>
    executarNoPm2(async () => {
      const config = montarConfigUnidade(unidade);

      // Se já existe com o nome, remove antes de recriar para aplicar o
      // ambiente limpo (filter_env). O restart direto por nome reutilizaria
      // o ambiente antigo, possivelmente com variáveis do painel.
      const existente = await obterProcessoSeExistir(unidade.processName);
      if (existente) {
        await excluirProcessoNoPm2(unidade.processName, unidade.port);
      }

      await iniciarProcessoNoPm2(config);

      if (manterNoBoot) {
        await salvarDump();
      }

      return { selfGerenciado: false };
    })
  );
}

// Reinicia um processo já registrado.
// Quando "manterNoBoot" é true (projeto com início automático ativo), grava o
// dump para que o processo continue na lista de restauração do boot.
// Para o próprio painel, delega ao helper destacado.
export async function reiniciarProcesso(
  unidade: UnidadeProcesso,
  manterNoBoot = false
): Promise<{ selfGerenciado: boolean }> {
  // O próprio painel não pode ser reiniciado por aqui (mataria o processo
  // no meio da operação). O controller aciona process.exit() após enviar
  // a resposta; o PM2 com autorestart: true reinicia automaticamente. O
  // timer agendado abaixo funciona como backup caso o autorestart falhe.
  if (ehProprioProcesso(unidade.processName)) {
    agendarRestartSelf(unidade.processName);
    return { selfGerenciado: true };
  }

  return serializar(() =>
    executarNoPm2(async () => {
      // O processo precisa estar registrado para o reinício fazer sentido.
      await garantirProcesso(unidade);

      // Recria o registro com a configuração atual (incluindo o env editado
      // do projeto). O pm2.restart por nome apenas reutilizaria o ambiente
      // antigo e ignoraria mudanças nas variáveis de ambiente.
      await excluirProcessoNoPm2(unidade.processName, unidade.port);
      const config = montarConfigUnidade(unidade);
      await iniciarProcessoNoPm2(config);

      if (manterNoBoot) {
        await salvarDump();
      }

      return { selfGerenciado: false };
    })
  );
}

// Para um processo já registrado.
// Bloqueado para o próprio painel: derrubaria a API que atende o pedido.
export async function pararProcesso(unidade: UnidadeProcesso): Promise<void> {
  if (ehProprioProcesso(unidade.processName)) {
    throw new ErroNegocio(
      400,
      "Não é possível parar o processo do próprio painel pela interface: isso derrubaria a API. Use \"pm2 stop <nome>\" no terminal."
    );
  }

  return serializar(() =>
    executarNoPm2(async () => {
      const nome = await garantirProcesso(unidade);
      await pararProcessoNoPm2(nome);
      // O stop pode deixar filhos órfãos segurando a porta; derruba para
      // liberar de vez.
      await derrubarProcessosDaPorta(unidade.port);
    })
  );
}
