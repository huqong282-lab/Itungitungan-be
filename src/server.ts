import { env } from "./config/env.js";

console.log({
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  corsOrigins: env.CORS_ORIGINS,
  sessionCookieName: env.SESSION_COOKIE_NAME,
});