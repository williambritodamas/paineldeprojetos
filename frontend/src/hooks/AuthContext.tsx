// Contexto de autenticação.
// Gerencia o estado do usuário logado e o token em toda a aplicação.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginDTO, User } from "../types";
import * as authService from "../services/authService";
import {
  obterToken,
  removerToken,
  salvarToken,
} from "../utils/authStorage";

interface AuthContexto {
  user: User | null;
  carregando: boolean;
  login: (dados: LoginDTO) => Promise<void>;
  logout: () => void;
  carregarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContexto | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Busca o usuário atual a partir do token salvo.
  const carregarUsuario = useCallback(async () => {
    if (!obterToken()) {
      setCarregando(false);
      return;
    }

    try {
      const usuario = await authService.obterUsuarioAtual();
      setUser(usuario);
    } catch {
      removerToken();
      setUser(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  const login = useCallback(async (dados: LoginDTO) => {
    const resultado = await authService.login(dados);
    salvarToken(resultado.token);
    setUser(resultado.user);
  }, []);

  const logout = useCallback(() => {
    removerToken();
    setUser(null);
  }, []);

  const valor = useMemo(
    () => ({ user, carregando, login, logout, carregarUsuario }),
    [user, carregando, login, logout, carregarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Hook para acessar o contexto de autenticação.
export function useAuth(): AuthContexto {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth deve ser utilizado dentro de um AuthProvider."
    );
  }

  return contexto;
}