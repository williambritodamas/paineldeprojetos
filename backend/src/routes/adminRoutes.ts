// Rotas administrativas.
// Os projetos exigem autenticação. A gestão de usuários exige admin.

import { Router } from "express";
import * as projectController from "../controllers/projectController";
import * as userController from "../controllers/userController";
import * as pm2Controller from "../controllers/pm2Controller";
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

// Operações PM2: somente administradores.
router.post("/pm2/:id/enable", authMiddleware, adminMiddleware, pm2Controller.habilitar);
router.post("/pm2/:id/disable", authMiddleware, adminMiddleware, pm2Controller.desabilitar);
router.post("/pm2/:id/iniciar", authMiddleware, adminMiddleware, pm2Controller.iniciar);
router.post("/pm2/:id/reiniciar", authMiddleware, adminMiddleware, pm2Controller.reiniciar);
router.post("/pm2/:id/parar", authMiddleware, adminMiddleware, pm2Controller.parar);

// Operações PM2 sobre processos adicionais: somente administradores.
router.post(
  "/pm2/processos/:processId/iniciar",
  authMiddleware,
  adminMiddleware,
  pm2Controller.iniciarProcessoExtra
);
router.post(
  "/pm2/processos/:processId/reiniciar",
  authMiddleware,
  adminMiddleware,
  pm2Controller.reiniciarProcessoExtra
);
router.post(
  "/pm2/processos/:processId/parar",
  authMiddleware,
  adminMiddleware,
  pm2Controller.pararProcessoExtra
);

export default router;