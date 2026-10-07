import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { FeatureService } from "../src/modules/features/service.js";
import { FeatureNotFoundError, FeatureOptionNotFoundError } from "../src/modules/features/types.js";

const ownFeature = {
  id: "feature-a",
  name: "Payment Gateway",
  description: "Payment integration",
  category: "Payment",
  baseEstimatedHours: 0,
  isActive: true,
};

const featureDetail = { ...ownFeature, options: [] };

describe("feature routes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  function createTestApp(service: FeatureService, userId = "user-a", authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? {
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: userId, name: "User", email: "user@example.com" },
    } : null;
    app = buildApp(undefined, findSession, undefined, service);
    return app;
  }

  function sessionHeaders() {
    return { cookie: `${env.SESSION_COOKIE_NAME}=valid-session` };
  }

  function unusedMethods(overrides: Partial<FeatureService> = {}): FeatureService {
    return {
      listFeatures: async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
      getFeature: async () => featureDetail,
      createFeature: async () => ownFeature,
      createFeatureOption: async (_userId, featureId, input) => ({ id: "option-a", featureId, ...input }),
      updateFeatureOption: async (_userId, featureId, optionId, input) => ({ id: optionId, featureId, name: input.name ?? "OAuth", selectionType: input.selectionType ?? "SINGLE" }),
      updateFeature: async () => ownFeature,
      updateFeatureStatus: async () => ({ id: ownFeature.id, isActive: false }),
      ...overrides,
    };
  }

  it("lists the current user's features", async () => {
    const listFeatures = vi.fn(async (userId: string) => ({
      data: userId === "user-a" ? [ownFeature] : [],
      meta: { page: 1, pageSize: 20, total: userId === "user-a" ? 1 : 0, totalPages: userId === "user-a" ? 1 : 0 },
    }));
    const testApp = createTestApp(unusedMethods({ listFeatures }));

    const response = await testApp.inject({ method: "GET", url: "/api/features", headers: sessionHeaders() });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual([ownFeature]);
    expect(listFeatures).toHaveBeenCalledWith("user-a", {});
  });

  it("does not reveal a feature owned by another user", async () => {
    const getFeature = vi.fn(async (_userId: string, _id: string) => { throw new FeatureNotFoundError(); });
    const testApp = createTestApp(unusedMethods({ getFeature }));

    const response = await testApp.inject({ method: "GET", url: "/api/features/feature-b", headers: sessionHeaders() });

    expect(response.statusCode).toBe(404);
    expect(getFeature).toHaveBeenCalledWith("user-a", "feature-b");
  });

  it("returns an owned feature with its option hierarchy", async () => {
    const getFeature = vi.fn(async () => featureDetail);
    const testApp = createTestApp(unusedMethods({ getFeature }));

    const response = await testApp.inject({ method: "GET", url: "/api/features/feature-a", headers: sessionHeaders() });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: featureDetail });
    expect(getFeature).toHaveBeenCalledWith("user-a", "feature-a");
  });

  it("returns 401 for a request without a valid session", async () => {
    const listFeatures = vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }));
    const testApp = createTestApp(unusedMethods({ listFeatures }), "user-a", false);

    const response = await testApp.inject({ method: "GET", url: "/api/features" });

    expect(response.statusCode).toBe(401);
    expect(listFeatures).not.toHaveBeenCalled();
  });

  it("creates a feature with the session owner and rejects body ownership", async () => {
    const createFeature = vi.fn(async () => ownFeature);
    const testApp = createTestApp(unusedMethods({ createFeature }));

    const badResponse = await testApp.inject({
      method: "POST",
      url: "/api/features",
      headers: sessionHeaders(),
      payload: { name: "Payment Gateway", userId: "user-b" },
    });
    expect(badResponse.statusCode).toBe(400);
    expect(createFeature).not.toHaveBeenCalled();

    const response = await testApp.inject({
      method: "POST",
      url: "/api/features",
      headers: sessionHeaders(),
      payload: { name: "Payment Gateway" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBe("");
    expect(createFeature).toHaveBeenCalledWith("user-a", { name: "Payment Gateway" });
  });

  it("does not update another user's feature or status", async () => {
    const updateFeature = vi.fn(async () => { throw new FeatureNotFoundError(); });
    const updateFeatureStatus = vi.fn(async () => { throw new FeatureNotFoundError(); });
    const testApp = createTestApp(unusedMethods({ updateFeature, updateFeatureStatus }));

    const updateResponse = await testApp.inject({
      method: "PATCH",
      url: "/api/features/feature-b",
      headers: sessionHeaders(),
      payload: { name: "Changed by A" },
    });
    const statusResponse = await testApp.inject({
      method: "PATCH",
      url: "/api/features/feature-b/status",
      headers: sessionHeaders(),
      payload: { isActive: false },
    });

    expect(updateResponse.statusCode).toBe(404);
    expect(statusResponse.statusCode).toBe(404);
    expect(updateFeature).toHaveBeenCalledWith("user-a", "feature-b", { name: "Changed by A" });
    expect(updateFeatureStatus).toHaveBeenCalledWith("user-a", "feature-b", { isActive: false });
  });

  it("updates an owned feature and its active status", async () => {
    const updateFeature = vi.fn(async () => ({ ...ownFeature, name: "Updated Feature" }));
    const updateFeatureStatus = vi.fn(async () => ({ id: ownFeature.id, isActive: false }));
    const testApp = createTestApp(unusedMethods({ updateFeature, updateFeatureStatus }));

    const updateResponse = await testApp.inject({
      method: "PATCH",
      url: "/api/features/feature-a",
      headers: sessionHeaders(),
      payload: { name: "Updated Feature" },
    });
    const statusResponse = await testApp.inject({
      method: "PATCH",
      url: "/api/features/feature-a/status",
      headers: sessionHeaders(),
      payload: { isActive: false },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().data.name).toBe("Updated Feature");
    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json()).toEqual({ data: { id: "feature-a", isActive: false } });
  });

  it("creates and updates an option through its owned feature", async () => {
    const createFeatureOption = vi.fn(async (_userId: string, featureId: string, input: { name: string; selectionType: "SINGLE" | "MULTIPLE" }) => ({ id: "option-a", featureId, ...input }));
    const updateFeatureOption = vi.fn(async (_userId: string, featureId: string, optionId: string, input: { name?: string; selectionType?: "SINGLE" | "MULTIPLE" }) => ({ id: optionId, featureId, name: input.name ?? "OAuth", selectionType: input.selectionType ?? "SINGLE" }));
    const testApp = createTestApp(unusedMethods({ createFeatureOption, updateFeatureOption }));

    const created = await testApp.inject({
      method: "POST",
      url: "/api/features/feature-a/options",
      headers: sessionHeaders(),
      payload: { name: "OAuth", selectionType: "SINGLE", userId: "user-b" },
    });
    expect(created.statusCode).toBe(400);
    expect(createFeatureOption).not.toHaveBeenCalled();

    const createResponse = await testApp.inject({
      method: "POST",
      url: "/api/features/feature-a/options",
      headers: sessionHeaders(),
      payload: { name: "OAuth", selectionType: "SINGLE" },
    });
    const patchResponse = await testApp.inject({
      method: "PATCH",
      url: "/api/features/feature-a/options/option-a",
      headers: sessionHeaders(),
      payload: { selectionType: "MULTIPLE" },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().data.featureId).toBe("feature-a");
    expect(createFeatureOption).toHaveBeenCalledWith("user-a", "feature-a", { name: "OAuth", selectionType: "SINGLE" });
    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json().data.selectionType).toBe("MULTIPLE");
    expect(updateFeatureOption).toHaveBeenCalledWith("user-a", "feature-a", "option-a", { selectionType: "MULTIPLE" });
  });

  it("returns 404 for missing parent feature or option and 401 without session", async () => {
    const createFeatureOption = vi.fn(async () => { throw new FeatureNotFoundError(); });
    const updateFeatureOption = vi.fn(async () => { throw new FeatureOptionNotFoundError(); });
    const testApp = createTestApp(unusedMethods({ createFeatureOption, updateFeatureOption }));

    const createResponse = await testApp.inject({ method: "POST", url: "/api/features/foreign/options", headers: sessionHeaders(), payload: { name: "OAuth", selectionType: "SINGLE" } });
    const patchResponse = await testApp.inject({ method: "PATCH", url: "/api/features/feature-a/options/foreign", headers: sessionHeaders(), payload: { name: "OAuth" } });
    await testApp.close();
    const noSessionApp = createTestApp(unusedMethods(), "user-a", false);
    const unauthenticated = await noSessionApp.inject({ method: "POST", url: "/api/features/feature-a/options", payload: { name: "OAuth", selectionType: "SINGLE" } });

    expect(createResponse.statusCode).toBe(404);
    expect(patchResponse.statusCode).toBe(404);
    expect(unauthenticated.statusCode).toBe(401);
  });
});
