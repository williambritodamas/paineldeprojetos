// Rotas de operações Git.
// GET /api/admin/git/updates — verifica atualizações de todos os projetos.
// GET /api/admin/git/:id/updates — verifica atualizações de um projeto.
// POST /api/admin/git/:id/pull — executa git pull (admin).

// GET /api/admin/git/:id/commits — obtém últimos commits de um projeto.

import { Router } from "express";
import * as gitController from "../controllers/gitController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

// Todas as rotas de git requerem autenticação e papel admin.
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/updates", gitController.checkAllUpdates);
router.get("/:id/updates", gitController.checkUpdates);
router.post("/:id/pull", gitController.gitPull);
router.get("/:id/commits/all", gitController.getAllRemoteCommits);
router.get("/:id/commits", gitController.getRecentCommits);
router.post("/:id/checkout", gitController.checkoutCommit);

export default router;
