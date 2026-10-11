import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { ProjectService } from "../src/modules/projects/service.js";
import { ProjectNotFoundError } from "../src/modules/projects/types.js";

const project = { id: "project-a", clientName: "Client A", projectName: "Website", logoUrl: null, deadline: null, status: "DRAFT" as const, createdAt: new Date("2026-01-01T00:00:00.000Z"), updatedAt: new Date("2026-01-01T00:00:00.000Z") };
describe("project routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(service: ProjectService, authenticated = true) {
    const lookup: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    app = buildApp(undefined, lookup, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });
  function service(overrides: Partial<ProjectService> = {}): ProjectService {
    return {
      listProjects: async () => ({ data: [project], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }),
      getProject: async () => project,
      createProject: async () => project,
      updateProject: async () => project,
      ...overrides,
    };
  }

  it("lists only the session user's projects and returns pagination metadata", async () => {
    const listProjects = vi.fn(async (userId: string) => userId === "user-a" ? { data: [project], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } } : { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
    const response = await createTestApp(service({ listProjects })).inject({ method: "GET", url: "/api/projects", headers: headers() });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual([expect.objectContaining({ id: "project-a" })]);
    expect(response.json().meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
    expect(listProjects).toHaveBeenCalledWith("user-a", {});
  });
  it("gets an owned project and hides another user's project as 404", async () => {
    const getProject = vi.fn(async (_userId: string, id: string) => { if (id !== "project-a") throw new ProjectNotFoundError(); return project; });
    const testApp = createTestApp(service({ getProject }));
    const own = await testApp.inject({ method: "GET", url: "/api/projects/project-a", headers: headers() });
    const foreign = await testApp.inject({ method: "GET", url: "/api/projects/project-b", headers: headers() });
    expect(own.statusCode).toBe(200);
    expect(own.json().data.id).toBe("project-a");
    expect(foreign.statusCode).toBe(404);
  });
  it("creates with the session identity and rejects userId input", async () => {
    const createProject = vi.fn(async () => project);
    const testApp = createTestApp(service({ createProject }));
    const forbidden = await testApp.inject({ method: "POST", url: "/api/projects", headers: headers(), payload: { clientName: "Client A", projectName: "Website", userId: "user-b" } });
    expect(forbidden.statusCode).toBe(400);
    expect(createProject).not.toHaveBeenCalled();
    const created = await testApp.inject({ method: "POST", url: "/api/projects", headers: headers(), payload: { clientName: "Client A", projectName: "Website" } });
    expect(created.statusCode).toBe(201);
    expect(createProject).toHaveBeenCalledWith("user-a", { clientName: "Client A", projectName: "Website" });
  });
  it("updates only an owned project and disallows forbidden fields", async () => {
    const updateProject = vi.fn(async (_userId: string, _id: string, input: { projectName?: string }) => ({ ...project, projectName: input.projectName ?? project.projectName }));
    const testApp = createTestApp(service({ updateProject }));
    const forbidden = await testApp.inject({ method: "PATCH", url: "/api/projects/project-a", headers: headers(), payload: { userId: "user-b" } });
    expect(forbidden.statusCode).toBe(400);
    const updated = await testApp.inject({ method: "PATCH", url: "/api/projects/project-a", headers: headers(), payload: { projectName: "Updated" } });
    expect(updated.statusCode).toBe(200);
    expect(updateProject).toHaveBeenCalledWith("user-a", "project-a", { projectName: "Updated" });
    const foreignApp = createTestApp(service({ updateProject: async () => { throw new ProjectNotFoundError(); } }));
    const foreign = await foreignApp.inject({ method: "PATCH", url: "/api/projects/project-b", headers: headers(), payload: { projectName: "Updated" } });
    expect(foreign.statusCode).toBe(404);
  });
  it("requires authentication and validates required fields, types, and non-empty patch", async () => {
    const createProject = vi.fn(async () => project);
    const unauthenticated = await createTestApp(service({ createProject }), false).inject({ method: "POST", url: "/api/projects", payload: { clientName: "Client", projectName: "Site" } });
    expect(unauthenticated.statusCode).toBe(401);
    const testApp = createTestApp(service({ createProject }));
    const missing = await testApp.inject({ method: "POST", url: "/api/projects", headers: headers(), payload: { clientName: "Client" } });
    const wrongType = await testApp.inject({ method: "POST", url: "/api/projects", headers: headers(), payload: { clientName: 3, projectName: "Site" } });
    const badDeadline = await testApp.inject({ method: "POST", url: "/api/projects", headers: headers(), payload: { clientName: "Client", projectName: "Site", deadline: "tomorrow" } });
    const emptyPatch = await testApp.inject({ method: "PATCH", url: "/api/projects/project-a", headers: headers(), payload: {} });
    expect([missing.statusCode, wrongType.statusCode, badDeadline.statusCode, emptyPatch.statusCode]).toEqual([400, 400, 400, 400]);
    expect(createProject).not.toHaveBeenCalled();
  });
});
