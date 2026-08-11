// Layout com rodapé comum para as páginas do painel.

import type { ReactNode } from "react";
import Footer from "../components/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-base-950">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}