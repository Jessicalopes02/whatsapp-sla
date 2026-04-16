import express from "express";
import cors from "cors";
import { usersRoutes } from "./routes/users.routes";
import { projectsRoutes } from "./routes/projects.routes";
import { messagesRoutes } from "./routes/messages.routes";
import { debugRoutes } from "./routes/debug.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { timelinesRoutes } from "./routes/timelines.routes";
import { slaTicketsRoutes } from "./routes/sla-tickets.routes";
import { sectorsRoutes } from "./routes/sectors.routes";

export const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://whatsapp-sla.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/debug/routes-test", (_req, res) => {
  res.json({ ok: true, route: "app-loaded" });
});

app.use("/users", usersRoutes);
app.use("/projects", projectsRoutes);
app.use("/messages", messagesRoutes);
app.use("/debug", debugRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/integrations/timelines", timelinesRoutes);
app.use("/sla-tickets", slaTicketsRoutes);
app.use("/sectors", sectorsRoutes);