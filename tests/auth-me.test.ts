import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { AuthService } from "../src/modules/auth/auth.service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";

describe("GET /api/auth/me", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the authenticated user without sensitive fields", async () => {
    const createdAt = new Date("2026-10-06T01:00:00.000Z");
    const updatedAt = new Date("2026-10-06T01:00:00.000Z");
    let requestedUserId: string | undefined;
    const service: AuthService = {
      getCurrentUser: async (userId) => {
        requestedUserId = userId;
        return { id: userId, email: "user@example.com", name: "Hanz", createdAt, updatedAt };
      },
      register: async () => { throw new Error("unused"); },
      login: async () => { throw new Error("unused"); },
      logout: async () => {},
    };
    const findSession: SessionLookup = async () => ({
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: "user-1", name: "Hanz", email: "user@example.com" },
    });
    app = buildApp(service, findSession);

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=valid-token` },
    });

    expect(response.statusCode).toBe(200);
    expect(requestedUserId).toBe("user-1");
    expect(response.json()).toEqual({
      data: {
        id: "user-1",
        email: "user@example.com",
        name: "Hanz",
        createdAt: "2026-10-06T01:00:00.000Z",
        updatedAt: "2026-10-06T01:00:00.000Z",
      },
    });
    expect(response.body).not.toContain("passwordHash");
    expect(response.body).not.toContain("tokenHash");
  });

  it("returns 401 when the request has no authenticated session", async () => {
    const service: AuthService = {
      getCurrentUser: async () => null,
      register: async () => { throw new Error("unused"); },
      login: async () => { throw new Error("unused"); },
      logout: async () => {},
    };
    app = buildApp(service, async () => null);

    const response = await app.inject({ method: "GET", url: "/api/auth/me" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
  });
});
