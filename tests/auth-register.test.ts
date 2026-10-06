import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import type { AuthService } from "../src/modules/auth/auth.service.js";
import { AuthError } from "../src/modules/auth/auth.types.js";

describe("POST /api/auth/register", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the user and sets an HTTP-only session cookie", async () => {
    const service: AuthService = {
      register: async () => ({
        user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
        sessionToken: "opaque-session-token",
      }),
    };
    app = buildApp(service);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { name: "Hanz", email: "hanz@example.com", password: "strong-password" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      data: { user: { id: "user-1", name: "Hanz", email: "hanz@example.com" } },
    });
    expect(response.headers["set-cookie"]).toContain("HttpOnly");
    expect(response.headers["set-cookie"]).toContain("opaque-session-token");
  });

  it("rejects invalid email and weak password", async () => {
    app = buildApp({ register: async () => { throw new Error("should not be called"); } });

    for (const payload of [
      { name: "Hanz", email: "bad-email", password: "strong-password" },
      { name: "Hanz", email: "hanz@example.com", password: "short" },
    ]) {
      const response = await app.inject({ method: "POST", url: "/api/auth/register", payload });
      expect(response.statusCode).toBe(400);
    }
  });

  it("returns 409 when the email already exists", async () => {
    app = buildApp({ register: async () => { throw new AuthError("EMAIL_ALREADY_EXISTS"); } });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { name: "Hanz", email: "hanz@example.com", password: "strong-password" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});
