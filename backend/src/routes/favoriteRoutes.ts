// Rotas de favoritos.
// GET /api/favorites — retorna IDs favoritos do usuário.
// POST /api/favorites/:projectId — alterna favorito.

import { Router } from "express";
import * as favoriteController from "../controllers/favoriteController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Todas as rotas de favoritos requerem autenticação.
router.use(authMiddleware);

router.get("/", favoriteController.listarFavoritos);
router.post("/:projectId", favoriteController.toggleFavorito);

export default router;
