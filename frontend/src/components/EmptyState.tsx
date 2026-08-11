// Estado vazio exibido quando não há projetos.

import { FolderOpen } from "lucide-react";

interface Props {
  mensagem?: string;
}

export default function EmptyState({
  mensagem = "Nenhum projeto encontrado.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-base-600 bg-base-800/40 py-16 text-slate-500">
      <FolderOpen className="h-10 w-10" />
      <span className="text-sm">{mensagem}</span>
    </div>
  );
}