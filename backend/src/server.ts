import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";
import { startCheckOverdueSlasJob } from "./jobs/checkOverdueSlas.job";

app.listen(env.port, () => {
  console.log(`API rodando na porta ${env.port}`);
  startCheckOverdueSlasJob();
});