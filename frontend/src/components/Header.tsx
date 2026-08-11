// Cabeçalho do painel.
// Exibe o logo, o nome e, opcionalmente, ações configuradas.

import { LayoutGrid } from "lucide-react";

interface Props {
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
}

export default function Header({ titulo, subtitulo, acoes }: Props) {
  return (
    <header className="border-b border-base-700 bg-base-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-white">
              {titulo}
            </h1>
            {subtitulo && (
              <p className="text-xs text-slate-400">{subtitulo}</p>
            )}
          </div>
        </div>

        {acoes && <div className="flex items-center gap-3">{acoes}</div>}
      </div>
    </header>
  );
}