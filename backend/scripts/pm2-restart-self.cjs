// Timer de reinício do próprio painel de projetos.
//
// Processo detached que espera N milissegundos e depois reinicia o processo
// no PM2 via API programática. Usado como backup caso o autorestart do PM2
// não funcione (ex.: max_restarts atingido).
//
// Uso: node pm2-restart-self.cjs <nome_processo> [delay_ms]

const pm2 = require("pm2");

const nome = process.argv[2] || "painel-backend";
const esperaMs = parseInt(process.argv[3] || "5000", 10);

function log(msg) {
  try {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    fs.appendFileSync(
      path.join(os.tmpdir(), "painel-restart-self.log"),
      `[${new Date().toISOString()}] ${msg}\n`
    );
  } catch { /* ignora */ }
}

// Ignora sinais para sobreviver ao treekill do PM2.
for (const sinal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  process.on(sinal, () => {});
}

log(`Timer agendado: ${nome} em ${esperaMs}ms`);

setTimeout(() => {
  log("Conectando ao PM2...");
  pm2.connect((err) => {
    if (err) {
      log(`Erro ao conectar: ${err.message}`);
      process.exit(1);
    }

    pm2.list((err2, lista) => {
      if (err2) {
        log(`Erro ao listar: ${err2.message}`);
        pm2.disconnect();
        process.exit(1);
      }

      const existe = (lista || []).find(
        (p) => (p.pm2_env?.name ?? p.name) === nome
      );

      if (existe) {
        log(`Processo "${nome}" encontrado. Reiniciando...`);
        pm2.restart(nome, (err3) => {
          if (err3) {
            log(`Erro ao reiniciar: ${err3.message}`);
          } else {
            log("Reinício agendado com sucesso.");
          }
          pm2.dump(() => {
            pm2.disconnect();
            process.exit(err3 ? 1 : 0);
          });
        });
      } else {
        log(`Processo "${nome}" não encontrado. Tentando start...`);
        pm2.start(nome, (err3) => {
          if (err3) {
            log(`Erro ao iniciar: ${err3.message}`);
          } else {
            log("Início agendado com sucesso.");
          }
          pm2.dump(() => {
            pm2.disconnect();
            process.exit(err3 ? 1 : 0);
          });
        });
      }
    });
  });
}, esperaMs);
