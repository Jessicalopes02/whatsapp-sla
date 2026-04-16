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
}