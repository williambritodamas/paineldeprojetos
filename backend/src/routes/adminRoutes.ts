// Rotas administrativas.
// Os projetos exigem autenticação. A gestão de usuários exige admin.

import { Router } from "express";
import * as projectController from "../controllers/projectController";
import * as userController from "../controllers/userController";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Lista administrativa de projetos: qualquer usuário autenticado.
router.get("/projects", authMiddleware, projectController.listarAdministrativo);

// Gestão de usuários: somente administradores.
router.get("/users", authMiddleware, adminMiddleware, userController.listar);
router.post("/users", authMiddleware, adminMiddleware, userController.criar);
router.put("/users/:id", authMiddleware, adminMiddleware, userController.atualizar);
router.delete("/users/:id", authMiddleware, adminMiddleware, userController.excluir);

export default router;