// Card de projeto na área administrativa.
// Inclui ações de edição, exclusão, ativar/desativar e,
// para administradores, o gerenciamento via PM2.

import {
  ExternalLink,
  Folder,
  Pencil,
  Play,
  Power,
  RotateCcw,
  Square,
  Tag,
  Terminal,
  Trash2,
} from "lucide-react";
import type { Project, ProjectProcess } from "../types";
import { gerarUrlProjeto } from "../utils/projectUrl";
import ProjectIcon from "./ProjectIcon";
import StatusBadge from "./StatusBadge";

interface Props {
  project: Project;
  isAdmin: boolean;
  pm2Ocupado: boolean;
  aoEditar: (projeto: Project) => void;
  aoExcluir: (projeto: Project) => void;
  aoAlternar: (projeto: Project) => void;
  aoAlternarAutostart: (projeto: Project) => void;
  aoIniciar: (projeto: Project) => void;
  aoReiniciar: (projeto: Project) => void;
  aoParar: (projeto: Project) => void;
  aoIniciarProcesso: (projeto: Project, processo: ProjectProcess) => void;
  aoReiniciarProcesso: (projeto: Project, processo: ProjectProcess) => void;
  aoPararProcesso: (projeto: Project, processo: ProjectProcess) => void;
}

function infoStatus(status?: Project["pm2Status"]): {
  texto: string;
  classe: string;
} {
  switch (status) {
    case "online":
      return {
        texto: "Online",
        classe: "bg-emerald-500/15 text-emerald-400",
      };
    case "parado":
      return {
        texto: "Parado",
        classe: "bg-amber-500/15 text-amber-400",
      };
    case "erro":
      return { texto: "Erro", classe: "bg-red-500/15 text-red-400" };
    case "iniciando":
      return {
        texto: "Iniciando",
        classe: "bg-sky-500/15 text-sky-400",
      };
    case "indisponivel":
      return {
        texto: "PM2 indisponível",
        classe: "bg-base-700 text-slate-400",
      };
    case "nao_registrado":
      return {
        texto: "Não registrado",
        classe: "bg-base-700 text-slate-400",
      };
    default:
      return {
        texto: "Desconhecido",
        classe: "bg-base-700 text-slate-400",
      };
  }
}

function formatarUptime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return "";
  }

  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) {
    return `${segundos}s`;
  }
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) {
    return `${minutos}min`;
  }
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return `${horas}h`;
  }
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

export default function AdminProjectCard({
  project,
  isAdmin,
  pm2Ocupado,
  aoEditar,
  aoExcluir,
  aoAlternar,
  aoAlternarAutostart,
  aoIniciar,
  aoReiniciar,
  aoParar,
  aoIniciarProcesso,
  aoReiniciarProcesso,
  aoPararProcesso,
}: Props) {
  const urlProjeto = gerarUrlProjeto(project.port);
  const status = infoStatus(project.pm2Status);
  const online = project.pm2Status === "online";
  const registrado =
    !!project.pm2Status &&
    project.pm2Status !== "nao_registrado" &&
    project.pm2Status !== "indisponivel";
  const nomeProcesso = project.pm2Name?.trim() || `proj-${project.id}`;

  return (
    <article className="card-padrao space-y-4 p-5">
      <div className="flex gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-base-700">
          <ProjectIcon icon={project.icon} className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{project.name}</h3>
            <StatusBadge active={project.active} />
          </div>

          <p className="truncate text-sm text-slate-400">
            {project.description || "Sem descrição."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>
              Porta:{" "}
              <strong className="font-medium text-slate-300">
                {project.port}
              </strong>
            </span>
            <a
              href={urlProjeto}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 transition hover:text-sky-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Acessar
            </a>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {project.folderPath || "Pasta não configurada"}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 shrink-0" />
                {project.script || "npm start"}
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => aoAlternar(project)}
            title={project.active ? "Desativar projeto" : "Ativar projeto"}
            className={
              project.active
                ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
                : "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-emerald-500/50 hover:text-emerald-400"
            }
          >
            <Power className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => aoEditar(project)}
            title="Editar projeto"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-sky-500/50 hover:text-sky-400"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => aoExcluir(project)}
            title="Excluir projeto"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-base-600 bg-base-800/40 p-3">
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wide text-slate-500">
            Processo principal
          </span>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.classe}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {pm2Ocupado ? "Aplicando..." : status.texto}
            </span>

            {online && project.pm2UptimeMs !== null && (
              <span className="text-xs text-slate-400">
                Uptime {formatarUptime(project.pm2UptimeMs)}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Tag className="h-3.5 w-3.5" />
              {nomeProcesso}
            </span>

            <button
              type="button"
              disabled={pm2Ocupado}
              onClick={() => aoAlternarAutostart(project)}
              title={
                project.autostart
                  ? "Desabilitar inicialização automática"
                  : "Habilitar inicialização automática"
              }
              className="inline-flex items-center gap-2 text-xs text-slate-300 transition hover:text-white disabled:opacity-50"
            >
              <span
                className={`relative h-5 w-9 rounded-full transition ${
                  project.autostart ? "bg-emerald-500" : "bg-base-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    project.autostart ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
              Início automático
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!online && (
              <button
                type="button"
                disabled={pm2Ocupado}
                onClick={() => aoIniciar(project)}
                title="Iniciar processo"
                className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                Iniciar
              </button>
            )}

            <button
              type="button"
              disabled={pm2Ocupado || !registrado}
              onClick={() => aoReiniciar(project)}
              title="Reiniciar processo"
              className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-sky-500/50 hover:text-sky-400 disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </button>

            <button
              type="button"
              disabled={pm2Ocupado || !online}
              onClick={() => aoParar(project)}
              title="Parar processo"
              className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
            >
              <Square className="h-3.5 w-3.5" />
              Parar
            </button>
          </div>

          {(project.processes?.length ?? 0) > 0 && (
            <div className="mt-4 space-y-3 border-t border-base-600 pt-3">
              <span className="inline-block text-xs font-medium uppercase tracking-wide text-slate-500">
                Processos adicionais
              </span>

              {project.processes?.map((processo) => {
                const statusInfo = infoStatus(processo.pm2Status);
                const processoOnline = processo.pm2Status === "online";
                const processoRegistrado =
                  !!processo.pm2Status &&
                  processo.pm2Status !== "nao_registrado" &&
                  processo.pm2Status !== "indisponivel";

                return (
                  <div
                    key={processo.id}
                    className="rounded-lg border border-base-600 bg-base-700/40 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {processo.label}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          Porta: {processo.port} · {processo.folderPath}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.classe}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {pm2Ocupado ? "Aplicando..." : statusInfo.texto}
                      </span>

                      {processoOnline && processo.pm2UptimeMs !== null && (
                        <span className="text-xs text-slate-400">
                          Uptime {formatarUptime(processo.pm2UptimeMs)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {!processoOnline && (
                        <button
                          type="button"
                          disabled={pm2Ocupado}
                          onClick={() => aoIniciarProcesso(project, processo)}
                          title="Iniciar processo"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Iniciar
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={pm2Ocupado || !processoRegistrado}
                        onClick={() => aoReiniciarProcesso(project, processo)}
                        title="Reiniciar processo"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-sky-500/50 hover:text-sky-400 disabled:opacity-40"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reiniciar
                      </button>

                      <button
                        type="button"
                        disabled={pm2Ocupado || !processoOnline}
                        onClick={() => aoPararProcesso(project, processo)}
                        title="Parar processo"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-40"
                      >
                        <Square className="h-3.5 w-3.5" />
                        Parar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}