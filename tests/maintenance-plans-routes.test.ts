import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { MaintenancePlanService } from "../src/modules/maintenance-plans/service.js";
import { MaintenancePlanNotFoundError } from "../src/modules/maintenance-plans/types.js";

const plan = { id: "maintenance-a", name: "Monthly care", price: 500000, billingPeriod: "MONTHLY" as const, isActive: true };
describe("maintenance plan routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });
  function createTestApp(service: MaintenancePlanService, authenticated = true) {
    const findSession: SessionLookup = async () => authenticated ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } } : null;
    app = buildApp(undefined, findSession, undefined, undefined, undefined, undefined, service);
    return app;
  }
  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });
  function serviceWith(overrides: Partial<MaintenancePlanService> = {}): MaintenancePlanService {
    return {
      listMaintenancePlans: async () => ({ data: [plan], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }),
      getMaintenancePlan: async () => plan,
      createMaintenancePlan: async () => plan,
      updateMaintenancePlan: async () => plan,
      updateMaintenancePlanStatus: async (_userId, _id, input) => ({ ...plan, isActive: input.isActive }),
      ...overrides,
    };
  }

  it("lists and reads only through the authenticated owner context", async () => {
    const listMaintenancePlans = vi.fn(async (userId: string) => ({ data: userId === "user-a" ? [plan] : [], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }));
    const getMaintenancePlan = vi.fn(async (_userId: string, id: string) => { if (id !== plan.id) throw new MaintenancePlanNotFoundError(); return plan; });
    const testApp = createTestApp(serviceWith({ listMaintenancePlans, getMaintenancePlan }));
    const listed = await testApp.inject({ method: "GET", url: "/api/maintenance-plans?search=monthly&isActive=true", headers: headers() });
    const found = await testApp.inject({ method: "GET", url: `/api/maintenance-plans/${plan.id}`, headers: headers() });
    const foreign = await testApp.inject({ method: "GET", url: "/api/maintenance-plans/foreign", headers: headers() });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().data).toEqual([plan]);
    expect(listMaintenancePlans).toHaveBeenCalledWith("user-a", { search: "monthly", isActive: true });
    expect(found.statusCode).toBe(200);
    expect(getMaintenancePlan).toHaveBeenCalledWith("user-a", plan.id);
    expect(foreign.statusCode).toBe(404);
  });

  it("creates and updates allowed fields using the session user", async () => {
    const createMaintenancePlan = vi.fn(async (_userId: string, input: { name: string; price: number; billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" }) => ({ ...plan, ...input }));
    const updateMaintenancePlan = vi.fn(async (_userId: string, _id: string, input: { name?: string }) => ({ ...plan, ...input }));
    const testApp = createTestApp(serviceWith({ createMaintenancePlan, updateMaintenancePlan }));
    const created = await testApp.inject({ method: "POST", url: "/api/maintenance-plans", headers: headers(), payload: { name: plan.name, price: plan.price, billingPeriod: "MONTHLY" } });
    const updated = await testApp.inject({ method: "PATCH", url: `/api/maintenance-plans/${plan.id}`, headers: headers(), payload: { name: "Updated" } });
    expect(created.statusCode).toBe(201);
    expect(createMaintenancePlan).toHaveBeenCalledWith("user-a", { name: plan.name, price: plan.price, billingPeriod: "MONTHLY" });
    expect(updated.statusCode).toBe(200);
    expect(updateMaintenancePlan).toHaveBeenCalledWith("user-a", plan.id, { name: "Updated" });
  });

  it("toggles isActive without deleting and returns 404 for another owner's record", async () => {
    const updateMaintenancePlanStatus = vi.fn(async (_userId: string, id: string, input: { isActive: boolean }) => { if (id !== plan.id) throw new MaintenancePlanNotFoundError(); return { ...plan, isActive: input.isActive }; });
    const testApp = createTestApp(serviceWith({ updateMaintenancePlanStatus }));
    const disabled = await testApp.inject({ method: "PATCH", url: `/api/maintenance-plans/${plan.id}/status`, headers: headers(), payload: { isActive: false } });
    const enabled = await testApp.inject({ method: "PATCH", url: `/api/maintenance-plans/${plan.id}/status`, headers: headers(), payload: { isActive: true } });
    const foreign = await testApp.inject({ method: "PATCH", url: "/api/maintenance-plans/foreign/status", headers: headers(), payload: { isActive: false } });
    expect(disabled.statusCode).toBe(200);
    expect(disabled.json().data).toEqual({ id: plan.id, isActive: false });
    expect(enabled.json().data.isActive).toBe(true);
    expect(foreign.statusCode).toBe(404);
    expect(updateMaintenancePlanStatus).toHaveBeenCalledTimes(3);
  });

  it("requires a session and rejects invalid, ownership, and extra fields", async () => {
    const methods = { createMaintenancePlan: vi.fn(), updateMaintenancePlan: vi.fn() };
    const testApp = createTestApp(serviceWith(methods), false);
    const unauthorized = await testApp.inject({ method: "GET", url: "/api/maintenance-plans" });
    expect(unauthorized.statusCode).toBe(401);
    const authorizedApp = createTestApp(serviceWith(methods));
    const negative = await authorizedApp.inject({ method: "POST", url: "/api/maintenance-plans", headers: headers(), payload: { name: "x", price: -1, billingPeriod: "MONTHLY" } });
    const decimal = await authorizedApp.inject({ method: "POST", url: "/api/maintenance-plans", headers: headers(), payload: { name: "x", price: 1.5, billingPeriod: "MONTHLY" } });
    const enumValue = await authorizedApp.inject({ method: "POST", url: "/api/maintenance-plans", headers: headers(), payload: { name: "x", price: 1, billingPeriod: "DAILY" } });
    const userId = await authorizedApp.inject({ method: "POST", url: "/api/maintenance-plans", headers: headers(), payload: { name: "x", price: 1, billingPeriod: "MONTHLY", userId: "user-b" } });
    const forbidden = await authorizedApp.inject({ method: "PATCH", url: `/api/maintenance-plans/${plan.id}`, headers: headers(), payload: { isActive: false } });
    const emptyPatch = await authorizedApp.inject({ method: "PATCH", url: `/api/maintenance-plans/${plan.id}`, headers: headers(), payload: {} });
    expect([negative.statusCode, decimal.statusCode, enumValue.statusCode, userId.statusCode, forbidden.statusCode, emptyPatch.statusCode]).toEqual([400, 400, 400, 400, 400, 400]);
    expect(methods.createMaintenancePlan).not.toHaveBeenCalled();
    expect(methods.updateMaintenancePlan).not.toHaveBeenCalled();
  });
});
