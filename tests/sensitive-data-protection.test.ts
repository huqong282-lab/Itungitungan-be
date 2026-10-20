import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { AuthService } from "../src/modules/auth/auth.service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import { AuthError } from "../src/modules/auth/auth.types.js";

describe("sensitive data protection", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("keeps hashes and the session token out of auth response bodies", async () => {
    const sessionToken = "sensitive-session-token-sentinel";
    const passwordHash = "sensitive-password-hash-sentinel";
    const tokenHash = "sensitive-token-hash-sentinel";
    const password = "plaintext-password-sentinel";
    const sensitiveUser = {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      createdAt: new Date("2026-10-06T01:00:00.000Z"),
      updatedAt: new Date("2026-10-06T01:00:00.000Z"),
      passwordHash,
      tokenHash,
      sessionToken,
    };
    const authService: AuthService = {
      getCurrentUser: async () => sensitiveUser,
      register: async () => ({ user: sensitiveUser, sessionToken }),
      login: async () => ({ user: sensitiveUser, sessionToken }),
      logout: async () => {},
    };
    const sessionLookup: SessionLookup = async () => ({
      expiresAt: new Date(Date.now() + 60_000),
      user: sensitiveUser,
    });
    app = buildApp(authService, sessionLookup);

    const register = await app.inject({
      method: "POST", url: "/api/auth/register",
      payload: { name: "User", email: "user@example.com", password },
    });
    const login = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "user@example.com", password },
    });
    const me = await app.inject({
      method: "GET", url: "/api/auth/me",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=${sessionToken}` },
    });
    const logout = await app.inject({
      method: "POST", url: "/api/auth/logout",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=${sessionToken}` },
    });

    expect(register.statusCode).toBe(201);
    expect(register.json().data.user).toEqual({ id: "user-1", name: "User", email: "user@example.com" });
    expect(login.statusCode).toBe(200);
    expect(login.json().data.user).toEqual({ id: "user-1", email: "user@example.com" });
    expect(me.statusCode).toBe(200);
    expect(me.json().data).toEqual({
      id: "user-1", email: "user@example.com", name: "User",
      createdAt: "2026-10-06T01:00:00.000Z", updatedAt: "2026-10-06T01:00:00.000Z",
    });
    expect(logout.statusCode).toBe(204);
    for (const response of [register, login, me, logout]) {
      expectNoSensitiveResponseData(response.body, { sessionToken, passwordHash, tokenHash, password });
    }

    for (const response of [register, login]) {
      const cookie = response.headers["set-cookie"] as string;
      expect(cookie).toContain(`${env.SESSION_COOKIE_NAME}=${sessionToken}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Path=/");
      if (env.NODE_ENV === "production") expect(cookie).toContain("Secure");
    }
    expect(logout.headers["set-cookie"]).toContain("HttpOnly");
    expect(logout.headers["set-cookie"]).toContain("SameSite=Lax");
  });

  it("returns sanitized authentication errors without echoing submitted secrets", async () => {
    const sessionToken = "error-session-token-sentinel";
    const password = "error-password-sentinel";
    const authService: AuthService = {
      getCurrentUser: async () => null,
      register: async () => { throw new AuthError("EMAIL_ALREADY_EXISTS"); },
      login: async () => { throw new AuthError("INVALID_CREDENTIALS"); },
      logout: async () => {},
    };
    app = buildApp(authService);

    const register = await app.inject({
      method: "POST", url: "/api/auth/register",
      payload: { name: "User", email: "user@example.com", password },
    });
    const login = await app.inject({
      method: "POST", url: "/api/auth/login",
      payload: { email: "user@example.com", password },
    });
    expect(register.statusCode).toBe(409);
    expect(login.statusCode).toBe(401);
    expectNoSensitiveResponseData(register.body, { sessionToken, passwordHash: "passwordHash-sentinel", tokenHash: "tokenHash-sentinel", password });
    expectNoSensitiveResponseData(login.body, { sessionToken, passwordHash: "passwordHash-sentinel", tokenHash: "tokenHash-sentinel", password });
  });
});

function expectNoSensitiveResponseData(
  body: string,
  secrets: { sessionToken: string; passwordHash: string; tokenHash: string; password: string },
): void {
  expect(body).not.toContain("passwordHash");
  expect(body).not.toContain("tokenHash");
  for (const secret of Object.values(secrets)) expect(body).not.toContain(secret);
}
