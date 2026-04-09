import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

const service = new DashboardService();

function getFilters(req: Request) {
  return {
    period:
      typeof req.query.period === "string" ? req.query.period : undefined,
    userId:
      typeof req.query.userId === "string" ? req.query.userId : undefined,
    sectorId:
      typeof req.query.sectorId === "string" ? req.query.sectorId : undefined,
    status:
      typeof req.query.status === "string" ? req.query.status : undefined,
  };
}

export class DashboardController {
  summary = async (req: Request, res: Response) => {
    const result = await service.summary(getFilters(req));
    res.json(result);
  };

  byUser = async (req: Request, res: Response) => {
    const result = await service.byUser(getFilters(req));
    res.json(result);
  };

  openDelays = async (req: Request, res: Response) => {
    const result = await service.openDelays(getFilters(req));
    res.json(result);
  };

  openTickets = async (req: Request, res: Response) => {
    const result = await service.openTickets(getFilters(req));
    res.json(result);
  };

  history = async (req: Request, res: Response) => {
    const result = await service.history(getFilters(req));
    res.json(result);
  };
}