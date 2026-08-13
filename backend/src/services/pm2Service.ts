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

// Nome de um processo adicional no PM2: "proj-<id>-<slug(nome)>".
export function nomeProcessoExtra(projetoId: number, label: string): string {
  const slug = slugificar(label);
  return `proj-${projetoId}-${slug || "processo"}`;
}

// Monta a unidade do processo principal do projeto.
export function montarUnidadePrincipal(projeto: {
  id: number;
  folderPath: string | null;
  script: string;
  pm2Name?: string | null;
}): UnidadeProcesso {
  return {
    processName: nomeProcesso(projeto),
    folderPath: projeto.folderPath,
    script: projeto.script,
  };
}

// Monta a unidade de um processo adicional do projeto.
export function montarUnidadeExtra(
  projetoId: number,
  processo: { label: string; folderPath: string; script: string }
): UnidadeProcesso {
  return {
    processName: nomeProcessoExtra(projetoId, processo.label),
    folderPath: processo.folderPath,
    script: processo.script,
  };
}

// Monta todas as unidades (principal + adicionais) de um projeto.
export function montarUnidadesProjeto(
  projeto: {
    id: number;
    folderPath: string | null;
    script: string;
    pm2Name?: string | null;
  },
  processosExtras: Array<{
    label: string;
    folderPath: string;
    script: string;
  }>
): UnidadeProcesso[] {
  const unidades = [montarUnidadePrincipal(projeto)];

  for (const processo of processosExtras) {
    unidades.push(montarUnidadeExtra(projeto.id, processo));
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

function reiniciarProcessoNoPm2(nome: string): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    pm2.restart(nome, (erro) => {
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

  return {
    name: unidade.processName,
    script,
    args,
    cwd: unidade.folderPath!.trim(),
    exec_mode: "fork",
  };
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
      const existente = await obterProcessoSeExistir(unidade.processName);

      if (!existente) {
        const config = montarConfigUnidade(unidade);
        await iniciarProcessoNoPm2(config);
      } else {
        await reiniciarProcessoNoPm2(unidade.processName);
      }
    })
  );
}

// Reinicia um processo já registrado.
export async function reiniciarProcesso(unidade: UnidadeProcesso): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const nome = await garantirProcesso(unidade);
      await reiniciarProcessoNoPm2(nome);
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