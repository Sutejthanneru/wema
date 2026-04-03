import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, "../../.env");
const fallbackEnvExamplePath = path.resolve(__dirname, "../../.env.example");

dotenv.config({
  path: fs.existsSync(rootEnvPath) ? rootEnvPath : fallbackEnvExamplePath
});

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  weatherSyncIntervalMinutes: Number(process.env.WEATHER_SYNC_INTERVAL_MINUTES || 15),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  fraudServiceUrl: process.env.FRAUD_SERVICE_URL || "http://localhost:8001",
  systemSharedSecret: process.env.SYSTEM_SHARED_SECRET || "system-secret"
};
