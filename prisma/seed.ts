import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.crop.createMany({
    data: [
      {
        name: "Corn",
        location: "North field",
        status: "GROWING",
        plantedDate: new Date("2026-04-15"),
        harvestDate: new Date("2026-09-20"),
      },
      {
        name: "Soybeans",
        location: "South field",
        status: "PLANNED",
      },
    ],
  });

  await prisma.animal.createMany({
    data: [
      { name: "Bessie", species: "Cattle", breed: "Holstein", status: "ACTIVE" },
      { name: "Henrietta", species: "Chicken", breed: "Leghorn", status: "ACTIVE" },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Repair north fence",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Order soybean seed",
        priority: "MEDIUM",
      },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      { name: "Corn seed", category: "SEED", quantity: 40, unit: "bags", lowStockAt: 10 },
      { name: "Chicken feed", category: "FEED", quantity: 5, unit: "bags", lowStockAt: 10 },
    ],
  });
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
