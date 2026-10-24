import "dotenv/config";

type EnvironmentInput = Record<string, string | undefined>;

export function parseEnvironment(source: EnvironmentInput) {
  const nodeEnv = source.NODE_ENV ?? "development";
  if (nodeEnv !== "development" && nodeEnv !== "production" && nodeEnv !== "test") {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const rawPort = source.PORT ?? "3000";
  if (!/^\d+$/.test(rawPort)) throw new Error("PORT must be an integer from 1 to 65535");
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  const databaseUrl = source.DATABASE_URL ?? "";
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  let database: URL;
  try {
    database = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }
  if (database.protocol !== "postgresql:" && database.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the PostgreSQL protocol");
  }

  const sessionSecret = source.SESSION_SECRET ?? (nodeEnv === "production" ? "" : "development-only-session-secret-change-before-production");
  if (sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  if (nodeEnv === "production" && /replace|placeholder|change[_ -]?me/i.test(sessionSecret)) {
    throw new Error("SESSION_SECRET must be a generated secret, not a placeholder");
  }

  const rawOrigins = source.CORS_ORIGINS ?? (nodeEnv === "production" ? "" : "http://localhost:5173");
  const corsOrigins = rawOrigins.split(",").map((value) => value.trim());
  if (corsOrigins.some((origin) => !origin)) throw new Error("CORS_ORIGINS must contain comma-separated origins without empty entries");
  for (const origin of corsOrigins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGINS entries must be valid HTTP or HTTPS origins");
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.origin !== origin) {
      throw new Error("CORS_ORIGINS entries must be valid HTTP or HTTPS origins without paths");
    }
  }
  if (nodeEnv === "production" && corsOrigins.some((origin) => origin === "*" || origin.startsWith("http://localhost"))) {
    throw new Error("Production CORS_ORIGINS must not include wildcard or localhost origins");
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    SESSION_SECRET: sessionSecret,
    CORS_ORIGINS: corsOrigins,
    SESSION_COOKIE_NAME: source.SESSION_COOKIE_NAME ?? "itungitungan_session",
  } as const;
}

export const env = parseEnvironment(process.env);
