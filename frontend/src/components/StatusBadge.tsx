// Selo de status do projeto.
// Nesta versão exibe Ativo ou Inativo com base no campo `active`.
// Preparado para futuramente exibir ON-linha/verificando/off-line.

interface Props {
  active: boolean;
}

export default function StatusBadge({ active }: Props) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Ativo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-medium text-slate-400">
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      Inativo
    </span>
  );
}