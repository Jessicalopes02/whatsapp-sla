import "dotenv/config";
import { prisma as localDb } from "../src/repositories/prisma";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function makeRenderClient(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

async function main() {
  const renderUrl = process.env.RENDER_DATABASE_URL;

  if (!renderUrl) {
    throw new Error("RENDER_DATABASE_URL não definida");
  }

  const renderDb = makeRenderClient(renderUrl);

  console.log("Lendo dados do banco local...");

  const sectors = await localDb.sector.findMany();
  const users = await localDb.user.findMany();
  const pendingGroups = await localDb.pendingGroup.findMany();
  const projects = await localDb.project.findMany();
  const messages = await localDb.message.findMany();
  const slaTickets = await localDb.slaTicket.findMany();
  const notifications = await localDb.notification.findMany();

  console.log({
    sectors: sectors.length,
    users: users.length,
    pendingGroups: pendingGroups.length,
    projects: projects.length,
    messages: messages.length,
    slaTickets: slaTickets.length,
    notifications: notifications.length,
  });

  console.log("Inserindo no banco do Render...");

  if (sectors.length) {
    await renderDb.sector.createMany({ data: sectors, skipDuplicates: true });
  }

  if (users.length) {
    await renderDb.user.createMany({ data: users, skipDuplicates: true });
  }

  if (pendingGroups.length) {
    await renderDb.pendingGroup.createMany({ data: pendingGroups, skipDuplicates: true });
  }

  if (projects.length) {
    await renderDb.project.createMany({ data: projects, skipDuplicates: true });
  }

  if (messages.length) {
    await renderDb.message.createMany({ data: messages, skipDuplicates: true });
  }

  if (slaTickets.length) {
    await renderDb.slaTicket.createMany({ data: slaTickets, skipDuplicates: true });
  }

  if (notifications.length) {
    await renderDb.notification.createMany({ data: notifications, skipDuplicates: true });
  }

  console.log("Migração concluída com sucesso.");

  await renderDb.$disconnect();
  await localDb.$disconnect();
}

main().catch((error) => {
  console.error("Erro na migração:");
  console.error(error);
  process.exit(1);
});