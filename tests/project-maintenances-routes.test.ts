import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { ProjectMaintenanceService } from "../src/modules/project-maintenances/service.js";
import { ProjectMaintenanceDuplicateError, ProjectMaintenanceNotFoundError, ProjectMaintenancePlanNotFoundError, ProjectMaintenanceProjectNotFoundError } from "../src/modules/project-maintenances/types.js";

const relation = { id: "relation-a", projectId: "project-a", maintenancePlanId: "plan-a", createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z") };
describe("project maintenance routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(overrides: Partial<ProjectMaintenanceService> = {}, authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    const service: ProjectMaintenanceService = { addMaintenance: async () => relation, removeMaintenance: async () => undefined, ...overrides };
    app = buildApp(undefined, findSession, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("adds distinct plans and returns the created relation", async () => {
    const addMaintenance = vi.fn(async (_userId: string, _projectId: string, input: { maintenancePlanId: string }) => ({ ...relation, id: `relation-${input.maintenancePlanId}`, maintenancePlanId: input.maintenancePlanId }));
    const testApp = createTestApp({ addMaintenance });
    const first = await testApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", headers: headers(), payload: { maintenancePlanId: "plan-a" } });
    const second = await testApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", headers: headers(), payload: { maintenancePlanId: "plan-b" } });
    expect([first.statusCode, second.statusCode]).toEqual([201, 201]);
    expect(first.json().data.maintenancePlanId).toBe("plan-a");
    expect(second.json().data.maintenancePlanId).toBe("plan-b");
    expect(addMaintenance).toHaveBeenNthCalledWith(1, "user-a", "project-a", { maintenancePlanId: "plan-a" });
    expect(addMaintenance).toHaveBeenNthCalledWith(2, "user-a", "project-a", { maintenancePlanId: "plan-b" });
  });

  it("maps duplicate, missing project, and inaccessible plan errors", async () => {
    const testApp = createTestApp({ addMaintenance: async (_userId, _projectId, input) => {
      if (input.maintenancePlanId === "duplicate") throw new ProjectMaintenanceDuplicateError();
      if (input.maintenancePlanId === "foreign") throw new ProjectMaintenancePlanNotFoundError();
      throw new ProjectMaintenanceProjectNotFoundError();
    } });
    const duplicate = await testApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", headers: headers(), payload: { maintenancePlanId: "duplicate" } });
    const foreignPlan = await testApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", headers: headers(), payload: { maintenancePlanId: "foreign" } });
    const foreignProject = await testApp.inject({ method: "POST", url: "/api/projects/foreign/maintenances", headers: headers(), payload: { maintenancePlanId: "plan-a" } });
    expect([duplicate.statusCode, duplicate.json().error.code]).toEqual([409, "CONFLICT"]);
    expect([foreignPlan.statusCode, foreignPlan.json().error.code]).toEqual([404, "MAINTENANCE_PLAN_NOT_FOUND"]);
    expect([foreignProject.statusCode, foreignProject.json().error.code]).toEqual([404, "PROJECT_NOT_FOUND"]);
  });

  it("removes only an attached relation and requires a valid session", async () => {
    const removeMaintenance = vi.fn(async (_userId: string, projectId: string, _id: string) => { if (projectId !== "project-a") throw new ProjectMaintenanceNotFoundError(); });
    const testApp = createTestApp({ removeMaintenance });
    const removed = await testApp.inject({ method: "DELETE", url: "/api/projects/project-a/maintenances/relation-a", headers: headers() });
    const unrelated = await testApp.inject({ method: "DELETE", url: "/api/projects/other/maintenances/relation-a", headers: headers() });
    expect(removed.statusCode).toBe(204);
    expect(removed.body).toBe("");
    expect(unrelated.statusCode).toBe(404);
    expect(removeMaintenance).toHaveBeenCalledWith("user-a", "project-a", "relation-a");

    await testApp.close();
    const unauthenticatedApp = createTestApp({}, false);
    const unauthenticated = await unauthenticatedApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", payload: { maintenancePlanId: "plan-a" } });
    expect(unauthenticated.statusCode).toBe(401);
  });

  it("rejects uncontracted body fields", async () => {
    const addMaintenance = vi.fn();
    const testApp = createTestApp({ addMaintenance });
    const response = await testApp.inject({ method: "POST", url: "/api/projects/project-a/maintenances", headers: headers(), payload: { maintenancePlanId: "plan-a", userId: "user-b" } });
    expect(response.statusCode).toBe(400);
    expect(addMaintenance).not.toHaveBeenCalled();
  });
});
