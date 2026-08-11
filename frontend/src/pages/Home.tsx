// Tela pública principal.
// Vitrine/launchpad com os projetos ativos, sem controles administrativos.

import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Header from "../components/Header";
import ProjectGrid from "../components/ProjectGrid";
import ProjectCard from "../components/ProjectCard";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { usePublicProjects } from "../hooks/usePublicProjects";

export default function Home() {
  const { projetos, carregando, erro } = usePublicProjects();

  return (
    <div>
      <Header
        titulo="Painel de Projetos"
        subtitulo="Acesso rápido aos sistemas e aplicações"
        acoes={
          <Link
            to="/login"
            className="botao-secundario text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Área Administrativa
          </Link>
        }
      />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {carregando ? (
          <Loading mensagem="Carregando projetos..." />
        ) : erro ? (
          <EmptyState mensagem={erro} />
        ) : projetos.length === 0 ? (
          <EmptyState mensagem="Nenhum projeto disponível no momento." />
        ) : (
          <ProjectGrid>
            {projetos.map((projeto) => (
              <ProjectCard key={projeto.id} project={projeto} />
            ))}
          </ProjectGrid>
        )}
      </main>
    </div>
  );
}