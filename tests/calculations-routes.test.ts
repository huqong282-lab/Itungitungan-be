import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { CalculationService } from "../src/modules/calculations/service.js";
import type { ProjectCalculation } from "../src/modules/calculations/types.js";
import { CalculationProjectNotFoundError } from "../src/modules/calculations/types.js";

const result: ProjectCalculation = {
  estimatedHours: 44,
  bufferPercentage: 20,
  bufferedHours: 53,
  workingHoursPerDay: 8,
  workingDays: 7,
  deadline: null,
  deadlineStatus: "NORMAL",
  developmentCost: 4_400_000,
  designCost: 1_000_000,
  hostingCost: 200_000,
  maintenanceCost: 500_000,
  subtotal: 6_100_000,
  marginPercentage: 30,
  marginAmount: 1_830_000,
  rushFeePercentage: 0,
  rushFeeAmount: 0,
  finalPrice: 7_930_000,
  revisionPolicy: { freeRevisionCount: 2, additionalRevisionPrice: 200_000 },
};

describe("calculation routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });

  function createTestApp(service: CalculationService, authenticated = true) {
    const lookup: SessionLookup = async () => authenticated
      ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } }
      : null;
    app = buildApp(undefined, lookup, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }

  function calculationService(overrides: Partial<CalculationService> = {}): CalculationService {
    return {
      calculateProject: async () => result,
      ...overrides,
    };
  }

  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("returns all API Contract fields for an authenticated request", async () => {
    const calculateProject = vi.fn(async () => result);
    const response = await createTestApp(calculationService({ calculateProject })).inject({
      method: "POST",
      url: "/api/projects/project-a/calculate",
      headers: headers(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual(result);
    expect(calculateProject).toHaveBeenCalledWith("user-a", "project-a", {});
  });

  it("passes only the optional margin percentage through from request input", async () => {
    const calculateProject = vi.fn(async () => result);
    const response = await createTestApp(calculationService({ calculateProject })).inject({
      method: "POST",
      url: "/api/projects/project-a/calculate",
      headers: headers(),
      payload: { marginPercentage: 25 },
    });

    expect(response.statusCode).toBe(200);
    expect(calculateProject).toHaveBeenCalledWith("user-a", "project-a", { marginPercentage: 25 });
  });

  it("rejects requests without a valid session", async () => {
    const calculateProject = vi.fn(async () => result);
    const response = await createTestApp(calculationService({ calculateProject }), false).inject({
      method: "POST",
      url: "/api/projects/project-a/calculate",
    });

    expect(response.statusCode).toBe(401);
    expect(calculateProject).not.toHaveBeenCalled();
  });

  it("returns 404 for a project not owned by the session user", async () => {
    const calculateProject = vi.fn(async () => { throw new CalculationProjectNotFoundError(); });
    const response = await createTestApp(calculationService({
      calculateProject,
    })).inject({ method: "POST", url: "/api/projects/foreign-project/calculate", headers: headers() });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("PROJECT_NOT_FOUND");
    expect(calculateProject).toHaveBeenCalledWith("user-a", "foreign-project", {});
  });

  it("rejects invalid project IDs, unknown calculation fields, and invalid margins", async () => {
    const testApp = createTestApp(calculationService());
    const invalidId = await testApp.inject({ method: "POST", url: "/api/projects/%20/calculate", headers: headers() });
    const untrustedValues = await testApp.inject({
      method: "POST",
      url: "/api/projects/project-a/calculate",
      headers: headers(),
      payload: { marginPercentage: 25, finalPrice: 1, userId: "user-b" },
    });
    const invalidMargin = await testApp.inject({
      method: "POST",
      url: "/api/projects/project-a/calculate",
      headers: headers(),
      payload: { marginPercentage: 101 },
    });

    expect([invalidId.statusCode, untrustedValues.statusCode, invalidMargin.statusCode]).toEqual([400, 400, 400]);
  });
});
