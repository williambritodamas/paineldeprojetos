// Rotas administrativas de projetos.
// Somente usuários autenticados podem acessar.

import { Router } from "express";
import * as projectController from "../controllers/projectController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/projects",
  authMiddleware,
  projectController.listarAdministrativo
);

export default router;