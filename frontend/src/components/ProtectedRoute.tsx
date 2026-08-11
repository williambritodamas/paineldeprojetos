// Protege a rota administrativa.
// Redireciona para /login quando o usuário não está autenticado.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import Loading from "../components/Loading";

export default function ProtectedRoute() {
  const { user, carregando } = useAuth();

  // Enquanto valida o token, exibe o carregamento.
  if (carregando) {
    return <Loading mensagem="Verificando sessão..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}