// Página administrativa.
// Permite gerenciar projetos e consultar estatísticas gerais.

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import Header from "../components/Header";
import StatsCard from "../components/StatsCard";
import SearchBar from "../components/SearchBar";
import AdminProjectCard from "../components/AdminProjectCard";
import ProjectForm from "../components/ProjectForm";
import ProjectModal from "../components/ProjectModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../hooks/AuthContext";
import { useAdminProjects } from "../hooks/useAdminProjects";
import * as projectService from "../services/projectService";
import type { CriarProjetoDTO, Project } from "../types";

type StatusFiltro = "todos" | "ativos" | "inativos";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { projetos, carregando, erro, filtro, setFiltro, recarregar } =
    useAdminProjects();

  // Estado dos modais e formulário.
  const [modalAberto, setModalAberto] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState<Project | undefined>(
    undefined
  );
  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState<Project | undefined>(undefined);
  const [removendo, setRemovendo] = useState(false);

  // Estatísticas calculadas a partir dos projetos carregados.
  const stats = useMemo(() => {
    const total = projetos.length;
    const ativos = projetos.filter((p) => p.active).length;
    return {
      total,
      ativos,
      inativos: total - ativos,
    };
  }, [projetos]);

  const abrirNovo = useCallback(() => {
    setProjetoEditando(undefined);
    setModalAberto(true);
  }, []);

  const abrirEdicao = useCallback((projeto: Project) => {
    setProjetoEditando(projeto);
    setModalAberto(true);
  }, []);

  async function aoSalvar(dados: CriarProjetoDTO) {
    setSalvando(true);

    try {
      if (projetoEditando) {
        await projectService.updateProject(projetoEditando.id, dados);
      } else {
        await projectService.createProject(dados);
      }
      setModalAberto(false);
      await recarregar();
    } catch {
      // Erro tratado visualmente mantendo o formulário aberto.
      alert("Erro ao salvar o projeto. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function aoAlternarStatus(projeto: Project) {
    try {
      await projectService.updateProject(projeto.id, {
        active: !projeto.active,
      });
      await recarregar();
    } catch {
      alert("Erro ao alterar o status do projeto.");
    }
  }

  async function aoConfirmarExclusao() {
    if (!excluindo) {
      return;
    }

    setRemovendo(true);

    try {
      await projectService.deleteProject(excluindo.id);
      setExcluindo(undefined);
      await recarregar();
    } catch {
      alert("Erro ao excluir o projeto.");
    } finally {
      setRemovendo(false);
    }
  }

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  const opcoesFiltro: Array<{ valor: StatusFiltro; rotulo: string }> = [
    { valor: "todos", rotulo: "Todos" },
    { valor: "ativos", rotulo: "Ativos" },
    { valor: "inativos", rotulo: "Inativos" },
  ];

  return (
    <div>
      <Header
        titulo="Painel Administrativo"
        subtitulo={user ? `Olá, ${user.name}` : undefined}
        acoes={
          <>
            <button type="button" onClick={abrirNovo} className="botao-primario">
              <Plus className="h-4 w-4" />
              Novo Projeto
            </button>
            <button type="button" onClick={sair} className="botao-secundario">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Estatísticas */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard
            valor={stats.total}
            rotulo="Total de Projetos"
            corValor="text-sky-400"
          />
          <StatsCard
            valor={stats.ativos}
            rotulo="Projetos Ativos"
            corValor="text-emerald-400"
          />
          <StatsCard
            valor={stats.inativos}
            rotulo="Projetos Inativos"
            corValor="text-slate-400"
          />
        </section>

        {/* Ferramentas de busca e filtro */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            valor={filtro.busca || ""}
            aoMudar={(busca) => setFiltro((atual) => ({ ...atual, busca }))}
          />

          <div className="flex gap-2">
            {opcoesFiltro.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                onClick={() =>
                  setFiltro((atual) => ({ ...atual, status: opcao.valor }))
                }
                className={
                  filtro.status === opcao.valor
                    ? "inline-flex items-center rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white transition"
                    : "inline-flex items-center rounded-lg border border-base-600 bg-base-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-base-500"
                }
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </section>

        {/* Listagem dos projetos */}
        {carregando ? (
          <Loading mensagem="Carregando projetos..." />
        ) : erro ? (
          <EmptyState mensagem={erro} />
        ) : projetos.length === 0 ? (
          <EmptyState mensagem="Nenhum projeto encontrado." />
        ) : (
          <section className="space-y-4">
            {projetos.map((projeto) => (
              <AdminProjectCard
                key={projeto.id}
                project={projeto}
                aoEditar={abrirEdicao}
                aoExcluir={(p) => setExcluindo(p)}
                aoAlternar={aoAlternarStatus}
              />
            ))}
          </section>
        )}
      </main>

      {/* Modal de cadastro/edição */}
      <ProjectModal
        aberto={modalAberto}
        titulo={projetoEditando ? "Editar Projeto" : "Novo Projeto"}
        aoFechar={() => setModalAberto(false)}
      >
        <ProjectForm
          projeto={projetoEditando}
          aoSalvar={aoSalvar}
          aoCancelar={() => setModalAberto(false)}
          salvando={salvando}
        />
      </ProjectModal>

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        aberto={Boolean(excluindo)}
        titulo="Excluir projeto"
        mensagem={`Deseja realmente excluir o projeto "${excluindo?.name}"? Esta ação não poderá ser desfeita.`}
        aoConfirmar={aoConfirmarExclusao}
        aoCancelar={() => setExcluindo(undefined)}
        carregando={removendo}
      />
    </div>
  );
}