// Grade responsiva de cards de projetos.

import type { ReactNode } from "react";

export default function ProjectGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}