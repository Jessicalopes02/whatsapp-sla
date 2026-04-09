import { Request, Response } from "express";
import { prisma } from "../repositories/prisma";

export class ProjectsController {
  list = async (_req: Request, res: Response) => {
    const projects = await prisma.project.findMany({
      include: {
        responsibleUser: true,
        sector: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(projects);
  };

  create = async (req: Request, res: Response) => {
    try {
      const {
        name,
        groupExternalId,
        groupName,
        responsibleUserId,
        slaMinutes,
        active,
        sectorId,
      } = req.body as {
        name?: string;
        groupExternalId?: string;
        groupName?: string;
        responsibleUserId?: string;
        slaMinutes?: number;
        active?: boolean;
        sectorId?: string | null;
      };

      if (
        !name ||
        !groupExternalId ||
        !groupName ||
        !responsibleUserId
      ) {
        return res.status(400).json({
          error: "name_groupExternalId_groupName_responsibleUserId_are_required",
        });
      }

      const responsibleUser = await prisma.user.findUnique({
        where: { id: responsibleUserId },
      });

      if (!responsibleUser) {
        return res.status(404).json({
          error: "responsible_user_not_found",
        });
      }

      const project = await prisma.project.create({
        data: {
          name,
          groupExternalId: String(groupExternalId),
          groupName,
          responsibleUserId,
          slaMinutes:
            typeof slaMinutes === "number"
              ? slaMinutes
              : responsibleUser.role === "sales_support"
              ? 120
              : 60,
          active: active ?? true,
          sectorId: sectorId ?? null,
        },
        include: {
          responsibleUser: true,
          sector: true,
        },
      });

      await prisma.pendingGroup.deleteMany({
        where: {
          groupExternalId: String(groupExternalId),
        },
      });

      return res.status(201).json(project);
    } catch (error: any) {
      console.error("Erro ao criar projeto", error);

      return res.status(500).json({
        error: "internal_create_project_error",
      });
    }
  };
}