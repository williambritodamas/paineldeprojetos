// Rotas de categorias.
// Leitura é pública. Cadastro/edição/exclusão exigem admin.

import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Leitura pública.
router.get("/", categoryController.listar);
router.get("/:id", categoryController.obter);

// CRUD administrativo.
router.post("/", authMiddleware, adminMiddleware, categoryController.criar);
router.put("/:id", authMiddleware, adminMiddleware, categoryController.atualizar);
router.delete("/:id", authMiddleware, adminMiddleware, categoryController.excluir);

export default router;
