import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.watchProfile.upsert({
    where: { id: "default-watch-profile" },
    update: {},
    create: {
      id: "default-watch-profile",
      name: "Mikey - Gi Male Master 2 Black Light Feather",
      gi: true,
      gender: "Male",
      age: "Master 2",
      belt: "BLACK",
      weight: "Light Feather",
      exactDivision: "BLACK / Master 2 / Male / Light Feather",
      alertEmailEnabled: true,
      active: true
    }
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
