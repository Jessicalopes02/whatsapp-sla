import { Router } from "express";
import { ProjectsController } from "../controllers/projects.controller";

export const projectsRoutes = Router();
const controller = new ProjectsController();

projectsRoutes.get("/", controller.list);
projectsRoutes.post("/", controller.create);
projectsRoutes.patch("/:id", controller.update);