import { prisma } from "../src/repositories/prisma";

async function main() {
  const sectors = [
    { name: "Comercial", defaultSlaMinutes: 60 },
    { name: "CS", defaultSlaMinutes: 60 },
    { name: "Sales Support", defaultSlaMinutes: 120 },
  ];

  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { name: sector.name },
      update: {
        defaultSlaMinutes: sector.defaultSlaMinutes,
        active: true,
      },
      create: {
        name: sector.name,
        defaultSlaMinutes: sector.defaultSlaMinutes,
        active: true,
      },
    });
  }

  console.log("Setores criados/atualizados com sucesso.");
}

main()
  .catch((error) => {
    console.error("Erro ao popular setores", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });