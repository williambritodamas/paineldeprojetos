// Badge que exibe o ambiente do projeto.

interface Props {
  environment: string | null | undefined;
}

const ambientes: Record<string, { label: string; classe: string }> = {
  desenvolvimento: {
    label: "Dev",
    classe: "bg-sky-500/15 text-sky-400",
  },
  homologacao: {
    label: "Homologação",
    classe: "bg-amber-500/15 text-amber-400",
  },
  producao: {
    label: "Produção",
    classe: "bg-emerald-500/15 text-emerald-400",
  },
};

export default function EnvironmentBadge({ environment }: Props) {
  if (!environment) {
    return null;
  }

  const info = ambientes[environment];

  if (!info) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${info.classe}`}
    >
      {info.label}
    </span>
  );
}
