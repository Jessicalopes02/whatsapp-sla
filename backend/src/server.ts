import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";
import { startCheckOverdueSlasJob } from "./jobs/checkOverdueSlas.job";

console.log("PORT:", env.port);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("RENDER DATABASE_URL:", process.env.DATABASE_URL);
console.log("RENDER FRONTEND_URL:", process.env.FRONTEND_URL);

app.listen(env.port, () => {
  console.log(`API rodando na porta ${env.port}`);
  startCheckOverdueSlasJob();
});