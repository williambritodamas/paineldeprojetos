// Rotas de health check de portas.
// GET /api/health/ports — verifica todas as portas ativas.
// GET /api/health/ports/:projectId — verifica a porta de um projeto.

import { Router } from "express";
import * as healthController from "../controllers/healthController";

const router = Router();

router.get("/ports", healthController.verificarTodas);
router.get("/ports/:projectId", healthController.verificarUma);

export default router;
