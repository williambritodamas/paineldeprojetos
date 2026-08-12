// Protege rotas restritas ao administrador.
// Redireciona para /admin quando o usuário não é admin.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import Loading from "../components/Loading";

export default function AdminRoute() {
  const { isAdmin, carregando } = useAuth();

  if (carregando) {
    return <Loading mensagem="Verificando permissões..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}