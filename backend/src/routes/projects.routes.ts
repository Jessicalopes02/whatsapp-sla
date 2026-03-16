import { Router } from "express";
import { ProjectsController } from "../controllers/projects.controller";

export const projectsRoutes = Router();
const controller = new ProjectsController();

projectsRoutes.post("/", controller.create);
projectsRoutes.get("/", controller.list);
