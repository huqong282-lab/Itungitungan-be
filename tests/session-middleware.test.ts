import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { AuthService } from "../src/modules/auth/auth.service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";

describe("session middleware", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  function createTestApp(findSessionByTokenHash: SessionLookup) {
    const unusedAuthService: AuthService = {
      register: async () => { throw new Error("unused"); },
      login: async () => { throw new Error("unused"); },
      logout: async () => {},
    };
    app = buildApp(unusedAuthService, findSessionByTokenHash);
    app.get("/test/session", async (request) => ({ user: request.user }));
    return app;
  }

  it("attaches the user for a valid session", async () => {
    const token = "valid-session-token";
    let foundHash: string | undefined;
    const testApp = createTestApp(async (tokenHash) => {
      foundHash = tokenHash;
      return {
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
      };
    });

    const response = await testApp.inject({
      method: "GET",
      url: "/test/session",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=${token}` },
    });

    expect(foundHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(response.json()).toEqual({
      user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
    });
  });

  it("leaves the user unset when the cookie is missing", async () => {
    const testApp = createTestApp(async () => {
      throw new Error("lookup must not run without a cookie");
    });
    const response = await testApp.inject({ method: "GET", url: "/test/session" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: null });
  });

  it("leaves the user unset when the token is unknown", async () => {
    const testApp = createTestApp(async () => null);
    const response = await testApp.inject({
      method: "GET",
      url: "/test/session",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=unknown-token` },
    });

    expect(response.json()).toEqual({ user: null });
  });

  it("leaves the user unset when the session has expired", async () => {
    const testApp = createTestApp(async () => ({
      expiresAt: new Date(Date.now() - 1),
      user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
    }));
    const response = await testApp.inject({
      method: "GET",
      url: "/test/session",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=expired-token` },
    });

    expect(response.json()).toEqual({ user: null });
  });
});
