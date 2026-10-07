import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SettingsService } from "../src/modules/settings/service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";

const savedSettings = {
  developerRate: 75_000,
  workingHoursPerDay: 8,
  buffer: 20,
  margin: 30,
  rush: 10,
  freeRevisionCount: 2,
  additionalRevisionPrice: 150_000,
};

describe("settings routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  function createTestApp(service: SettingsService, sessionLookup: SessionLookup = async () => ({
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: "user-1", name: "Hanz", email: "hanz@example.com" },
  })) {
    app = buildApp(undefined, sessionLookup, service);
    return app;
  }

  it("gets the authenticated user's settings", async () => {
    const service: SettingsService = {
      getSettings: async (userId) => userId === "user-1" ? savedSettings : { ...savedSettings, developerRate: 1 },
      updateSettings: async () => savedSettings,
    };
    const testApp = createTestApp(service);

    const response = await testApp.inject({
      method: "GET",
      url: "/api/settings",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=session-token` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: savedSettings });
  });

  it("returns 401 when no session is present", async () => {
    const service: SettingsService = { getSettings: async () => savedSettings, updateSettings: async () => savedSettings };
    const testApp = createTestApp(service, async () => null);

    const response = await testApp.inject({ method: "GET", url: "/api/settings" });

    expect(response.statusCode).toBe(401);
  });

  it("does not allow an unauthenticated patch", async () => {
    let updateCalled = false;
    const service: SettingsService = {
      getSettings: async () => savedSettings,
      updateSettings: async () => { updateCalled = true; return savedSettings; },
    };
    const testApp = createTestApp(service, async () => null);

    const response = await testApp.inject({ method: "PATCH", url: "/api/settings", payload: { buffer: 25 } });

    expect(response.statusCode).toBe(401);
    expect(updateCalled).toBe(false);
  });

  it("patches settings for the session user and responds with the updated values", async () => {
    let requestedUserId: string | undefined;
    let requestedUpdate: Record<string, number> | undefined;
    const service: SettingsService = {
      getSettings: async () => savedSettings,
      updateSettings: async (userId, input) => {
        requestedUserId = userId;
        requestedUpdate = input;
        return { ...savedSettings, ...input };
      },
    };
    const testApp = createTestApp(service);

    const response = await testApp.inject({
      method: "PATCH",
      url: "/api/settings",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=session-token` },
      payload: { buffer: 25 },
    });

    expect(response.statusCode).toBe(200);
    expect(requestedUserId).toBe("user-1");
    expect(requestedUpdate).toEqual({ buffer: 25 });
    expect(response.json()).toEqual({ data: { ...savedSettings, buffer: 25 } });
  });

  it("rejects invalid patch values", async () => {
    const service: SettingsService = { getSettings: async () => savedSettings, updateSettings: async () => savedSettings };
    const testApp = createTestApp(service);

    const response = await testApp.inject({
      method: "PATCH",
      url: "/api/settings",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=session-token` },
      payload: { rush: 101 },
    });

    expect(response.statusCode).toBe(400);
  });
});
