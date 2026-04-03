import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { startAutomaticWeatherMonitor } from "./services/eventDetectionService.js";
import { normalizeUserNotificationChannels } from "./utils/migrations.js";

const app = createApp();
let weatherMonitor;

async function bootstrap() {
  await connectDatabase();
  await normalizeUserNotificationChannels();
  app.listen(env.port, () => {
    console.log(`WEMA backend listening on port ${env.port}`);
  });
  weatherMonitor = startAutomaticWeatherMonitor();
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  if (weatherMonitor) {
    clearInterval(weatherMonitor);
  }
  process.exit(1);
});
