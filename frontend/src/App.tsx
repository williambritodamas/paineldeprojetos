// Roteamento principal da aplicação.

import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/AuthContext";
import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import UsersPage from "./pages/UsersPage";

// Componente interno que carrega a sessão ao iniciar o painel.
function InicializarSessao() {
  const { carregarUsuario } = useAuth();

  useEffect(() => {
    carregarUsuario();
  }, [carregarUsuario]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <InicializarSessao />
      <Router>
        <RootLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin/usuarios" element={<UsersPage />} />
            </Route>
          </Routes>
        </RootLayout>
      </Router>
    </AuthProvider>
  );
}