// Helper destacado do Painel de Projetos.
//
// Recria o próprio processo do painel no PM2 sem depender da API que está
// sendo reiniciada. É acionado como processo separado (detached) e recebe,
// via arquivo JSON temporário, a configuração já montada pelo serviço:
//   argv[2] = caminho do JSON { "config": <config do PM2> }
//
// Sequência executada contra o daemon: excluir -> iniciar -> dump (pm2 save).
// O dump é corrigido ao final pelo mesmo mecanismo usado pelo serviço
// (o campo "cwd" gravado pelo pm2.dump reflete quem acionou o dump).
//
// Importante: ignora SIGTERM/SIGINT durante a operação. Ao excluir
// "painel-backend", o treekill do PM2 pode alcançar este helper (ele é
// descendente da árvore sendo morta enquanto a API ainda vive); ignorar os
// sinais garante que a recriação seja concluída. Um limite de tempo duro
// impede que um erro qualquer o deixe pendurado para sempre.

const fs = require("fs");
const os = require("os");
const path = require("path");
const pm2 = require("pm2");

const LIMITE_MS = 30000;

function conectarAoPm2() {
  return new Promise((resolver, rejeitar) => {
    pm2.connect((erro) => (erro ? rejeitar(erro) : resolver()));
  });
}

function desconectarDoPm2() {
  try {
    pm2.disconnect();
  } catch {
    // Nada a desconectar.
  }
}

function listarProcessos() {
  return new Promise((resolver, rejeitar) => {
    pm2.list((erro, lista) => (erro ? rejeitar(erro) : resolver(lista ?? [])));
  });
}

function iniciarNoPm2(config) {
  return new Promise((resolver, rejeitar) => {
    pm2.start(config, (erro) => (erro ? rejeitar(erro) : resolver()));
  });
}

function pararPids(pids) {
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Processo já encerrou entre a leitura e o sinal.
    }
  }
}

// Derruba sobreviventes da porta informada (best-effort), espelhando a
// segurança do serviço: nunca mata o daemon do PM2 nem este helper.
function derrubarPorta(porta) {
  if (!porta || !Number.isInteger(porta)) {
    return;
  }

  const protegidos = new Set([process.pid]);
  try {
    const caminhoPid = path.join(
      process.env.PM2_HOME || path.join(os.homedir(), ".pm2"),
      "pm2.pid"
    );
    const daemon = Number(fs.readFileSync(caminhoPid, "utf8").trim());
    if (Number.isInteger(daemon) && daemon > 1) {
      protegidos.add(daemon);
    }
  } catch {
    // Sem pid de daemon disponível; segue com os protegidos conhecidos.
  }

  let saida = "";
  for (const comando of [`fuser ${porta}/tcp`, `lsof -ti tcp:${porta}`]) {
    try {
      saida = require("child_process")
        .execSync(comando, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
        .trim();
      break;
    } catch {
      saida = "";
    }
  }

  const pids = saida
    .split(/[\s,]+/)
    .map((valor) => Number(valor.replace(/[^0-9]/g, "")))
    .filter((pid) => pid > 0 && !protegidos.has(pid));

  pararPids(pids);
}

// Reescreve o campo "cwd" de cada entrada do dump usando o env.PWD real,
// pois o pm2.dump grava o diretório de trabalho de quem acionou o dump.
function corrigirCwdDoDump() {
  const caminho = path.join(
    process.env.PM2_HOME || path.join(os.homedir(), ".pm2"),
    "dump.pm2"
  );

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
}

function salvarDump() {
  return new Promise((resolver, rejeitar) => {
    pm2.dump(async (erro) => {
      if (erro) {
        rejeitar(erro);
        return;
      }
      try {
        corrigirCwdDoDump();
        resolver();
      } catch (erroCorrecao) {
        rejeitar(erroCorrecao);
      }
    });
  });
}

async function executar(config) {
  await conectarAoPm2();
  try {
    const nome = config.name;
    const porta = config.env?.PORT ? Number(config.env.PORT) : null;

    // Remove o registro anterior (se existir) para recriar com ambiente limpo.
    const lista = await listarProcessos();
    const existente = lista.find(
      (processo) => (processo.pm2_env?.name ?? processo.name) === nome
    );
    if (existente) {
      await new Promise((resolver) => {
        pm2.delete(nome, () => resolver());
      });
      derrubarPorta(porta);
    }

    await iniciarNoPm2(config);
    await salvarDump();
  } finally {
    desconectarDoPm2();
  }
}

function registrarLog(erro) {
  const mensagem = `[${new Date().toISOString()}] ${
    erro?.stack || String(erro)
  }\n`;
  try {
    fs.appendFileSync(
      path.join(os.tmpdir(), "painel-self-helper.log"),
      mensagem
    );
  } catch {
    // Sem log disponível; nada mais a fazer.
  }
}

// Sinais ignorados durante a operação (ver cabeçalho). SIGKILL continua
// valendo como rede de segurança externa.
for (const sinal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(sinal, () => {});
}

const tempoLimite = setTimeout(() => {
  registrarLog(new Error(`Helper excedeu ${LIMITE_MS}ms e foi encerrado.`));
  process.exit(1);
}, LIMITE_MS);
tempoLimite.unref();

const arquivo = process.argv[2];

if (!arquivo || !fs.existsSync(arquivo)) {
  registrarLog(new Error(`Arquivo de instrução ausente: ${arquivo}`));
  process.exit(1);
}

let config;
try {
  const conteudo = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  config = conteudo.config;
} catch (erroLeitura) {
  registrarLog(erroLeitura);
  fs.unlinkSync(arquivo);
  process.exit(1);
}

executar(config)
  .then(() => {
    fs.unlinkSync(arquivo);
    process.exit(0);
  })
  .catch((erro) => {
    registrarLog(erro);
    try {
      fs.unlinkSync(arquivo);
    } catch {
      // Arquivo já removido.
    }
    process.exit(1);
  });
