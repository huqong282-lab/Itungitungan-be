import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { DesignService } from "../src/modules/designs/service.js";
import { DesignNotFoundError } from "../src/modules/designs/types.js";

const design = { id: "design-a", name: "Premium UI", description: "Custom interface", price: 1500000, isActive: true };

describe("design routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });

  function createTestApp(service: DesignService, userId = "user-a", authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? {
      expiresAt: new Date(Date.now() + 60_000), user: { id: userId, name: "User", email: "user@example.com" },
    } : null;
    app = buildApp(undefined, findSession, undefined, undefined, service);
    return app;
  }
  function headers() { return { cookie: `${env.SESSION_COOKIE_NAME}=valid-session` }; }
  function unusedMethods(overrides: Partial<DesignService> = {}): DesignService {
    return {
      listDesigns: async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
      getDesign: async () => design,
      createDesign: async () => design,
      updateDesign: async () => design,
      updateDesignStatus: async () => ({ ...design, isActive: false }),
      ...overrides,
    };
  }

  it("creates with the session owner and rejects userId in the body", async () => {
    const createDesign = vi.fn(async (_userId: string, input: { name: string; description?: string | null; price: number }) => ({ ...design, ...input }));
    const testApp = createTestApp(unusedMethods({ createDesign }));
    const rejected = await testApp.inject({ method: "POST", url: "/api/designs", headers: headers(), payload: { name: "Premium UI", price: 100, userId: "user-b" } });
    const created = await testApp.inject({ method: "POST", url: "/api/designs", headers: headers(), payload: { name: "Premium UI", price: 100 } });
    expect(rejected.statusCode).toBe(400);
    expect(created.statusCode).toBe(201);
    expect(createDesign).toHaveBeenCalledWith("user-a", { name: "Premium UI", price: 100 });
  });

  it("lists and gets only in the authenticated user's scope", async () => {
    const listDesigns = vi.fn(async (userId: string) => ({ data: userId === "user-a" ? [design] : [], meta: { page: 2, pageSize: 5, total: 6, totalPages: 2 } }));
    const getDesign = vi.fn(async (_userId: string, id: string) => { if (id !== "design-a") throw new DesignNotFoundError(); return design; });
    const testApp = createTestApp(unusedMethods({ listDesigns, getDesign }));
    const listed = await testApp.inject({ method: "GET", url: "/api/designs?page=2&pageSize=5&search=premium&isActive=true", headers: headers() });
    const found = await testApp.inject({ method: "GET", url: "/api/designs/design-a", headers: headers() });
    const missing = await testApp.inject({ method: "GET", url: "/api/designs/design-b", headers: headers() });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().data).toEqual([design]);
    expect(listDesigns).toHaveBeenCalledWith("user-a", { page: 2, pageSize: 5, search: "premium", isActive: true });
    expect(found.statusCode).toBe(200);
    expect(getDesign).toHaveBeenCalledWith("user-a", "design-a");
    expect(missing.statusCode).toBe(404);
  });

  it("updates and deactivates owned records, while hiding records owned by others", async () => {
    const updateDesign = vi.fn(async (_userId: string, id: string) => { if (id !== "design-a") throw new DesignNotFoundError(); return { ...design, name: "Updated" }; });
    const updateDesignStatus = vi.fn(async (_userId: string, id: string) => { if (id !== "design-a") throw new DesignNotFoundError(); return { ...design, isActive: false }; });
    const testApp = createTestApp(unusedMethods({ updateDesign, updateDesignStatus }));
    const updated = await testApp.inject({ method: "PATCH", url: "/api/designs/design-a", headers: headers(), payload: { name: "Updated" } });
    const foreignUpdate = await testApp.inject({ method: "PATCH", url: "/api/designs/design-b", headers: headers(), payload: { name: "No access" } });
    const deactivated = await testApp.inject({ method: "PATCH", url: "/api/designs/design-a/status", headers: headers(), payload: { isActive: false } });
    const foreignDeactivate = await testApp.inject({ method: "PATCH", url: "/api/designs/design-b/status", headers: headers(), payload: { isActive: false } });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.name).toBe("Updated");
    expect(foreignUpdate.statusCode).toBe(404);
    expect(deactivated.statusCode).toBe(200);
    expect(deactivated.json().data).toEqual({ id: "design-a", isActive: false });
    expect(foreignDeactivate.statusCode).toBe(404);
  });

  it("returns 401 without a valid session and 400 for invalid requests", async () => {
    const methods = { createDesign: vi.fn(), updateDesign: vi.fn() };
    const testApp = createTestApp(unusedMethods(methods));
    const unauthenticated = await testApp.inject({ method: "GET", url: "/api/designs" });
    const invalidCreate = await testApp.inject({ method: "POST", url: "/api/designs", headers: headers(), payload: { name: "", price: -1 } });
    const emptyPatch = await testApp.inject({ method: "PATCH", url: "/api/designs/design-a", headers: headers(), payload: {} });
    const invalidStatus = await testApp.inject({ method: "PATCH", url: "/api/designs/design-a/status", headers: headers(), payload: { isActive: "false" } });
    expect(unauthenticated.statusCode).toBe(401);
    expect(invalidCreate.statusCode).toBe(400);
    expect(emptyPatch.statusCode).toBe(400);
    expect(invalidStatus.statusCode).toBe(400);
    expect(methods.createDesign).not.toHaveBeenCalled();
    expect(methods.updateDesign).not.toHaveBeenCalled();
  });
});
