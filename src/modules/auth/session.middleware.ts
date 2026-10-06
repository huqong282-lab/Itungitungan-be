import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.js";
import type { AuthenticatedUser } from "./auth.types.js";

export type SessionLookup = (tokenHash: string) => Promise<{
  expiresAt: Date;
  user: AuthenticatedUser;
} | null>;

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }
}

/** Public-safe preHandler: invalid or missing credentials leave request.user null. */
export function createSessionMiddleware(findSessionByTokenHash: SessionLookup) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    request.user = null;
    const token = request.cookies[env.SESSION_COOKIE_NAME];
    if (!token) return;

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await findSessionByTokenHash(tokenHash);
    if (!session || session.expiresAt.getTime() <= Date.now()) return;

    request.user = session.user;
  };
}
