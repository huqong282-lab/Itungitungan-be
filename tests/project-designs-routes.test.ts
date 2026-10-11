import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { ProjectDesignService } from "../src/modules/project-designs/service.js";
import { ProjectDesignNotFoundError, ProjectDesignRuleError } from "../src/modules/project-designs/types.js";

const assignment = { id: "pd-a", projectId: "p-a", designId: "d-a", createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") };
describe("project design routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(overrides: Partial<ProjectDesignService> = {}, authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    const service: ProjectDesignService = { setDesign: async () => assignment, removeDesign: async () => undefined, ...overrides };
    app = buildApp(undefined, findSession, undefined, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("sets the authenticated user's design on the project", async () => {
    const setDesign = vi.fn(async () => assignment);
    const response = await createTestApp({ setDesign }).inject({ method: "PUT", url: "/api/projects/p-a/design", headers: headers(), payload: { designId: "d-a" } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: expect.objectContaining({ projectId: "p-a", designId: "d-a" }) });
    expect(setDesign).toHaveBeenCalledWith("user-a", "p-a", { designId: "d-a" });
  });

  it("rejects missing or foreign resources, inactive designs, and invalid bodies", async () => {
    const setDesign = vi.fn(async (_user: string, projectId: string, input: { designId: string }) => {
      if (projectId !== "p-a" || input.designId === "foreign") throw new ProjectDesignNotFoundError();
      if (input.designId === "inactive") throw new ProjectDesignRuleError("DESIGN_INACTIVE");
      return assignment;
    });
    const testApp = createTestApp({ setDesign });
    const foreignProject = await testApp.inject({ method: "PUT", url: "/api/projects/p-b/design", headers: headers(), payload: { designId: "d-a" } });
    const foreignDesign = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/design", headers: headers(), payload: { designId: "foreign" } });
    const inactive = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/design", headers: headers(), payload: { designId: "inactive" } });
    const invalidBody = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/design", headers: headers(), payload: { designId: "d-a", userId: "user-b" } });
    expect([foreignProject.statusCode, foreignDesign.statusCode, inactive.statusCode, invalidBody.statusCode]).toEqual([404, 404, 422, 400]);
  });

  it("removes only the project assignment and returns 204", async () => {
    const removeDesign = vi.fn(async () => undefined);
    const response = await createTestApp({ removeDesign }).inject({ method: "DELETE", url: "/api/projects/p-a/design", headers: headers() });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(removeDesign).toHaveBeenCalledWith("user-a", "p-a");
  });

  it("requires a valid session for both methods", async () => {
    const setDesign = vi.fn(); const removeDesign = vi.fn();
    const testApp = createTestApp({ setDesign, removeDesign }, false);
    const put = await testApp.inject({ method: "PUT", url: "/api/projects/p-a/design", payload: { designId: "d-a" } });
    const deletion = await testApp.inject({ method: "DELETE", url: "/api/projects/p-a/design" });
    expect([put.statusCode, deletion.statusCode]).toEqual([401, 401]);
    expect(setDesign).not.toHaveBeenCalled();
    expect(removeDesign).not.toHaveBeenCalled();
  });
});
