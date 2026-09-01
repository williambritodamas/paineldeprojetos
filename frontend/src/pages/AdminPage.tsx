// Página administrativa.
// Permite gerenciar projetos e consultar estatísticas gerais.

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Users, LayoutGrid, LayoutList } from "lucide-react";
import Header from "../components/Header";
import StatsCard from "../components/StatsCard";
import SearchBar from "../components/SearchBar";
import SortSelector from "../components/SortSelector";
import AdminProjectCard from "../components/AdminProjectCard";
import ProjectForm from "../components/ProjectForm";
import ProjectGrid from "../components/ProjectGrid";
import ProjectModal from "../components/ProjectModal";
import ConfirmDialog from "../components/ConfirmDialog";
import GitPullModal from "../components/GitPullModal";
import CommitsModal from "../components/CommitsModal";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../hooks/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useServers } from "../hooks/useServers";
import { useFavorites } from "../hooks/useFavorites";
import { usePortMonitor } from "../hooks/usePortMonitor";
import { useGitUpdates } from "../hooks/useGitUpdates";
import { useGitCommits } from "../hooks/useGitCommits";
import { useAdminProjects } from "../hooks/useAdminProjects";
import * as projectService from "../services/projectService";
import * as gitService from "../services/gitService";
import type { AmbienteProjeto, CriarProjetoDTO, Project, ProjectProcess } from "../types";

type StatusFiltro = "todos" | "ativos" | "inativos";

const opcoesAmbiente: Array<{ valor: AmbienteProjeto | ""; rotulo: string }> = [
  { valor: "", rotulo: "Todos ambientes" },
  { valor: "desenvolvimento", rotulo: "Desenvolvimento" },
  { valor: "homologacao", rotulo: "Homologação" },
  { valor: "producao", rotulo: "Produção" },
];

// Nome do processo da API do próprio painel no PM2. Deve corresponder ao
// rótulo do processo adicional cadastrado para o projeto "Painel de
// Projetos". Usado para confirmar ações de auto-gerência e aguardar o
// retorno da API após uma recriação feita pelo helper destacado.
const PROCESSO_PROPRIO = "painel-backend";

