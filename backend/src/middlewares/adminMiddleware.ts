// Middleware de permissão administrativa.
// Deve ser usado após o authMiddleware e exige usuário com papel "admin".

import type { NextFunction, Response } from "express";
import type { RequisicaoAutenticada } from "./authMiddleware";
import { erroHttp } from "../utils/helpers";

export function adminMiddleware(
  req: RequisicaoAutenticada,
  res: Response,
  next: NextFunction
): void {
  if (req.userRole !== "admin") {
    erroHttp(res, 403, "Acesso restrito ao administrador.");
    return;
  }

  next();
}