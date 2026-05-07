import { Request, Response } from "express";
import { prisma } from "../repositories/prisma";

function getDefaultSlaMinutesByRole(role?: string) {
  if (role === "sales_support") return 120;
  if (role === "cs") return 60;
  if (role === "comercial") return 60;
  return 60;
}

export class ProjectsController {
  list = async (_req: Request, res: Response) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          responsibleUser: true,
          sector: true,
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      });

      return res.json(projects);
    } catch (error) {
      console.error("Erro ao listar projetos", error);

      return res.status(500).json({
        error: "internal_list_projects_error",
      });
    }
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
        responsibleUserId?: string | null;
        slaMinutes?: number;
        active?: boolean;
        sectorId?: string | null;
      };

      if (!name || !groupExternalId || !groupName) {
        return res.status(400).json({
          error: "name_groupExternalId_groupName_are_required",
        });
      }

      let responsibleUser = null;

      if (responsibleUserId) {
        responsibleUser = await prisma.user.findUnique({
          where: { id: responsibleUserId },
        });

        if (!responsibleUser) {
          return res.status(404).json({
            error: "responsible_user_not_found",
          });
        }
      }

      const project = await prisma.project.create({
        data: {
          name,
          groupExternalId: String(groupExternalId),
          groupName,
          responsibleUserId: responsibleUserId ?? null,
          sectorId: sectorId ?? null,
          slaMinutes:
            typeof slaMinutes === "number"
              ? slaMinutes
              : getDefaultSlaMinutesByRole(responsibleUser?.role),
          active: active ?? true,
        },
        include: {
          responsibleUser: true,
          sector: true,
        },
      });

      return res.status(201).json(project);
    } catch (error) {
      console.error("Erro ao criar projeto", error);

      return res.status(500).json({
        error: "internal_create_project_error",
      });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const projectId = String(req.params.id || "");

      if (!projectId) {
        return res.status(400).json({
          error: "project_id_is_required",
        });
      }

      const {
        name,
        groupName,
        responsibleUserId,
        sectorId,
        slaMinutes,
        active,
      } = req.body as {
        name?: string;
        groupName?: string;
        responsibleUserId?: string | null;
        sectorId?: string | null;
        slaMinutes?: number;
        active?: boolean;
      };

      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          responsibleUser: true,
          sector: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({
          error: "project_not_found",
        });
      }

      let responsibleUser = null;

      if (responsibleUserId) {
        responsibleUser = await prisma.user.findUnique({
          where: { id: responsibleUserId },
        });

        if (!responsibleUser) {
          return res.status(404).json({
            error: "responsible_user_not_found",
          });
        }
      }

      const nextSlaMinutes =
        typeof slaMinutes === "number"
          ? slaMinutes
          : responsibleUser
          ? getDefaultSlaMinutesByRole(responsibleUser.role)
          : existingProject.slaMinutes;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: name ?? existingProject.name,
          groupName: groupName ?? existingProject.groupName,
          responsibleUserId:
            responsibleUserId !== undefined
              ? responsibleUserId
              : existingProject.responsibleUserId,
          sectorId:
            sectorId !== undefined ? sectorId : existingProject.sectorId,
          slaMinutes: nextSlaMinutes,
          active: active ?? existingProject.active,
        },
        include: {
          responsibleUser: true,
          sector: true,
        },
      });

      return res.json(project);
    } catch (error) {
      console.error("Erro ao atualizar projeto", error);

      return res.status(500).json({
        error: "internal_update_project_error",
      });
    }
  };
}