// Card de estatística do painel administrativo.

interface Props {
  valor: number;
  rotulo: string;
  corValor: string;
}

export default function StatsCard({ valor, rotulo, corValor }: Props) {
  return (
    <div className="card-padrao flex flex-col items-center gap-1 p-6">
      <span className={`text-3xl font-bold ${corValor}`}>{valor}</span>
      <span className="text-sm text-slate-400">{rotulo}</span>
    </div>
  );
}