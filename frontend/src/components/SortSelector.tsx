// Seletor de ordenação de projetos.

import { ArrowUpDown } from "lucide-react";
import type { OrdenacaoProjeto } from "../types";

interface Props {
  valor: OrdenacaoProjeto | undefined;
  aoMudar: (valor: OrdenacaoProjeto | undefined) => void;
}

const opcoes: Array<{ valor: OrdenacaoProjeto; rotulo: string }> = [
  { valor: "name_asc", rotulo: "Nome (A-Z)" },
  { valor: "name_desc", rotulo: "Nome (Z-A)" },
  { valor: "port_asc", rotulo: "Porta (menor)" },
  { valor: "port_desc", rotulo: "Porta (maior)" },
  { valor: "createdAt_asc", rotulo: "Mais antigos" },
  { valor: "createdAt_desc", rotulo: "Mais recentes" },
  { valor: "updatedAt_asc", rotulo: "Atualizados (antigos)" },
  { valor: "updatedAt_desc", rotulo: "Atualizados (recentes)" },
];

export default function SortSelector({ valor, aoMudar }: Props) {
  return (
    <div className="relative">
      <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <select
        value={valor || ""}
        onChange={(e) =>
          aoMudar(e.target.value ? (e.target.value as OrdenacaoProjeto) : undefined)
        }
        className="campo-input appearance-none pl-9 pr-8"
      >
        <option value="">Ordenar por...</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
