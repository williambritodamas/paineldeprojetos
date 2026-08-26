// Modal de Git Pull com opcoes de comandos pos-pull.

import { CheckCircle, Download, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import type { GitPullStep } from "../services/gitService";
import ProjectModal from "./ProjectModal";

interface Props {
  aberto: boolean;
  nomeProjeto: string;
  aoFechar: () => void;
  aoConfirmar: (opcoes: {
    pull: boolean;
    npmInstall: boolean;
    prismaMigrate: boolean;
    npmBuild: boolean;
  }) => Promise<void>;
  executando: boolean;
  resultado: GitPullStep[] | null;
  erroGeral: string | null;
}

export default function GitPullModal({
  aberto,
  nomeProjeto,
  aoFechar,
  aoConfirmar,
  executando,
  resultado,
  erroGeral,
}: Props) {
  const [pull, setPull] = useState(true);
  const [npmInstall, setNpmInstall] = useState(false);
  const [prismaMigrate, setPrismaMigrate] = useState(false);
  const [npmBuild, setNpmBuild] = useState(false);

  async function handleConfirmar() {
    await aoConfirmar({ pull, npmInstall, prismaMigrate, npmBuild });
  }

  const temResultado = resultado && resultado.length > 0;

  return (
    <ProjectModal
      aberto={aberto}
      titulo={`Atualizar: ${nomeProjeto}`}
      aoFechar={executando ? () => {} : aoFechar}
    >
      {!temResultado ? (
        <>
          <p className="text-sm text-slate-400">
            Selecione os comandos que deseja executar apos o git pull:
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={pull}
                onChange={(e) => setPull(e.target.checked)}
                disabled={executando}
                className="h-4 w-4 accent-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">
                  Git pull
                </span>
                <p className="text-xs text-slate-500">
                  Atualizar codigo do repositorio remoto
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={npmInstall}
                onChange={(e) => setNpmInstall(e.target.checked)}
                disabled={executando}
                className="h-4 w-4 accent-sky-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">
                  npm install
                </span>
                <p className="text-xs text-slate-500">
                  Instalar/atualizar dependencias
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prismaMigrate}
                onChange={(e) => setPrismaMigrate(e.target.checked)}
                disabled={executando}
                className="h-4 w-4 accent-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">
                  npx prisma migrate dev
                </span>
                <p className="text-xs text-slate-500">
                  Aplicar mudancas no banco de dados
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={npmBuild}
                onChange={(e) => setNpmBuild(e.target.checked)}
                disabled={executando}
                className="h-4 w-4 accent-amber-500"
              />
              <div>
                <span className="text-sm font-medium text-slate-200">
                  npm run build
                </span>
                <p className="text-xs text-slate-500">
                  Compilar o projeto para producao
                </p>
              </div>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={aoFechar}
              disabled={executando}
              className="botao-secundario w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={executando || !pull}
              className="botao-primario w-full sm:w-auto"
            >
              {executando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Executar
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            {resultado.map((step, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${
                  step.success
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-red-500/30 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.success ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium text-slate-200">
                    {step.command}
                  </span>
                </div>
                {step.output && (
                  <pre className="mt-2 max-h-24 overflow-y-auto rounded bg-base-900 p-2 text-xs text-slate-400">
                    {step.output}
                  </pre>
                )}
                {step.error && (
                  <p className="mt-1 text-xs text-red-400">{step.error}</p>
                )}
              </div>
            ))}
          </div>

          {erroGeral && (
            <p className="mt-3 text-sm text-red-400">{erroGeral}</p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={aoFechar}
              className="botao-secundario"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </ProjectModal>
  );
}
