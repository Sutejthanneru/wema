import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

const app = createApp();

async function bootstrap() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`WEMA backend listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

