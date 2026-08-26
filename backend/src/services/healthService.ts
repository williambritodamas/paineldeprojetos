// Service de monitoramento de portas.
// Verifica se as portas dos projetos estão respondendo.

import net from "net";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Verifica se uma porta está aberta no host especificado.
function verificarPorta(
  host: string,
  port: number,
  timeoutMs: number = 3000
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolvido = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      if (!resolvido) {
        resolvido = true;
        socket.destroy();
        resolve(true);
      }
    });

    socket.on("timeout", () => {
      if (!resolvido) {
        resolvido = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.on("error", () => {
      if (!resolvido) {
        resolvido = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.connect(port, host);
  });
}

export interface StatusPorta {
  projectId: number;
  port: number;
  host: string;
  aberta: boolean;
  latenciaMs: number | null;
  verificadoEm: Date;
}

// Verifica a porta de um projeto específico.
export async function verificarPortaProjeto(
  projectId: number
): Promise<StatusPorta | null> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, port: true, server: { select: { host: true } } },
  });

  if (!projeto) {
    return null;
  }

  const host = projeto.server?.host || "localhost";
  const inicio = Date.now();
  const aberta = await verificarPorta(host, projeto.port);
  const latenciaMs = aberta ? Date.now() - inicio : null;

  return {
    projectId: projeto.id,
    port: projeto.port,
    host,
    aberta,
    latenciaMs,
    verificadoEm: new Date(),
  };
}

// Verifica as portas de todos os projetos ativos.
export async function verificarTodasPortas(): Promise<StatusPorta[]> {
  const projetos = await prisma.project.findMany({
    where: { active: true },
    select: { id: true, port: true, server: { select: { host: true } } },
  });

  const resultados = await Promise.all(
    projetos.map(async (projeto) => {
      const host = projeto.server?.host || "localhost";
      const inicio = Date.now();
      const aberta = await verificarPorta(host, projeto.port);
      const latenciaMs = aberta ? Date.now() - inicio : null;

      return {
        projectId: projeto.id,
        port: projeto.port,
        host,
        aberta,
        latenciaMs,
        verificadoEm: new Date(),
      };
    })
  );

  return resultados;
}
