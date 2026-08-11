// Formulário de cadastro/edição de projeto.

import { useState, type FormEvent } from "react";
import type { CriarProjetoDTO, Project } from "../types";

interface Props {
  projeto?: Project;
  aoSalvar: (dados: CriarProjetoDTO) => Promise<void>;
  aoCancelar: () => void;
  salvando: boolean;
}

export default function ProjectForm({
  projeto,
  aoSalvar,
  aoCancelar,
  salvando,
}: Props) {
  const [nome, setNome] = useState(projeto?.name ?? "");
  const [descricao, setDescricao] = useState(projeto?.description ?? "");
  const [icone, setIcone] = useState(projeto?.icon ?? "");
  const [porta, setPorta] = useState(projeto?.port.toString() ?? "");
  const [ativo, setAtivo] = useState(projeto?.active ?? true);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();

    const portaNum = Number(porta);

    await aoSalvar({
      name: nome.trim(),
      description: descricao.trim(),
      icon: icone.trim(),
      port: portaNum,
      active: ativo,
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
            placeholder="Ex.: 3001"
            className="campo-input"
          />
        </div>
      </div>

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