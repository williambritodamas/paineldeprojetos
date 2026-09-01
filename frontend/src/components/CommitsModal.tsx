// Modal que exibe todos os commits remotos de um projeto.

import { ArrowDownAZ, ArrowUpAZ, GitCommit } from "lucide-react";
import { useState, useMemo } from "react";
import type { GitCommit as GitCommitType } from "../services/gitService";
import * as gitService from "../services/gitService";
import ProjectModal from "./ProjectModal";

interface Props {
  aberto: boolean;
  projectId: number | null;
  nomeProjeto: string;
  aoFechar: () => void;
}

export default function CommitsModal({
  aberto,
  projectId,
  nomeProjeto,
  aoFechar,
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
          {commitsOrdenados.map((commit) => (
            <div
              key={commit.hash}
              className="rounded-lg border border-base-600 bg-base-700/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <span className="font-mono text-xs text-sky-400">
                    {commit.hashAbreviado}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {commit.data}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{commit.mensagem}</p>
              <p className="mt-0.5 text-xs text-slate-500">{commit.autor}</p>
            </div>
          ))}
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
