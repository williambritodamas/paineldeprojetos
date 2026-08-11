// Rotas de projetos.
// As operações de escrita exigem autenticação.

import { Router } from "express";
import * as projectController from "../controllers/projectController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Público
router.get("/", projectController.listar);
router.get("/:id", projectController.obter);

// Administrativo (exige token)
router.post("/", authMiddleware, projectController.criar);
router.put("/:id", authMiddleware, projectController.atualizar);
router.delete("/:id", authMiddleware, projectController.excluir);

export default router;