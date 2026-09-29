import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error(
      "Definí ADMIN_USERNAME y ADMIN_PASSWORD como variables de entorno antes de correr este script.\n" +
        'Ejemplo: ADMIN_USERNAME=admin ADMIN_PASSWORD="unaClaveSegura123!" npm run db:create-admin',
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    await prisma.user.update({
      where: { username },
      data: { passwordHash: hashPassword(password), role: "ADMIN", active: true },
    });
    console.log(`Contraseña actualizada para el usuario "${username}".`);
  } else {
    await prisma.user.create({
      data: { username, passwordHash: hashPassword(password), role: "ADMIN" },
    });
    console.log(`Usuario administrador "${username}" creado.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
