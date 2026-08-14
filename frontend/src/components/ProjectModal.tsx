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
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-base-600 bg-base-800 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-base-700 px-6 py-4">
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
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}