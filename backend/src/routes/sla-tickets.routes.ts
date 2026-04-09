import { Router } from "express";
import { SlaTicketsController } from "../controllers/sla-tickets.controller";

export const slaTicketsRoutes = Router();
const controller = new SlaTicketsController();

slaTicketsRoutes.patch("/:id/close", controller.close);