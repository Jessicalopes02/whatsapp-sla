import { Router } from "express";
import { MessagesController } from "../controllers/messages.controller";

export const messagesRoutes = Router();
const controller = new MessagesController();

messagesRoutes.post("/ingest", controller.ingest);