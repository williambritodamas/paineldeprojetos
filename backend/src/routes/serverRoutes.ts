// Rotas de servidores.
// Leitura é pública. Cadastro/edição/exclusão exigem admin.

import { Router } from "express";
import * as serverController from "../controllers/serverController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Leitura pública.
router.get("/", serverController.listar);
router.get("/:id", serverController.obter);

// CRUD administrativo.
router.post("/", authMiddleware, adminMiddleware, serverController.criar);
router.put("/:id", authMiddleware, adminMiddleware, serverController.atualizar);
router.delete("/:id", authMiddleware, adminMiddleware, serverController.excluir);

export default router;