export default function AdminPage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const { categorias } = useCategories();
  const { servidores } = useServers();
  const { toggleFavorito, isFavorito } = useFavorites();
  const { getStatusProjeto } = usePortMonitor({ intervalMs: 30000 });
  const { getStatusProjeto: getStatusGitUpdates } = useGitUpdates({ intervalMs: 60000 });
  const { getCommitsProjeto } = useGitCommits({ intervalMs: 60000 });
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

  // Git pull modal.
  const [gitPullModalAberto, setGitPullModalAberto] = useState(false);
  const [gitPullProjeto, setGitPullProjeto] = useState<Project | undefined>(undefined);
  const [gitPullExecutando, setGitPullExecutando] = useState(false);
  const [gitPullResultado, setGitPullResultado] = useState<gitService.GitPullStep[] | null>(null);
  const [gitPullErro, setGitPullErro] = useState<string | null>(null);

  // Modo de visualização (grid ou lista).
  const [modoVisualizacao, setModoVisualizacao] = useState<"grid" | "lista">("grid");

  // Modal de commits.
  const [commitsModalAberto, setCommitsModalAberto] = useState(false);
  const [commitsModalProjetoId, setCommitsModalProjetoId] = useState<number | null>(null);
  const [commitsModalNome, setCommitsModalNome] = useState("");

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

  // Aguarda o próprio painel voltar ao ar após uma ação que recria a API
  // (helper destacado no servidor). Consulta em silêncio — sem acionar o
  // loading global — até o processo responder como online, ou esgota as
  // tentativas; então recarrega a listagem.
  async function aguardarRetornoPainel() {
    for (let tentativa = 0; tentativa < 15; tentativa += 1) {
      await new Promise((resolver) => setTimeout(resolver, 2000));
      try {
        const dados = await projectService.getAdminProjects(filtro);
        const alvo = dados
          .flatMap((projeto) => projeto.processes ?? [])
          .find((processo) => processo.pm2Name === PROCESSO_PROPRIO);
        if (alvo?.pm2Status === "online") {
          break;
        }
      } catch {
        // API ainda fora do ar; tenta novamente na próxima rodada.
      }
    }
    await recarregar();
  }

  async function executarAcaoPm2(
    projeto: Project,
    tipo: "enable" | "disable" | "iniciar" | "reiniciar" | "parar"
  ) {
    if (acaoPm2) {
      return;
    }

    setAcaoPm2({ id: projeto.id, tipo });

    let resposta: projectService.RespostaAcaoPm2 | undefined;

    try {
      switch (tipo) {
        case "enable":
          resposta = await projectService.habilitarAutostart(projeto.id);
          break;
        case "disable":
          resposta = await projectService.desabilitarAutostart(projeto.id);
          break;
        case "iniciar":
          resposta = await projectService.iniciarProcessoPm2(projeto.id);
          break;
        case "reiniciar":
          resposta = await projectService.reiniciarProcessoPm2(projeto.id);
          break;
        case "parar":
          resposta = undefined;
          await projectService.pararProcessoPm2(projeto.id);
          break;
      }

      if (resposta?.selfGerenciado) {
        alert(
          "O painel será reiniciado e ficará indisponível por alguns instantes. A listagem voltará sozinha quando a API responder."
        );
        await aguardarRetornoPainel();
      } else {
        await recarregar();
      }
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

    // Ações sobre o próprio backend do painel pedem confirmação explícita:
    // a API sai do ar por alguns segundos durante a recriação. ("parar" é
    // bloqueado pelo servidor.)
    if (
      (tipo === "reiniciar" || tipo === "iniciar") &&
      processo.pm2Name === PROCESSO_PROPRIO
    ) {
      const confirmado = window.confirm(
        tipo === "reiniciar"
          ? "Reiniciar o próprio painel? Ele ficará indisponível por alguns segundos e voltará automaticamente."
          : "Recriar o próprio painel com a configuração atual? Ele ficará indisponível por alguns segundos e voltará automaticamente."
      );
      if (!confirmado) {
        return;
      }
    }

    setAcaoPm2({ id: projeto.id, tipo });

    let resposta: projectService.RespostaAcaoPm2 | undefined;

    try {
      switch (tipo) {
        case "iniciar":
          resposta = await projectService.iniciarProcessoExtra(processo.id);
          break;
        case "reiniciar":
          resposta = await projectService.reiniciarProcessoExtra(processo.id);
          break;
        case "parar":
          resposta = undefined;
          await projectService.pararProcessoExtra(processo.id);
          break;
      }

      if (resposta?.selfGerenciado) {
        alert(
          "O painel será reiniciado e ficará indisponível por alguns instantes. A listagem voltará sozinha quando a API responder."
        );
        await aguardarRetornoPainel();
      } else {
        await recarregar();
      }
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
  const aoAlternarFavorito = (projeto: Project) => toggleFavorito(projeto.id);

  async function aoOcultar(projeto: Project) {
    try {
      await projectService.updateProject(projeto.id, { hidden: !projeto.hidden });
      await recarregar();
    } catch {
      alert("Erro ao alterar visibilidade do projeto.");
    }
  }

  function aoVerCommits(projeto: Project) {
    setCommitsModalProjetoId(projeto.id);
    setCommitsModalNome(projeto.name);
    setCommitsModalAberto(true);
  }

  function aoGitPull(projeto: Project) {
    setGitPullProjeto(projeto);
    setGitPullResultado(null);
    setGitPullErro(null);
    setGitPullModalAberto(true);
  }

  async function executarGitPull(opcoes: {
    pull: boolean;
    npmInstall: boolean;
    prismaMigrate: boolean;
    npmBuild: boolean;
  }) {
    if (!gitPullProjeto) return;

    setGitPullExecutando(true);
    setGitPullErro(null);
    try {
      const resultado = await gitService.gitPull(gitPullProjeto.id, opcoes);
      setGitPullResultado(resultado.steps);
      await recarregar();
    } catch (erroGit: any) {
      const detalhe =
        erroGit?.response?.data?.error ||
        "Erro ao executar comandos.";
      setGitPullErro(detalhe);
      if (erroGit?.response?.data?.steps) {
        setGitPullResultado(erroGit.response.data.steps);
      }
    } finally {
      setGitPullExecutando(false);
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
        <section className="space-y-3">
          <SearchBar
            valor={filtro.busca || ""}
            aoMudar={(busca) => setFiltro((atual) => ({ ...atual, busca }))}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                className="campo-input w-auto"
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
                className="campo-input w-auto"
              >
                <option value="">Todas categorias</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={filtro.serverId || ""}
                onChange={(e) =>
                  setFiltro((atual) => ({
                    ...atual,
                    serverId: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
                className="campo-input w-auto"
              >
                <option value="">Todos servidores</option>
                {servidores.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.name}
                  </option>
                ))}
              </select>

              <SortSelector
                valor={filtro.orderBy}
                aoMudar={(orderBy) =>
                  setFiltro((atual) => ({ ...atual, orderBy }))
                }
              />
              <div className="inline-flex rounded-lg border border-base-600 bg-base-700">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("grid")}
                  title="Visualização em grade"
                  className={
                    modoVisualizacao === "grid"
                      ? "inline-flex items-center gap-1 rounded-l-lg px-2 py-1.5 text-sm text-white transition"
                      : "inline-flex items-center gap-1 rounded-l-lg px-2 py-1.5 text-sm text-slate-400 transition hover:text-slate-300"
                  }
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("lista")}
                  title="Visualização em lista"
                  className={
                    modoVisualizacao === "lista"
                      ? "inline-flex items-center gap-1 rounded-r-lg px-2 py-1.5 text-sm text-white transition"
                      : "inline-flex items-center gap-1 rounded-r-lg px-2 py-1.5 text-sm text-slate-400 transition hover:text-slate-300"
                  }
                >
                  <LayoutList className="h-4 w-4" />
                </button>
              </div>
            </div>
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
          <ProjectGrid modo={modoVisualizacao}>
            {[...projetos].sort((a, b) => {
              const aFav = isFavorito(a.id);
              const bFav = isFavorito(b.id);
              if (aFav && !bFav) return -1;
              if (!aFav && bFav) return 1;
              return 0;
            }).map((projeto) => (
              <AdminProjectCard
                key={projeto.id}
                project={projeto}
                isAdmin={isAdmin}
                pm2Ocupado={acaoPm2?.id === projeto.id}
                favorito={isFavorito(projeto.id)}
                portStatus={getStatusProjeto(projeto.id)}
                gitPullExecutando={gitPullModalAberto && gitPullProjeto?.id === projeto.id && gitPullExecutando}
                 gitUpdates={getStatusGitUpdates(projeto.id)}
                 gitCommits={getCommitsProjeto(projeto.id)}
                 modo={modoVisualizacao}
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
                aoAlternarFavorito={aoAlternarFavorito}
                aoOcultar={aoOcultar}
                aoVerCommits={aoVerCommits}
                aoGitPull={aoGitPull}
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

      {/* Modal de Git Pull */}
      <GitPullModal
        aberto={gitPullModalAberto}
        nomeProjeto={gitPullProjeto?.name ?? ""}
        aoFechar={() => {
          setGitPullModalAberto(false);
          setGitPullProjeto(undefined);
          setGitPullResultado(null);
          setGitPullErro(null);
        }}
        aoConfirmar={executarGitPull}
        executando={gitPullExecutando}
        resultado={gitPullResultado}
        erroGeral={gitPullErro}
      />

      {/* Modal de Commits */}
      <CommitsModal
        aberto={commitsModalAberto}
        projectId={commitsModalProjetoId}
        nomeProjeto={commitsModalNome}
        aoFechar={() => {
          setCommitsModalAberto(false);
          setCommitsModalProjetoId(null);
          setCommitsModalNome("");
        }}
      />
    </div>
  );
}