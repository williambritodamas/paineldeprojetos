// Rotas de operações Git.
// POST /api/admin/git/:id/pull — executa git pull (admin).

import { Router } from "express";
import * as gitController from "../controllers/gitController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

// Todas as rotas de git requerem autenticação e papel admin.
router.use(authMiddleware);
router.use(adminMiddleware);

router.post("/:id/pull", gitController.gitPull);

export default router;
