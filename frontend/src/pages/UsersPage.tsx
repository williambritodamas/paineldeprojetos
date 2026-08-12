// Página de gestão de usuários (somente admin).
// Permite cadastrar, editar e excluir usuários do painel.

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Pencil, Plus, Trash2, Users } from "lucide-react";
import Header from "../components/Header";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import ProjectModal from "../components/ProjectModal";
import { useAuth } from "../hooks/AuthContext";
import * as userService from "../services/userService";
import type { CriarUsuarioDTO, User } from "../types";

export default function UsersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<User | undefined>(
    undefined
  );
  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState<User | undefined>(undefined);
  const [removendo, setRemovendo] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const dados = await userService.getUsers();
      setUsuarios(dados);
    } catch {
      setErro("Erro ao carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const stats = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.role === "admin").length;
    return { total, admins, comuns: total - admins };
  }, [usuarios]);

  const abrirNovo = useCallback(() => {
    setUsuarioEditando(undefined);
    setModalAberto(true);
  }, []);

  const abrirEdicao = useCallback((usuario: User) => {
    setUsuarioEditando(usuario);
    setModalAberto(true);
  }, []);

  async function aoSalvar(dados: CriarUsuarioDTO) {
    setSalvando(true);

    try {
      if (usuarioEditando) {
        await userService.updateUser(usuarioEditando.id, dados);
      } else {
        await userService.createUser(dados);
      }
      setModalAberto(false);
      await carregarUsuarios();
    } catch (erroSalvar) {
      alert("Erro ao salvar o usuário. Verifique os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function aoConfirmarExclusao() {
    if (!excluindo) {
      return;
    }

    setRemovendo(true);

    try {
      await userService.deleteUser(excluindo.id);
      setExcluindo(undefined);
      await carregarUsuarios();
    } catch {
      alert("Erro ao excluir o usuário.");
    } finally {
      setRemovendo(false);
    }
  }

  function sair() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <Header
        titulo="Usuários do Painel"
        subtitulo={user ? `Olá, ${user.name}` : undefined}
        acoes={
          <>
            <button type="button" onClick={abrirNovo} className="botao-primario">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </button>
            <button type="button" onClick={sair} className="botao-secundario">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-padrao p-5 text-center">
            <p className="text-3xl font-semibold text-sky-400">{stats.total}</p>
            <p className="text-sm text-slate-400">Total de Usuários</p>
          </div>
          <div className="card-padrao p-5 text-center">
            <p className="text-3xl font-semibold text-emerald-400">{stats.admins}</p>
            <p className="text-sm text-slate-400">Administradores</p>
          </div>
          <div className="card-padrao p-5 text-center">
            <p className="text-3xl font-semibold text-slate-400">{stats.comuns}</p>
            <p className="text-sm text-slate-400">Usuários Comuns</p>
          </div>
        </section>

        {carregando ? (
          <Loading mensagem="Carregando usuários..." />
        ) : erro ? (
          <EmptyState mensagem={erro} />
        ) : usuarios.length === 0 ? (
          <EmptyState mensagem="Nenhum usuário cadastrado." />
        ) : (
          <section className="space-y-4">
            {usuarios.map((usuario) => (
              <article
                key={usuario.id}
                className="card-padrao flex items-center gap-5 p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-base-700 text-lg">
                  <Users className="h-5 w-5 text-sky-400" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {usuario.name}
                    </h3>
                    <span
                      className={
                        usuario.role === "admin"
                          ? "rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-400"
                          : "rounded-full bg-base-700 px-2.5 py-0.5 text-xs font-medium text-slate-400"
                      }
                    >
                      {usuario.role === "admin" ? "Administrador" : "Usuário"}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-400">
                    @{usuario.username}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(usuario)}
                    title="Editar usuário"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-sky-500/50 hover:text-sky-400"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcluindo(usuario)}
                    title="Excluir usuário"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-base-600 bg-base-700 text-slate-400 transition hover:border-red-500/50 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <ProjectModal
        aberto={modalAberto}
        titulo={usuarioEditando ? "Editar Usuário" : "Novo Usuário"}
        aoFechar={() => setModalAberto(false)}
      >
        <UserForm
          usuario={usuarioEditando}
          aoSalvar={aoSalvar}
          aoCancelar={() => setModalAberto(false)}
          salvando={salvando}
        />
      </ProjectModal>

      <ConfirmDialog
        aberto={Boolean(excluindo)}
        titulo="Excluir usuário"
        mensagem={`Deseja realmente excluir o usuário "${excluindo?.name}"? Esta ação não poderá ser desfeita.`}
        aoConfirmar={aoConfirmarExclusao}
        aoCancelar={() => setExcluindo(undefined)}
        carregando={removendo}
      />
    </div>
  );
}

// Formulário de cadastro/edição de usuário.
interface UserFormProps {
  usuario?: User;
  aoSalvar: (dados: CriarUsuarioDTO) => Promise<void>;
  aoCancelar: () => void;
  salvando: boolean;
}

function UserForm({
  usuario,
  aoSalvar,
  aoCancelar,
  salvando,
}: UserFormProps) {
  const [nome, setNome] = useState(usuario?.name ?? "");
  const [username, setUsername] = useState(usuario?.username ?? "");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"admin" | "user">(
    usuario?.role ?? "user"
  );

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();

    const dados: CriarUsuarioDTO = {
      name: nome.trim(),
      username: username.trim(),
      role: papel,
      password: senha,
    };

    await aoSalvar(dados);
  }

  return (
    <form onSubmit={aoEnviar} className="space-y-4">
      <div>
        <label htmlFor="nome" className="campo-label">
          Nome
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome completo"
          className="campo-input"
        />
      </div>

      <div>
        <label htmlFor="username" className="campo-label">
          Usuário
        </label>
        <input
          id="username"
          type="text"
          required
          minLength={3}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nome de usuário para login"
          className="campo-input"
        />
      </div>

      <div>
        <label htmlFor="senha" className="campo-label">
          {usuario ? "Nova senha (deixe vazio para manter)" : "Senha"}
        </label>
        <input
          id="senha"
          type="password"
          required={!usuario}
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Mínimo de 6 caracteres"
          className="campo-input"
        />
      </div>

      <div>
        <label htmlFor="papel" className="campo-label">
          Papel
        </label>
        <select
          id="papel"
          value={papel}
          onChange={(e) => setPapel(e.target.value as "admin" | "user")}
          className="campo-input"
        >
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      <div className="flex flex-col-reverse items-center gap-2 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={aoCancelar}
          className="botao-secundario w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando}
          className="botao-primario w-full sm:w-auto"
        >
          {salvando
            ? "Salvando..."
            : usuario
              ? "Salvar alterações"
              : "Cadastrar usuário"}
        </button>
      </div>
    </form>
  );
}