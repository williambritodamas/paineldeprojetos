// Entrada do servidor Express.
// Organiza a aplicação e registra todas as rotas.

import express from "express";
import cors from "cors";
import { config } from "./config";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import adminRoutes from "./routes/adminRoutes";

const app = express();

// Permite acesso apenas do frontend configurado.
app.use(
  cors({
    origin: config.frontendUrl,
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