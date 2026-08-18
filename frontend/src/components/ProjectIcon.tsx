// Renderiza o ícone de um projeto.
// Aceita o nome de um ícone lucide ou um valor legado (ex.: emoji).

import { mapaIcones, NOME_ICONE_PADRAO } from "../constants/projectIcons";

interface Props {
  icon?: string | null;
  className?: string;
}

export default function ProjectIcon({ icon, className }: Props) {
  const nome = icon?.trim() ? icon.trim() : NOME_ICONE_PADRAO;
  const Componente = mapaIcones[nome];

  if (Componente) {
    return <Componente className={className} />;
  }

  return <span className={className}>{nome}</span>;
}