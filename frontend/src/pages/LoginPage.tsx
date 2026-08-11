// Tela de login da área administrativa.

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Rocket } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!username.trim() || !senha) {
      setErro("Informe usuário e senha.");
      return;
    }

    setCarregando(true);

    try {
      await login({ username: username.trim(), password: senha });
      navigate("/admin", { replace: true });
    } catch (erroLogin) {
      setErro("Usuário ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-base-950">
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="card-padrao p-8">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                <Rocket className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Painel de Projetos
                </h1>
                <p className="text-sm text-slate-400">Área Administrativa</p>
              </div>
            </div>

            <form onSubmit={aoEnviar} className="space-y-4">
              <div>
                <label htmlFor="username" className="campo-label">
                  Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="campo-input"
                />
              </div>

              <div>
                <label htmlFor="senha" className="campo-label">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="campo-input"
                />
              </div>

              {erro && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="botao-primario w-full"
              >
                {carregando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>

          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o painel público
          </Link>
        </div>
      </main>
    </div>
  );
}