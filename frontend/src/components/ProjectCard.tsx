// Card de um projeto na vitrine pública.
// Abre o projeto em uma nova aba com a URL gerada dinamicamente.

import { ExternalLink, LifeBuoy } from "lucide-react";
import type { Project } from "../types";
import { gerarUrlProjeto } from "../utils/projectUrl";
import ProjectIcon from "./ProjectIcon";
import StatusBadge from "./StatusBadge";

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  const urlProjeto = gerarUrlProjeto(project.port);

  return (
    <article className="card-padrao flex flex-col gap-4 p-6 transition hover:border-sky-500/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-700">
          <ProjectIcon icon={project.icon} className="h-6 w-6" />
        </div>
        <StatusBadge active={project.active} />
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="text-base font-semibold text-white">
          {project.name}
        </h3>
        <p className="text-sm text-slate-400">
          {project.description || "Sem descrição."}
        </p>
      </div>

      <div className="space-y-3">
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-base-700 px-2.5 py-1 text-xs text-slate-300">
          <LifeBuoy className="h-3.5 w-3.5 text-sky-400" />
          Porta: {project.port}
        </p>

        <a
          href={urlProjeto}
          target="_blank"
          rel="noopener noreferrer"
          className="botao-primario w-full"
        >
          <ExternalLink className="h-4 w-4" />
          Acessar
        </a>
      </div>
    </article>
  );
}