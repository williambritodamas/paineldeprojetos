// Formulário de cadastro/edição de projeto.

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { CriarProjetoDTO, Project } from "../types";

interface Props {
  projeto?: Project;
  isAdmin: boolean;
  aoSalvar: (dados: CriarProjetoDTO) => Promise<void>;
  aoCancelar: () => void;
  salvando: boolean;
}

interface LinhaProcessoExtra {
  id?: number;
  label: string;
  folderPath: string;
  script: string;
  port: string;
}

export default function ProjectForm({
  projeto,
  isAdmin,
  aoSalvar,
  aoCancelar,
  salvando,
}: Props) {
  const [nome, setNome] = useState(projeto?.name ?? "");
  const [descricao, setDescricao] = useState(projeto?.description ?? "");
  const [icone, setIcone] = useState(projeto?.icon ?? "");
  const [porta, setPorta] = useState(projeto?.port.toString() ?? "");
  const [ativo, setAtivo] = useState(projeto?.active ?? true);
  const [caminhoPasta, setCaminhoPasta] = useState(
    projeto?.folderPath ?? ""
  );
  const [comando, setComando] = useState(projeto?.script ?? "npm start");
  const [nomeProcesso, setNomeProcesso] = useState(
    projeto?.pm2Name ?? ""
  );
  const [temProcessosExtras, setTemProcessosExtras] = useState(
    (projeto?.processes?.length ?? 0) > 0
  );
  const [processosExtras, setProcessosExtras] = useState<LinhaProcessoExtra[]>(
    projeto?.processes?.map((processo) => ({
      id: processo.id,
      label: processo.label,
      folderPath: processo.folderPath,
      script: processo.script,
      port: String(processo.port),
    })) ?? []
  );

  function adicionarProcesso() {
    setProcessosExtras((atual) => [
      ...atual,
      { label: "", folderPath: "", script: "npm start", port: "" },
    ]);
  }

  function removerProcesso(indice: number) {
    setProcessosExtras((atual) => atual.filter((_, i) => i !== indice));
  }

  function atualizarProcesso(
    indice: number,
    campo: keyof LinhaProcessoExtra,
    valor: string
  ) {
    setProcessosExtras((atual) =>
      atual.map((processo, i) =>
        i === indice ? { ...processo, [campo]: valor } : processo
      )
    );
  }

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();

    const portaNum = Number(porta);

    await aoSalvar({
      name: nome.trim(),
      description: descricao.trim(),
      icon: icone.trim(),
      port: portaNum,
      active: ativo,
      ...(isAdmin
        ? {
            folderPath: caminhoPasta.trim(),
            script: comando.trim() || "npm start",
            pm2Name: nomeProcesso.trim() || null,
            processes: temProcessosExtras
              ? processosExtras.map((processo) => ({
                  id: processo.id,
                  label: processo.label.trim(),
                  folderPath: processo.folderPath.trim(),
                  script: processo.script.trim() || "npm start",
                  port: Number(processo.port),
                }))
              : [],
          }
        : {}),
    });
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      <div>
        <label htmlFor="nome" className="campo-label">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome do projeto"
          className="campo-input"
        />
      </div>

      <div>
        <label htmlFor="descricao" className="campo-label">
          Descrição
        </label>
        <textarea
          id="descricao"
          rows={2}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva brevemente o projeto"
          className="campo-input resize-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="icone" className="campo-label">
            Ícone
          </label>
          <input
            id="icone"
            type="text"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Ex.: 🎬"
            className="campo-input"
          />
        </div>

        <div>
          <label htmlFor="porta" className="campo-label">
            Porta
          </label>
          <input
            id="porta"
            type="number"
            required
            min={1}
            max={65535}
            value={porta}
            onChange={(e) => setPorta(e.target.value)}
            placeholder="Ex.: 3002"
            className="campo-input"
          />
        </div>
      </div>

      {isAdmin && (
        <>
          <div>
            <label htmlFor="caminhoPasta" className="campo-label">
              Caminho da pasta no servidor
            </label>
            <input
              id="caminhoPasta"
              type="text"
              value={caminhoPasta}
              onChange={(e) => setCaminhoPasta(e.target.value)}
              placeholder="Ex.: /home/usuario/apps/plataforma-videos"
              className="campo-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Pasta onde o projeto será executado via PM2 (apenas admin).
            </p>
          </div>

          <div>
            <label htmlFor="comando" className="campo-label">
              Comando de execução
            </label>
            <input
              id="comando"
              type="text"
              value={comando}
              onChange={(e) => setComando(e.target.value)}
              placeholder="Ex.: npm start"
              className="campo-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Ex.:{" "}
              <code className="rounded bg-base-800 px-1.5 py-0.5 text-slate-400">
                npm start
              </code>
              ,{" "}
              <code className="rounded bg-base-800 px-1.5 py-0.5 text-slate-400">
                npm run dev
              </code>
              ,{" "}
              <code className="rounded bg-base-800 px-1.5 py-0.5 text-slate-400">
                node server.js
              </code>
            </p>
          </div>

          <div>
            <label htmlFor="nomeProcesso" className="campo-label">
              Nome do processo no PM2
            </label>
            <input
              id="nomeProcesso"
              type="text"
              value={nomeProcesso}
              onChange={(e) => setNomeProcesso(e.target.value)}
              placeholder="Ex.: workshop"
              className="campo-input"
            />
            <p className="mt-1 text-xs text-slate-500">
              Deixe vazio para usar o padrão{" "}
              <code className="rounded bg-base-800 px-1.5 py-0.5 text-slate-400">
                proj-{"\u003cid\u003e"}
              </code>{" "}
              (apenas admin).
            </p>
          </div>

          <div className="rounded-xl border border-base-600 bg-base-800/40 p-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={temProcessosExtras}
                onChange={(e) => {
                  setTemProcessosExtras(e.target.checked);
                  if (!e.target.checked) {
                    setProcessosExtras([]);
                  }
                }}
                className="h-4 w-4 accent-sky-500"
              />
              Este projeto roda em mais de um processo?
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Marque se, além do processo principal, houver outros serviços
              (ex.: backend) para subir junto no PM2.
            </p>

            {temProcessosExtras && (
              <div className="mt-4 space-y-3">
                {processosExtras.map((processo, indice) => (
                  <div
                    key={indice}
                    className="rounded-lg border border-base-600 bg-base-700/50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Processo {indice + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerProcesso(indice)}
                        aria-label={`Remover processo ${indice + 1}`}
                        className="text-slate-400 transition hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="campo-label">Nome (processo PM2)</label>
                        <input
                          type="text"
                          required
                          value={processo.label}
                          onChange={(e) =>
                            atualizarProcesso(indice, "label", e.target.value)
                          }
                          placeholder="Ex.: sigpat-back"
                          className="campo-input"
                        />
                      </div>
                      <div>
                        <label className="campo-label">Porta</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={65535}
                          value={processo.port}
                          onChange={(e) =>
                            atualizarProcesso(indice, "port", e.target.value)
                          }
                          placeholder="Ex.: 3003"
                          className="campo-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="campo-label">
                          Caminho da pasta no servidor
                        </label>
                        <input
                          type="text"
                          required
                          value={processo.folderPath}
                          onChange={(e) =>
                            atualizarProcesso(
                              indice,
                              "folderPath",
                              e.target.value
                            )
                          }
                          placeholder="Ex.: /home/usuario/apps/sigpat-backend"
                          className="campo-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="campo-label">
                          Comando de execução
                        </label>
                        <input
                          type="text"
                          value={processo.script}
                          onChange={(e) =>
                            atualizarProcesso(indice, "script", e.target.value)
                          }
                          placeholder="Ex.: npm start"
                          className="campo-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={adicionarProcesso}
                  className="botao-secundario w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar processo
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => setAtivo(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
          Projeto ativo
        </label>
      </div>

      <div className="flex flex-col-reverse items-center gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={aoCancelar}
          className="botao-secundario w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="botao-primario w-full sm:w-auto"
        >
          {salvando
            ? "Salvando..."
            : projeto
              ? "Salvar alterações"
              : "Cadastrar projeto"}
        </button>
      </div>
    </form>
  );
}