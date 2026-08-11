// Barra de busca utilizada na área administrativa.

import { Search, X } from "lucide-react";

interface Props {
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  valor,
  aoMudar,
  placeholder = "Buscar projetos...",
}: Props) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="text"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        className="campo-input pl-9 pr-9"
      />
      {valor && (
        <button
          type="button"
          onClick={() => aoMudar("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}