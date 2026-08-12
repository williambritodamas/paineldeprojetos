// Serviço de integração com o PM2 do servidor.
// Gerencia os processos dos projetos: iniciar, parar, reiniciar,
// habilitar/desabilitar inicialização automática (pm2 save) e status.
//
// O nome do processo no PM2 usa o campo configurável "pm2Name" do projeto
// (ex.: "workshop") quando preenchido; senão, cai no padrão estável
// "proj-<id>", permitindo que renomeações do projeto no painel não
// quebrem o gerenciamento.

import os from "os";
import path from "path";
import fs from "fs";
import pm2 from "pm2";
import { ErroNegocio } from "../utils/helpers";

// Projeto no formato mínimo necessário para o PM2.
export interface ProjetoPm2 {
  id: number;
  name: string;
  folderPath: string | null;
  script: string;
  pm2Name?: string | null;
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

// Nome do processo no PM2.
// Usa o nome configurado (pm2Name) quando informado; caso contrário,
// mantém o padrão estável "proj-<id>".
export function nomeProcesso(projeto: { id: number; pm2Name?: string | null }): string {
  const nomeConfigurado = projeto.pm2Name?.trim();
  return nomeConfigurado && nomeConfigurado.length > 0
    ? nomeConfigurado
    : `proj-${projeto.id}`;
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

function validarProjetoPm2(projeto: ProjetoPm2): void {
  if (!projeto.folderPath || projeto.folderPath.trim().length === 0) {
    throw new ErroNegocio(
      400,
      "Configure o caminho da pasta do projeto antes de gerenciá-lo pelo PM2."
    );
  }
}

// Monta a configuração de início do processo no PM2.
function montarConfigProcesso(projeto: ProjetoPm2): object {
  validarProjetoPm2(projeto);
  const { script, args } = parsearComando(projeto.script);

  return {
    name: nomeProcesso(projeto),
    script,
    args,
    cwd: projeto.folderPath!.trim(),
    exec_mode: "fork",
  };
}

async function obterProcessoSeExistir(
  projeto: ProjetoPm2
): Promise<EstruturaProcesso | undefined> {
  const nome = nomeProcesso(projeto);
  const lista = await listarProcessos();
  return lista.find(
    (processo) => (processo.pm2_env?.name ?? processo.name) === nome
  );
}

// Garante que o processo esteja registrado, senão lança erro.
async function garantirProcesso(projeto: ProjetoPm2): Promise<string> {
  const existente = await obterProcessoSeExistir(projeto);

  if (!existente) {
    throw new ErroNegocio(
      400,
      `O projeto "${projeto.name}" não está registrado no PM2.`
    );
  }

  return nomeProcesso(projeto);
}

// Habilita a inicialização automática: registra o processo e salva o dump.
export async function habilitarAutostart(projeto: ProjetoPm2): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const config = montarConfigProcesso(projeto);
      await iniciarProcessoNoPm2(config);
      await salvarDump();
    })
  );
}

// Desabilita a inicialização automática: remove o processo e salva o dump.
export async function desabilitarAutostart(projeto: ProjetoPm2): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      await excluirProcessoNoPm2(nomeProcesso(projeto));
      await salvarDump();
    })
  );
}

// Inicia o processo (registra se necessário) sem alterar o autostart.
export async function iniciarProcesso(projeto: ProjetoPm2): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const existente = await obterProcessoSeExistir(projeto);

      if (!existente) {
        const config = montarConfigProcesso(projeto);
        await iniciarProcessoNoPm2(config);
      } else {
        await reiniciarProcessoNoPm2(nomeProcesso(projeto));
      }
    })
  );
}

// Reinicia um processo já registrado.
export async function reiniciarProcesso(projeto: ProjetoPm2): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const nome = await garantirProcesso(projeto);
      await reiniciarProcessoNoPm2(nome);
    })
  );
}

// Para um processo já registrado.
export async function pararProcesso(projeto: ProjetoPm2): Promise<void> {
  return serializar(() =>
    executarNoPm2(async () => {
      const nome = await garantirProcesso(projeto);
      await pararProcessoNoPm2(nome);
    })
  );
}