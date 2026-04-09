import { Router } from "express";
import { TimelinesWebhookController } from "../integrations/timelines/timelines.webhook";

console.log("TIMELINES ROUTES TS CARREGADO");

export const timelinesRoutes = Router();
const controller = new TimelinesWebhookController();

timelinesRoutes.get("/ping", (_req, res) => {
  res.json({ ok: true, route: "timelines-routes-loaded" });
});

timelinesRoutes.post("/webhook", controller.receive);
timelinesRoutes.post("/test-send", controller.testSend);