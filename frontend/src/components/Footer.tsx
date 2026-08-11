// Rodapé institucional do painel.
// Exibe informações de autoria e gestão, facilmente configuráveis.

import { configRodape } from "../config";

export default function Footer() {
  return (
    <footer className="border-t border-base-700 bg-base-900 py-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center text-xs text-slate-500 sm:px-6">
        <span>
          Desenvolvido por: <strong className="font-medium text-slate-400">{configRodape.autor}</strong>
        </span>
        <span>
          Gestor do setor: <strong className="font-medium text-slate-400">{configRodape.gestor}</strong>
        </span>
      </div>
    </footer>
  );
}