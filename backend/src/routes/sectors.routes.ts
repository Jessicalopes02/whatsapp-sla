import { Router } from "express";
import { SectorsController } from "../controllers/sectors.controller";

export const sectorsRoutes = Router();
const controller = new SectorsController();

sectorsRoutes.get("/", controller.list);