import { Request, Response } from "express";
import { prisma } from "../repositories/prisma";

export class SectorsController {
  list = async (_req: Request, res: Response) => {
    try {
      const sectors = await prisma.sector.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json(sectors);
    } catch (error) {
      console.error("Erro ao listar setores", error);

      return res.status(500).json({
        error: "internal_list_sectors_error",
      });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const {
        name,
        defaultSlaMinutes = 60,
        active = true,
      } = req.body as {
        name?: string;
        defaultSlaMinutes?: number;
        active?: boolean;
      };

      const normalizedName = name?.trim();
      const parsedSlaMinutes = Number(defaultSlaMinutes);

      if (!normalizedName) {
        return res.status(400).json({
          error: "sector_name_is_required",
        });
      }

      if (
        !Number.isInteger(parsedSlaMinutes) ||
        parsedSlaMinutes < 1
      ) {
        return res.status(400).json({
          error: "invalid_default_sla_minutes",
        });
      }

      const existingSector =
        await prisma.sector.findUnique({
          where: {
            name: normalizedName,
          },
        });

      if (existingSector) {
        return res.status(409).json({
          error: "sector_already_exists",
          sector: existingSector,
        });
      }

      const sector = await prisma.sector.create({
        data: {
          name: normalizedName,
          defaultSlaMinutes: parsedSlaMinutes,
          active,
        },
      });

      return res.status(201).json(sector);
    } catch (error) {
      console.error("Erro ao criar setor", error);

      return res.status(500).json({
        error: "internal_create_sector_error",
      });
    }
  };
}
