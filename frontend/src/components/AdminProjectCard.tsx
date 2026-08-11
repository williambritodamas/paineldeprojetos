// Card de projeto na área administrativa.
// Inclui ações de edição, exclusão e ativar/desativar.

import { ExternalLink, Pencil, Power, Trash2 } from "lucide-react";
import type { Project } from "../types";
import { gerarUrlProjeto } from "../utils/projectUrl";
import StatusBadge from "./StatusBadge";

interface Props {
  project: Project;
  aoEditar: (projeto: Project) => void;
  aoExcluir: (projeto: Project) => void;
  aoAlternar: (projeto: Project) => void;
}

export default function AdminProjectCard({
  project,
  aoEditar,
  aoExcluir,
  aoAlternar,
}: Props) {
  const urlProjeto = gerarUrlProjeto(project.port);

  return (
    <article className="card-padrao flex gap-5 p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-base-700 text-2xl">
        {project.icon || "📁"}
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
            Porta: <strong className="font-medium text-slate-300">{project.port}</strong>
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
    </article>
  );
}