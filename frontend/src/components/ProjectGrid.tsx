// Grade/Lista responsiva de cards de projetos.

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  modo?: "grid" | "lista";
}

export default function ProjectGrid({
  children,
  modo = "grid",
}: Props) {
  return (
    <div
      className={
        modo === "lista"
          ? "flex flex-col gap-3"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {children}
    </div>
  );
}