import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { createAuthService } from "../src/modules/auth/auth.service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";

describe("POST /api/auth/logout", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("invalidates the session, clears the cookie, and rejects the old cookie", async () => {
    const token = "session-to-revoke";
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const sessions = new Map([[tokenHash, {
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
    }]]);
    const repository = {
      deleteSessionByTokenHash: async (hash: string) => { sessions.delete(hash); },
    } as unknown as AuthRepository;
    const lookup: SessionLookup = async (hash) => sessions.get(hash) ?? null;
    app = buildApp(createAuthService(repository), lookup);
    app.get("/test/protected", async (request, reply) => {
      if (!request.user) return reply.code(401).send({ error: "unauthenticated" });
      return { data: { user: request.user } };
    });

    const oldCookie = `${env.SESSION_COOKIE_NAME}=${token}`;
    const beforeLogout = await app.inject({ method: "GET", url: "/test/protected", headers: { cookie: oldCookie } });
    expect(beforeLogout.statusCode).toBe(200);

    const logout = await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie: oldCookie } });
    expect(logout.statusCode).toBe(204);
    expect(logout.headers["set-cookie"]).toContain(`${env.SESSION_COOKIE_NAME}=`);
    expect(logout.headers["set-cookie"]).toContain("HttpOnly");
    expect(sessions.has(tokenHash)).toBe(false);

    const afterLogout = await app.inject({ method: "GET", url: "/test/protected", headers: { cookie: oldCookie } });
    expect(afterLogout.statusCode).toBe(401);
    expect(afterLogout.json()).toEqual({ error: "unauthenticated" });

    const repeatedLogout = await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie: oldCookie } });
    expect(repeatedLogout.statusCode).toBe(204);
  });

  it("succeeds and clears the cookie when no session cookie is present", async () => {
    const repository = {
      deleteSessionByTokenHash: async () => { throw new Error("must not delete without a token"); },
    } as unknown as AuthRepository;
    const lookup: SessionLookup = async () => null;
    app = buildApp(createAuthService(repository), lookup);

    const response = await app.inject({ method: "POST", url: "/api/auth/logout" });
    expect(response.statusCode).toBe(204);
    expect(response.headers["set-cookie"]).toContain(`${env.SESSION_COOKIE_NAME}=`);
  });
});
