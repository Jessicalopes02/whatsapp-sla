import { Router } from "express";
import { prisma } from "../repositories/prisma";

export const debugRoutes = Router();

debugRoutes.get("/sla", async (_req, res) => {
  const tickets = await prisma.slaTicket.findMany({
    include: {
      project: true,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  res.json(tickets);
});

debugRoutes.get("/notifications", async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(notifications);
});