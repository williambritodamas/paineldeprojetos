// Janela modal reutilizável para formulários e confirmações.

import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  aberto: boolean;
  titulo: string;
  aoFechar: () => void;
  children: ReactNode;
}

export default function ProjectModal({
  aberto,
  titulo,
  aoFechar,
  children,
}: Props) {
  if (!aberto) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={aoFechar}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-base-600 bg-base-800 p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{titulo}</h2>
          <button
            type="button"
            onClick={aoFechar}
            className="text-slate-500 transition hover:text-slate-300"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}