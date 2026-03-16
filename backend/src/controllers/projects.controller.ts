import { Request, Response } from "express";
import { ProjectsService } from "../services/projects.service";

const service = new ProjectsService();

export class ProjectsController {
  create = async (req: Request, res: Response) => {
    const project = await service.create(req.body);
    res.status(201).json(project);
  };

  list = async (_req: Request, res: Response) => {
    const projects = await service.list();
    res.json(projects);
  };
}