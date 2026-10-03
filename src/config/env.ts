import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const port = Number(getRequiredEnv("PORT"));

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a valid positive integer");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: port,
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  CORS_ORIGINS: getRequiredEnv("CORS_ORIGINS"),
  SESSION_COOKIE_NAME: getRequiredEnv("SESSION_COOKIE_NAME"),
} as const;