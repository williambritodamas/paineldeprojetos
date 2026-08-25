// Página administrativa.
// Permite gerenciar projetos e consultar estatísticas gerais.

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Users } from "lucide-react";
import Header from "../components/Header";
import StatsCard from "../components/StatsCard";
import SearchBar from "../components/SearchBar";
import SortSelector from "../components/SortSelector";
import AdminProjectCard from "../components/AdminProjectCard";
import ProjectForm from "../components/ProjectForm";
import ProjectGrid from "../components/ProjectGrid";
import ProjectModal from "../components/ProjectModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../hooks/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useAdminProjects } from "../hooks/useAdminProjects";
import * as projectService from "../services/projectService";
import type { AmbienteProjeto, CriarProjetoDTO, Project, ProjectProcess } from "../types";

type StatusFiltro = "todos" | "ativos" | "inativos";

const opcoesAmbiente: Array<{ valor: AmbienteProjeto | ""; rotulo: string }> = [
  { valor: "", rotulo: "Todos ambientes" },
  { valor: "desenvolvimento", rotulo: "Desenvolvimento" },
  { valor: "homologacao", rotulo: "Homologação" },
  { valor: "producao", rotulo: "Produção" },
];

export default function AdminPage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const { categorias } = useCategories();
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

  // Ação PM2 em andamento (uma por vez), com o id do projeto afetado.
  const [acaoPm2, setAcaoPm2] = useState<{ id: number; tipo: string } | null>(
    null
  );

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

  async function executarAcaoPm2(
    projeto: Project,
    tipo: "enable" | "disable" | "iniciar" | "reiniciar" | "parar"
  ) {
    if (acaoPm2) {
      return;
    }

    setAcaoPm2({ id: projeto.id, tipo });

    try {
      switch (tipo) {
        case "enable":
          await projectService.habilitarAutostart(projeto.id);
          break;
        case "disable":
          await projectService.desabilitarAutostart(projeto.id);
          break;
        case "iniciar":
          await projectService.iniciarProcessoPm2(projeto.id);
          break;
        case "reiniciar":
          await projectService.reiniciarProcessoPm2(projeto.id);
          break;
        case "parar":
          await projectService.pararProcessoPm2(projeto.id);
          break;
      }
      await recarregar();
    } catch (erroAcao) {
      const detalhe = (
        erroAcao as {
          response?: { data?: { error?: string } };
        }
      )?.response?.data?.error;
      alert(detalhe || "Erro ao executar a ação no PM2.");
    } finally {
      setAcaoPm2(null);
    }
  }

  async function executarAcaoProcesso(
    projeto: Project,
    processo: ProjectProcess,
    tipo: "iniciar" | "reiniciar" | "parar"
  ) {
    if (acaoPm2) {
      return;
    }

    setAcaoPm2({ id: projeto.id, tipo });

    try {
      switch (tipo) {
        case "iniciar":
          await projectService.iniciarProcessoExtra(processo.id);
          break;
        case "reiniciar":
          await projectService.reiniciarProcessoExtra(processo.id);
          break;
        case "parar":
          await projectService.pararProcessoExtra(processo.id);
          break;
      }
      await recarregar();
    } catch (erroAcao) {
      const detalhe = (
        erroAcao as {
          response?: { data?: { error?: string } };
        }
      )?.response?.data?.error;
      alert(detalhe || "Erro ao executar a ação no PM2.");
    } finally {
      setAcaoPm2(null);
    }
  }

  const aoAlternarAutostart = (projeto: Project) =>
    executarAcaoPm2(projeto, projeto.autostart ? "disable" : "enable");
  const aoIniciar = (projeto: Project) => executarAcaoPm2(projeto, "iniciar");
  const aoReiniciar = (projeto: Project) =>
    executarAcaoPm2(projeto, "reiniciar");
  const aoParar = (projeto: Project) => executarAcaoPm2(projeto, "parar");
  const aoIniciarProcesso = (projeto: Project, processo: ProjectProcess) =>
    executarAcaoProcesso(projeto, processo, "iniciar");
  const aoReiniciarProcesso = (projeto: Project, processo: ProjectProcess) =>
    executarAcaoProcesso(projeto, processo, "reiniciar");
  const aoPararProcesso = (projeto: Project, processo: ProjectProcess) =>
    executarAcaoProcesso(projeto, processo, "parar");

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
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin/usuarios")}
                className="botao-secundario"
              >
                <Users className="h-4 w-4" />
                Usuários
              </button>
            )}
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

        {/* Ferramentas de busca, filtro e ordenação */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            valor={filtro.busca || ""}
            aoMudar={(busca) => setFiltro((atual) => ({ ...atual, busca }))}
          />

          <div className="flex flex-wrap items-center gap-2">
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

            <select
              value={filtro.environment || ""}
              onChange={(e) =>
                setFiltro((atual) => ({
                  ...atual,
                  environment: e.target.value
                    ? (e.target.value as AmbienteProjeto)
                    : undefined,
                }))
              }
              className="campo-input"
            >
              {opcoesAmbiente.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>

            <select
              value={filtro.categoryId || ""}
              onChange={(e) =>
                setFiltro((atual) => ({
                  ...atual,
                  categoryId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              className="campo-input"
            >
              <option value="">Todas categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <SortSelector
              valor={filtro.orderBy}
              aoMudar={(orderBy) =>
                setFiltro((atual) => ({ ...atual, orderBy }))
              }
            />
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
          <ProjectGrid>
            {projetos.map((projeto) => (
              <AdminProjectCard
                key={projeto.id}
                project={projeto}
                isAdmin={isAdmin}
                pm2Ocupado={acaoPm2?.id === projeto.id}
                aoEditar={abrirEdicao}
                aoExcluir={(p) => setExcluindo(p)}
                aoAlternar={aoAlternarStatus}
                aoAlternarAutostart={aoAlternarAutostart}
                aoIniciar={aoIniciar}
                aoReiniciar={aoReiniciar}
                aoParar={aoParar}
                aoIniciarProcesso={aoIniciarProcesso}
                aoReiniciarProcesso={aoReiniciarProcesso}
                aoPararProcesso={aoPararProcesso}
              />
            ))}
          </ProjectGrid>
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
          isAdmin={isAdmin}
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