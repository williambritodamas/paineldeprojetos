// Semeadura inicial do banco de dados.
// Cria o usuário administrador e projetos de exemplo.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Usuário administrador vindo das variáveis de ambiente.
  const adminName = process.env.ADMIN_NAME || "Administrador";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "alterar_esta_senha";

  const senhaHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      name: adminName,
      password: senhaHash,
      role: "admin",
    },
    create: {
      name: adminName,
      username: adminUsername,
      password: senhaHash,
      role: "admin",
    },
  });

  console.log(
    `→ Usuário administrador "${admin.username}" garantido no banco.`
  );

  // Projetos de exemplo.
  const projetosExemplo = [
    {
      name: "Plataforma de Vídeos",
      description: "Sistema de vídeos escolares",
      icon: "🎬",
      port: 3002,
      active: true,
    },
    {
      name: "Sistema de Equipamentos",
      description: "Gestão de itens e equipamentos",
      icon: "📦",
      port: 3004,
      active: true,
    },
    {
      name: "Sistema de Oficina",
      description: "Controle de serviços da oficina",
      icon: "🔧",
      port: 3006,
      active: true,
    },
    {
      name: "Ponto de Alívio",
      description: "Sistema de acompanhamento",
      icon: "💧",
      port: 3008,
      active: false,
    },
  ];

  // Cria somente se ainda não existir nenhum projeto cadastrado.
  const totalExistentes = await prisma.project.count();

  if (totalExistentes === 0) {
    for (const projeto of projetosExemplo) {
      await prisma.project.create({
        data: projeto,
      });
    }
    console.log(`→ ${projetosExemplo.length} projetos de exemplo criados.`);
  } else {
    console.log(`→ ${totalExistentes} projetos já existentes. Seed de projetos ignorado.`);
  }
}

main()
  .catch((erro) => {
    console.error("Erro ao executar o seed:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });