// Modal de confirmação para resgatar (checkout) um commit anterior.

import { AlertTriangle, CheckCircle, GitCommit, Loader2 } from "lucide-react";
import { useState } from "react";
import type { GitCommit as GitCommitType } from "../services/gitService";
import * as gitService from "../services/gitService";
import ProjectModal from "./ProjectModal";

interface Props {
  aberto: boolean;
  projectId: number | null;
  commit: GitCommitType | null;
  aoFechar: () => void;
  aoSucesso: () => void;
}

export default function CommitRollbackModal({
  aberto,
  projectId,
  commit,
  aoFechar,
  aoSucesso,
}: Props) {
  const [confirmado, setConfirmado] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<"sucesso" | "erro" | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  async function handleConfirmar() {
    if (!projectId || !commit) return;

    setExecutando(true);
    setMensagemErro(null);

    try {
      await gitService.checkoutCommit(projectId, commit.hash);
      setResultado("sucesso");
      aoSucesso();
    } catch (erro: any) {
      setResultado("erro");
      setMensagemErro(
        erro?.response?.data?.error ||
          erro?.message ||
          "Erro ao realizar checkout."
      );
    } finally {
      setExecutando(false);
    }
  }

  function handleFechar() {
    setConfirmado(false);
    setExecutando(false);
    setResultado(null);
    setMensagemErro(null);
    aoFechar();
  }

  return (
    <ProjectModal
      aberto={aberto}
      titulo="Resgatar Commit"
      aoFechar={executando ? () => {} : handleFechar}
    >
      {!resultado ? (
        <>
          <div className="space-y-4">
            <div className="rounded-lg border border-base-600 bg-base-700/50 p-4">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-sky-400" />
                <span className="font-mono text-sm text-sky-400">
                  {commit?.hashAbreviado}
                </span>
                <span className="text-xs text-slate-500">{commit?.data}</span>
              </div>
              <p className="mt-1 text-sm text-slate-200">{commit?.mensagem}</p>
              <p className="mt-0.5 text-xs text-slate-500">{commit?.autor}</p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="text-sm text-amber-200">
                <p className="font-medium">Atenção!</p>
                <p className="mt-1 text-amber-300/80">
                  O projeto será alterado para o estado deste commit. Esta é uma
                  operação <strong>isolada</strong> (detached HEAD) — o branch
                  principal não será alterado. Para voltar ao estado atual, faça{" "}
                  <code className="rounded bg-base-900 px-1 py-0.5 text-xs">
                    git checkout main
                  </code>{" "}
                  na pasta do projeto.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                disabled={executando}
                className="h-4 w-4 accent-amber-500"
              />
              <span className="text-sm text-slate-300">
                Eu entendo que o projeto será alterado para este commit
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleFechar}
              disabled={executando}
              className="botao-secundario w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={executando || !confirmado}
              className="botao-primario w-full sm:w-auto"
            >
              {executando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                "Confirmar Resgate"
              )}
            </button>
          </div>
        </>
      ) : resultado === "sucesso" ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="h-12 w-12 text-emerald-400" />
            <p className="text-center text-sm text-slate-200">
              Checkout realizado com sucesso!
            </p>
            <p className="text-center text-xs text-slate-400">
              O projeto agora está no commit{" "}
              <span className="font-mono text-sky-400">
                {commit?.hashAbreviado}
              </span>
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFechar}
              className="botao-secundario"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertTriangle className="h-12 w-12 text-red-400" />
            <p className="text-center text-sm text-red-400">
              Erro ao realizar checkout
            </p>
            {mensagemErro && (
              <p className="text-center text-xs text-slate-400">
                {mensagemErro}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFechar}
              className="botao-secundario"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </ProjectModal>
  );
}
