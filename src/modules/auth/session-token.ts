import { createHmac } from "node:crypto";
import { env } from "../../config/env.js";

export function hashSessionToken(token: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
}
