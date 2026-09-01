// Modal que exibe todos os commits remotos de um projeto.

import { ArrowDownAZ, ArrowUpAZ, Download, GitCommit, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";
import type { GitCommit as GitCommitType } from "../services/gitService";
import * as gitService from "../services/gitService";
import ProjectModal from "./ProjectModal";

interface Props {
  aberto: boolean;
  projectId: number | null;
  nomeProjeto: string;
  aoFechar: () => void;
  aoRestaurar: (commit: GitCommitType) => void;
}

export default function CommitsModal({
  aberto,
  projectId,
  nomeProjeto,
  aoFechar,
  aoRestaurar,
}: Props) {
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<"desc" | "asc">("desc");

  // Carrega commits quando o modal abre.
  const carregarCommits = async (id: number) => {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await gitService.getAllRemoteCommits(id);
      setCommits(dados);
    } catch {
      setErro("Erro ao carregar commits.");
    } finally {
      setCarregando(false);
    }
  };

  // Efeito simples: quando abre com projectId, carrega.
  if (aberto && projectId && commits.length === 0 && !carregando && !erro) {
    carregarCommits(projectId);
  }

  // Reseta estado ao fechar.
  function handleFechar() {
    setCommits([]);
    setErro(null);
    setOrdem("desc");
    aoFechar();
  }

  const commitsOrdenados = useMemo(() => {
    const copia = [...commits];
    if (ordem === "asc") {
      copia.reverse();
    }
    return copia;
  }, [commits, ordem]);

  return (
    <ProjectModal
      aberto={aberto}
      titulo={`Commits: ${nomeProjeto}`}
      aoFechar={handleFechar}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {commits.length} commit{commits.length !== 1 ? "s" : ""} no remoto
        </p>
        <button
          type="button"
          onClick={() => setOrdem(ordem === "desc" ? "asc" : "desc")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-base-600 bg-base-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-sky-500/50 hover:text-sky-400"
        >
          {ordem === "desc" ? (
            <>
              <ArrowDownAZ className="h-3.5 w-3.5" />
              Mais recente primeiro
            </>
          ) : (
            <>
              <ArrowUpAZ className="h-3.5 w-3.5" />
              Mais antigo primeiro
            </>
          )}
        </button>
      </div>

      {carregando && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
        </div>
      )}

      {erro && (
        <p className="py-4 text-center text-sm text-red-400">{erro}</p>
      )}

      {!carregando && !erro && commitsOrdenados.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">
          Nenhum commit encontrado.
        </p>
      )}

      {!carregando && !erro && commitsOrdenados.length > 0 && (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {commitsOrdenados.map((commit, i) => {
            const primeiroNovo = commitsOrdenados.findIndex((c) => c.isNew);
            const mostrarSeparador = commit.isNew && i === primeiroNovo;

            return (
              <div key={commit.hash}>
                {mostrarSeparador && (
                  <div className="my-2 flex items-center gap-2">
                    <div className="h-px flex-1 bg-amber-500/40" />
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                      <Download className="h-3 w-3" />
                      Novos commits (não pullados)
                    </span>
                    <div className="h-px flex-1 bg-amber-500/40" />
                  </div>
                )}
                <div
                  className={`rounded-lg border p-3 ${
                    commit.isNew
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-base-600 bg-base-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitCommit className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                      <span className="font-mono text-xs text-sky-400">
                        {commit.hashAbreviado}
                      </span>
                      {commit.isNew && (
                        <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-400">
                          NOVO
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {commit.data}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">{commit.mensagem}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-slate-500">{commit.autor}</p>
                    <button
                      type="button"
                      onClick={() => aoRestaurar(commit)}
                      className="inline-flex items-center gap-1 rounded border border-base-600 bg-base-700 px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-sky-500/50 hover:text-sky-400"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleFechar}
          className="botao-secundario"
        >
          Fechar
        </button>
      </div>
    </ProjectModal>
  );
}
