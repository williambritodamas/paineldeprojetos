import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configuração do Vite para o frontend do Painel de Projetos.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});