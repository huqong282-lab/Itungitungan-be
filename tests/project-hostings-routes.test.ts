import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { ProjectHostingService } from "../src/modules/project-hostings/service.js";
import { ProjectHostingNotFoundError, ProjectHostingPlanNotFoundError, ProjectHostingProjectNotFoundError, ProjectHostingRuleError } from "../src/modules/project-hostings/types.js";

const hosting = { id: "hosting-a", projectId: "project-a", hostingPlanId: "plan-a", label: "Production", clientProvided: false, createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z") };
describe("project hosting routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(overrides: Partial<ProjectHostingService> = {}, authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    const service: ProjectHostingService = { addHosting: async () => hosting, updateHosting: async () => hosting, removeHosting: async () => undefined, ...overrides };
    app = buildApp(undefined, findSession, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("adds multiple hosting rows to a project using the session user", async () => {
    const addHosting = vi.fn(async (_userId: string, _projectId: string, input: { label: string; hostingPlanId: string | null; clientProvided: boolean }) => ({ ...hosting, id: `hosting-${input.label}`, ...input }));
    const testApp = createTestApp({ addHosting });
    const first = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Production", hostingPlanId: "plan-a", clientProvided: false } });
    const second = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Staging", hostingPlanId: "plan-b", clientProvided: false } });
    expect([first.statusCode, second.statusCode]).toEqual([201, 201]);
    expect(first.json().data.label).toBe("Production");
    expect(second.json().data.label).toBe("Staging");
    expect(addHosting).toHaveBeenNthCalledWith(1, "user-a", "project-a", { label: "Production", hostingPlanId: "plan-a", clientProvided: false });
    expect(addHosting).toHaveBeenNthCalledWith(2, "user-a", "project-a", { label: "Staging", hostingPlanId: "plan-b", clientProvided: false });
  });

  it("creates client-provided hosting with a null plan and maps missing resources", async () => {
    const addHosting = vi.fn(async (_userId: string, projectId: string, input: { hostingPlanId: string | null }) => {
      if (projectId === "missing") throw new ProjectHostingProjectNotFoundError();
      if (input.hostingPlanId === "foreign-plan") throw new ProjectHostingPlanNotFoundError();
      return hosting;
    });
    const testApp = createTestApp({ addHosting });
    const clientProvided = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Client Production", hostingPlanId: null, clientProvided: true } });
    expect(clientProvided.statusCode).toBe(201);
    const missingProject = await testApp.inject({ method: "POST", url: "/api/projects/missing/hostings", headers: headers(), payload: { label: "Production", hostingPlanId: "plan-a", clientProvided: false } });
    expect(missingProject.statusCode).toBe(404);
    const missingPlan = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Production", hostingPlanId: "foreign-plan", clientProvided: false } });
    expect(missingPlan.statusCode).toBe(404);
  });

  it("updates a project hosting and hides hosting IDs outside the project", async () => {
    const updateHosting = vi.fn(async (_userId: string, projectId: string, _hostingId: string, input: { label?: string }) => {
      if (projectId !== "project-a") throw new ProjectHostingNotFoundError();
      return { ...hosting, ...input };
    });
    const testApp = createTestApp({ updateHosting });
    const updated = await testApp.inject({ method: "PATCH", url: "/api/projects/project-a/hostings/hosting-a", headers: headers(), payload: { label: "Staging" } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.label).toBe("Staging");
    expect(updateHosting).toHaveBeenCalledWith("user-a", "project-a", "hosting-a", { label: "Staging" });
    const foreign = await testApp.inject({ method: "PATCH", url: "/api/projects/other/hostings/hosting-a", headers: headers(), payload: { label: "No access" } });
    expect(foreign.statusCode).toBe(404);
  });

  it("deletes a hosting relation with 204 without exposing missing or foreign rows", async () => {
    const removeHosting = vi.fn(async (_userId: string, projectId: string) => { if (projectId !== "project-a") throw new ProjectHostingNotFoundError(); });
    const testApp = createTestApp({ removeHosting });
    const removed = await testApp.inject({ method: "DELETE", url: "/api/projects/project-a/hostings/hosting-a", headers: headers() });
    expect(removed.statusCode).toBe(204);
    expect(removed.body).toBe("");
    expect(removeHosting).toHaveBeenCalledWith("user-a", "project-a", "hosting-a");
    const missing = await testApp.inject({ method: "DELETE", url: "/api/projects/other/hostings/hosting-a", headers: headers() });
    expect(missing.statusCode).toBe(404);
  });

  it("requires a session and rejects invalid request fields and hosting combinations", async () => {
    const addHosting = vi.fn();
    const unauthenticatedApp = createTestApp({ addHosting }, false);
    const unauthenticated = await unauthenticatedApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", payload: { label: "Production", hostingPlanId: "plan-a", clientProvided: false } });
    await unauthenticatedApp.close();
    expect(unauthenticated.statusCode).toBe(401);
    const testApp = createTestApp({ addHosting: async () => { throw new ProjectHostingRuleError("INVALID_HOSTING_PLAN_SELECTION"); } });
    const missingLabel = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { hostingPlanId: "plan-a", clientProvided: false } });
    const forbiddenField = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Production", hostingPlanId: "plan-a", clientProvided: false, userId: "user-b" } });
    const invalidRule = await testApp.inject({ method: "POST", url: "/api/projects/project-a/hostings", headers: headers(), payload: { label: "Production", hostingPlanId: "plan-a", clientProvided: true } });
    const invalidPatch = await testApp.inject({ method: "PATCH", url: "/api/projects/project-a/hostings/hosting-a", headers: headers(), payload: {} });
    expect([missingLabel.statusCode, forbiddenField.statusCode, invalidRule.statusCode, invalidPatch.statusCode]).toEqual([400, 400, 422, 400]);
    expect(addHosting).not.toHaveBeenCalled();
  });
});
