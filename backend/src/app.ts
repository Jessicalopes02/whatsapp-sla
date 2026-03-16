import express from "express";
import cors from "cors";
import { usersRoutes } from "./routes/users.routes";
import { projectsRoutes } from "./routes/projects.routes";
import { messagesRoutes } from "./routes/messages.routes";
import { debugRoutes } from "./routes/debug.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { timelinesRoutes } from "./routes/timelines.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/users", usersRoutes);
app.use("/projects", projectsRoutes);
app.use("/messages", messagesRoutes);
app.use("/debug", debugRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/integrations/timelines", timelinesRoutes);