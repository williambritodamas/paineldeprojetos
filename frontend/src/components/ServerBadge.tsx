// Badge que exibe o servidor do projeto.

import { Server as ServerIcon } from "lucide-react";
import type { Server } from "../types";

interface Props {
  server: Server | null | undefined;
}

export default function ServerBadge({ server }: Props) {
  if (!server) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-400">
      <ServerIcon className="h-3 w-3" />
      {server.name}
    </span>
  );
}
