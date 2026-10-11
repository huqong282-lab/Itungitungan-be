import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { ProjectFeatureService } from "../src/modules/project-features/service.js";
import { ProjectFeatureConflictError, ProjectFeatureNotFoundError, ProjectFeatureRuleError } from "../src/modules/project-features/types.js";

const projectFeature = { id: "pf-a", projectId: "p-a", featureId: "f-a", overrideHours: null, notes: null, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") };
describe("project feature routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(overrides: Partial<ProjectFeatureService> = {}, authenticated = true) {
    const sessionLookup: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    const service: ProjectFeatureService = {
      addFeature: async () => projectFeature,
      updateFeature: async () => projectFeature,
      removeFeature: async () => undefined,
      replaceSelections: async () => [],
      ...overrides,
    };
    app = buildApp(undefined, sessionLookup, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("adds a feature for the authenticated project user", async () => {
    const addFeature = vi.fn(async () => projectFeature);
    const response = await createTestApp({ addFeature }).inject({ method: "POST", url: "/api/projects/p-a/features", headers: headers(), payload: { featureId: "f-a" } });
    expect(response.statusCode).toBe(201);
    expect(response.body).toBe("");
    expect(addFeature).toHaveBeenCalledWith("user-a", "p-a", { featureId: "f-a" });
  });

  it("maps missing project/feature to 404 and duplicate relation to 409", async () => {
    const notFound = await createTestApp({ addFeature: async () => { throw new ProjectFeatureNotFoundError(); } }).inject({ method: "POST", url: "/api/projects/other/features", headers: headers(), payload: { featureId: "f-a" } });
    const conflict = await createTestApp({ addFeature: async () => { throw new ProjectFeatureConflictError(); } }).inject({ method: "POST", url: "/api/projects/p-a/features", headers: headers(), payload: { featureId: "f-a" } });
    expect(notFound.statusCode).toBe(404);
    expect(conflict.statusCode).toBe(409);
    const inactive = await createTestApp({ addFeature: async () => { throw new ProjectFeatureRuleError("FEATURE_INACTIVE"); } }).inject({ method: "POST", url: "/api/projects/p-a/features", headers: headers(), payload: { featureId: "f-a" } });
    expect(inactive.statusCode).toBe(422);
  });

  it("updates permitted fields and rejects ownership or negative hours", async () => {
    const updateFeature = vi.fn(async () => projectFeature);
    const testApp = createTestApp({ updateFeature });
    const updated = await testApp.inject({ method: "PATCH", url: "/api/projects/p-a/features/pf-a", headers: headers(), payload: { overrideHours: 0, notes: "Custom" } });
    const negative = await testApp.inject({ method: "PATCH", url: "/api/projects/p-a/features/pf-a", headers: headers(), payload: { overrideHours: -1 } });
    const forbidden = await testApp.inject({ method: "PATCH", url: "/api/projects/p-a/features/pf-a", headers: headers(), payload: { userId: "user-b" } });
    expect(updated.statusCode).toBe(200);
    expect(updateFeature).toHaveBeenCalledWith("user-a", "p-a", "pf-a", { overrideHours: 0, notes: "Custom" });
    expect([negative.statusCode, forbidden.statusCode]).toEqual([400, 400]);
  });

  it("returns 404 for project feature outside the requested owned project", async () => {
    const updateFeature = async () => { throw new ProjectFeatureNotFoundError(); };
    const removeFeature = async () => { throw new ProjectFeatureNotFoundError(); };
    const replaceSelections = async () => { throw new ProjectFeatureNotFoundError(); };
    const testApp = createTestApp({ updateFeature, removeFeature, replaceSelections });
    const patch = await testApp.inject({ method: "PATCH", url: "/api/projects/p-b/features/pf-a", headers: headers(), payload: { notes: "x" } });
    const deletion = await testApp.inject({ method: "DELETE", url: "/api/projects/p-b/features/pf-a", headers: headers() });
    const selections = await testApp.inject({ method: "PUT", url: "/api/projects/p-b/features/pf-a/selections", headers: headers(), payload: { selections: [] } });
    expect([patch.statusCode, deletion.statusCode, selections.statusCode]).toEqual([404, 404, 404]);
  });

  it("deletes with 204 and replaces selections with 200", async () => {
    const removeFeature = vi.fn(async () => undefined);
    const replaceSelections = vi.fn(async () => []);
    const testApp = createTestApp({ removeFeature, replaceSelections });
    const deletion = await testApp.inject({ method: "DELETE", url: "/api/projects/p-a/features/pf-a", headers: headers() });
    const put = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/features/pf-a/selections", headers: headers(), payload: { selections: [] } });
    expect(deletion.statusCode).toBe(204);
    expect(deletion.body).toBe("");
    expect(put.statusCode).toBe(200);
    expect(put.json()).toEqual({ data: [] });
    expect(replaceSelections).toHaveBeenCalledWith("user-a", "p-a", "pf-a", []);
  });

  it("rejects invalid selection shapes, business rules, and unauthenticated calls", async () => {
    const replaceSelections = vi.fn(async () => { throw new ProjectFeatureRuleError("SINGLE_OPTION_MULTIPLE_VALUES"); });
    const testApp = createTestApp({ replaceSelections });
    const ruleViolation = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/features/pf-a/selections", headers: headers(), payload: { selections: [{ featureOptionId: "o", featureOptionValueId: "v" }] } });
    const invalidShape = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/features/pf-a/selections", headers: headers(), payload: { selections: [{ featureOptionId: "o", featureOptionValueId: "v", userId: "user-b" }] } });
    const unauthenticated = await createTestApp({}, false).inject({ method: "DELETE", url: "/api/projects/p-a/features/pf-a" });
    expect(ruleViolation.statusCode).toBe(422);
    expect(invalidShape.statusCode).toBe(400);
    expect(unauthenticated.statusCode).toBe(401);
  });
});
