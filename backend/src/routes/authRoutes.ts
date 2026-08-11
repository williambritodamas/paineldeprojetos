// Rotas de autenticação.

import { Router } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", authController.login);

router.get("/me", authMiddleware, authController.me);

export default router;