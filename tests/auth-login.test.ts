import argon2 from "argon2";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { createAuthService } from "../src/modules/auth/auth.service.js";

describe("POST /api/auth/login", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  async function createTestApp() {
    const passwordHash = await argon2.hash("correct-password");
    const repository = {
      findUserByEmail: async (email: string) => email === "user@example.com"
        ? { id: "user-1", email: "user@example.com", name: "User", passwordHash }
        : null,
      createSession: async () => ({ id: "session-1" }),
      register: async () => ({ id: "user-1", email: "user@example.com", name: "User" }),
    } as unknown as AuthRepository;
    app = buildApp(createAuthService(repository));
    return app;
  }

  it("accepts valid credentials and sets an HTTP-only session cookie", async () => {
    const testApp = await createTestApp();
    const response = await testApp.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "user@example.com", password: "correct-password" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { user: { id: "user-1", email: "user@example.com" } } });
    expect(response.headers["set-cookie"]).toContain("HttpOnly");
  });

  it("returns the same 401 response for unknown email and wrong password", async () => {
    const testApp = await createTestApp();
    const responses = await Promise.all([
      testApp.inject({ method: "POST", url: "/api/auth/login", payload: { email: "missing@example.com", password: "anything" } }),
      testApp.inject({ method: "POST", url: "/api/auth/login", payload: { email: "user@example.com", password: "wrong-password" } }),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([401, 401]);
    expect(responses[0]?.json()).toEqual(responses[1]?.json());
    expect(responses[0]?.json()).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Email atau password salah" },
    });
  });
});
