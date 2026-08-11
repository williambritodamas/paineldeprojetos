// Configuração central do backend.
// Carrega as variáveis de ambiente e concentra as credenciais/serviços.

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "alterar_esta_chave_dev",
};

// Instância única do Prisma para toda a aplicação.
export const prisma = new PrismaClient();