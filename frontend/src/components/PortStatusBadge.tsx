// Badge que exibe o status de uma porta do projeto.

import { Circle, Clock } from "lucide-react";
import type { StatusPorta } from "../services/healthService";

interface Props {
  status: StatusPorta | undefined;
}

export default function PortStatusBadge({ status }: Props) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-medium text-slate-400">
        <Circle className="h-2 w-2" />
        Verificando...
      </span>
    );
  }

  if (status.aberta) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <Circle className="h-2 w-2" fill="currentColor" />
        Porta {status.port} aberta
        {status.latenciaMs !== null && (
          <span className="flex items-center gap-0.5 text-emerald-500">
            <Clock className="h-2.5 w-2.5" />
            {status.latenciaMs}ms
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400">
      <Circle className="h-2 w-2" fill="currentColor" />
      Porta {status.port} fechada
    </span>
  );
}
