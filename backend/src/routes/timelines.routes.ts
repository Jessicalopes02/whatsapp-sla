import { Router } from "express";
import { TimelinesWebhookController } from "../integrations/timelines/timelines.webhook";

export const timelinesRoutes = Router();
const controller = new TimelinesWebhookController();

timelinesRoutes.post("/webhook", controller.receive);