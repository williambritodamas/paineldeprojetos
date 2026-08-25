// Badge que exibe a categoria do projeto.

import type { Category } from "../types";

interface Props {
  category: Category | null | undefined;
}

export default function CategoryBadge({ category }: Props) {
  if (!category) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-400">
      {category.name}
    </span>
  );
}
