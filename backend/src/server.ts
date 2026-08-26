// Entrada do servidor Express.
// Organiza a aplicação e registra todas as rotas.

import express from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import serverRoutes from "./routes/serverRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import healthRoutes from "./routes/healthRoutes";
import gitRoutes from "./routes/gitRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// Configuração do CORS.
// Permite o acesso do frontend por localhost, IP ou hostname,
// desde que a requisição venha da porta do frontend configurada.
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origem (curl, testes, etc.).
      if (!origin) {
        callback(null, true);
        return;
      }

      try {
        const origem = new URL(origin);
        const portaFrontend = new URL(config.frontendUrl).port || "80";

        // Aceita qualquer hostname (localhost, IP, nome do servidor),
        // desde que esteja na mesma porta do frontend.
        if (origem.port === portaFrontend) {
          callback(null, true);
          return;
        }

        // Porta diferente da do frontend: nega via ausência do cabeçalho CORS.
        callback(null, false);
      } catch {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Rota de verificação de saúde da API.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/admin/git", gitRoutes);
app.use("/api/admin", adminRoutes);

// Tratamento de rotas inexistentes.
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// Tratamento genérico de erros.
app.use(
  (
    erro: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Erro interno:", erro.message);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
);

app.listen(config.port, () => {
  console.log(`→ API do Painel de Projetos rodando na porta ${config.port}`);
});