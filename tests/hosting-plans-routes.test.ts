import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { HostingPlanService } from "../src/modules/hosting-plans/service.js";
import { HostingPlanNotFoundError } from "../src/modules/hosting-plans/types.js";

const hostingPlan = { id: "hosting-a", provider: "Railway", name: "Hobby", internalCost: 150000, clientPrice: 200000, billingPeriod: "MONTHLY" as const, isActive: true };

describe("hosting plan routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(service: HostingPlanService, userId = "user-a", authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: userId, name: "User", email: "user@example.com" } } : null;
    app = buildApp(undefined, findSession, undefined, undefined, undefined, service);
    return app;
  }
  function headers() { return { cookie: `${env.SESSION_COOKIE_NAME}=valid-session` }; }
  function unusedMethods(overrides: Partial<HostingPlanService> = {}): HostingPlanService {
    return {
      listHostingPlans: async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
      getHostingPlan: async () => hostingPlan,
      createHostingPlan: async () => hostingPlan,
      updateHostingPlan: async () => hostingPlan,
      updateHostingPlanStatus: async () => ({ ...hostingPlan, isActive: false }),
      ...overrides,
    };
  }

  it("creates using the session owner and rejects ownership fields", async () => {
    const createHostingPlan = vi.fn(async (_userId: string, input: { provider: string; name: string; internalCost: number; clientPrice: number; billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" }) => ({ ...hostingPlan, ...input }));
    const testApp = createTestApp(unusedMethods({ createHostingPlan }));
    const rejected = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "Railway", name: "Hobby", internalCost: 1, clientPrice: 2, billingPeriod: "MONTHLY", userId: "user-b" } });
    const created = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "Railway", name: "Hobby", internalCost: 1, clientPrice: 2, billingPeriod: "MONTHLY" } });
    expect(rejected.statusCode).toBe(400);
    expect(created.statusCode).toBe(201);
    expect(createHostingPlan).toHaveBeenCalledWith("user-a", { provider: "Railway", name: "Hobby", internalCost: 1, clientPrice: 2, billingPeriod: "MONTHLY" });
  });

  it("lists and reads the authenticated user's hosting plans", async () => {
    const listHostingPlans = vi.fn(async (userId: string) => ({ data: userId === "user-a" ? [hostingPlan] : [], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }));
    const getHostingPlan = vi.fn(async (_userId: string, id: string) => { if (id !== "hosting-a") throw new HostingPlanNotFoundError(); return hostingPlan; });
    const testApp = createTestApp(unusedMethods({ listHostingPlans, getHostingPlan }));
    const listed = await testApp.inject({ method: "GET", url: "/api/hosting-plans?search=railway&isActive=true", headers: headers() });
    const found = await testApp.inject({ method: "GET", url: "/api/hosting-plans/hosting-a", headers: headers() });
    const foreign = await testApp.inject({ method: "GET", url: "/api/hosting-plans/hosting-b", headers: headers() });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().data).toEqual([hostingPlan]);
    expect(listHostingPlans).toHaveBeenCalledWith("user-a", { search: "railway", isActive: true });
    expect(found.statusCode).toBe(200);
    expect(getHostingPlan).toHaveBeenCalledWith("user-a", "hosting-a");
    expect(foreign.statusCode).toBe(404);
  });

  it("updates and deactivates owned plans and hides other owners' plans", async () => {
    const updateHostingPlan = vi.fn(async (_userId: string, id: string) => { if (id !== "hosting-a") throw new HostingPlanNotFoundError(); return { ...hostingPlan, name: "Updated" }; });
    const updateHostingPlanStatus = vi.fn(async (_userId: string, id: string) => { if (id !== "hosting-a") throw new HostingPlanNotFoundError(); return { ...hostingPlan, isActive: false }; });
    const testApp = createTestApp(unusedMethods({ updateHostingPlan, updateHostingPlanStatus }));
    const updated = await testApp.inject({ method: "PATCH", url: "/api/hosting-plans/hosting-a", headers: headers(), payload: { name: "Updated" } });
    const foreignUpdate = await testApp.inject({ method: "PATCH", url: "/api/hosting-plans/hosting-b", headers: headers(), payload: { name: "No access" } });
    const deactivated = await testApp.inject({ method: "PATCH", url: "/api/hosting-plans/hosting-a/status", headers: headers(), payload: { isActive: false } });
    const foreignDeactivate = await testApp.inject({ method: "PATCH", url: "/api/hosting-plans/hosting-b/status", headers: headers(), payload: { isActive: false } });
    expect(updated.statusCode).toBe(200);
    expect(foreignUpdate.statusCode).toBe(404);
    expect(deactivated.statusCode).toBe(200);
    expect(deactivated.json().data).toEqual({ id: "hosting-a", isActive: false });
    expect(foreignDeactivate.statusCode).toBe(404);
  });

  it("requires authentication and validates enum, prices, and allowed fields", async () => {
    const methods = { createHostingPlan: vi.fn(), updateHostingPlan: vi.fn() };
    const testApp = createTestApp(unusedMethods(methods));
    const unauthorized = await testApp.inject({ method: "GET", url: "/api/hosting-plans" });
    const negativeCost = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "x", name: "x", internalCost: -1, clientPrice: 1, billingPeriod: "MONTHLY" } });
    const negativePrice = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "x", name: "x", internalCost: 1, clientPrice: -1, billingPeriod: "MONTHLY" } });
    const decimalCost = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "x", name: "x", internalCost: 1.5, clientPrice: 1, billingPeriod: "MONTHLY" } });
    const invalidPeriod = await testApp.inject({ method: "POST", url: "/api/hosting-plans", headers: headers(), payload: { provider: "x", name: "x", internalCost: 1, clientPrice: 1, billingPeriod: "DAILY" } });
    const extraField = await testApp.inject({ method: "PATCH", url: "/api/hosting-plans/hosting-a", headers: headers(), payload: { isActive: false } });
    expect(unauthorized.statusCode).toBe(401);
    expect([negativeCost.statusCode, negativePrice.statusCode, decimalCost.statusCode, invalidPeriod.statusCode, extraField.statusCode]).toEqual([400, 400, 400, 400, 400]);
    expect(methods.createHostingPlan).not.toHaveBeenCalled();
    expect(methods.updateHostingPlan).not.toHaveBeenCalled();
  });
});
