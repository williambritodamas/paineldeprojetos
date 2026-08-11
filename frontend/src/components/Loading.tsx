// Indicador visual de carregamento.

import { Loader2 } from "lucide-react";

interface Props {
  mensagem?: string;
}

export default function Loading({
  mensagem = "Carregando...",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      <span className="text-sm">{mensagem}</span>
    </div>
  );
}