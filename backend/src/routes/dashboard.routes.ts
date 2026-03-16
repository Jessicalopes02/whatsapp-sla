import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

export const dashboardRoutes = Router();
const controller = new DashboardController();

dashboardRoutes.get("/summary", controller.summary);
dashboardRoutes.get("/by-user", controller.byUser);
dashboardRoutes.get("/open-delays", controller.openDelays);
dashboardRoutes.get("/open-tickets", controller.openTickets);
dashboardRoutes.get("/history", controller.history);