import { Router } from "express";
import { prisma } from "../repositories/prisma";

export const debugRoutes = Router();

debugRoutes.get("/sla", async (_req, res) => {
  const tickets = await prisma.slaTicket.findMany({
    include: {
      project: true,
      notifications: true,
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  res.json(tickets);
});

debugRoutes.get("/notifications", async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    include: {
      slaTicket: {
        include: {
          project: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  res.json(notifications);
});

debugRoutes.get("/notifications/failed", async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    where: {
      status: "failed",
    },
    include: {
      slaTicket: {
        include: {
          project: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  res.json(notifications);
});