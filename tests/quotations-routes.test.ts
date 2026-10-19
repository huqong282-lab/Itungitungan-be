import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { QuotationService } from "../src/modules/quotations/service.js";
import { DraftQuotationAlreadyExistsError, QuotationDetailNotFoundError, QuotationFinalizedError, QuotationNotFoundError, QuotationProjectFilterNotFoundError, QuotationProjectNotFoundError } from "../src/modules/quotations/types.js";

const quotation = {
  id: "quotation-a",
  quotationNumber: "QT-000001",
  version: 1,
  status: "DRAFT" as const,
  finalPrice: 7_930_000,
  workingDays: 7,
  createdAt: new Date("2026-10-14T00:00:00.000Z"),
};

const quotationDetail = {
  header: {
    id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "DRAFT", clientName: "Snapshot Client", projectName: "Snapshot Project",
    logoUrl: null, deadline: null, developerRate: 100_000, finalizedAt: null, createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-15T00:00:00.000Z",
  },
  features: [{ name: "Snapshot Feature", baseHours: 10, estimatedHours: 12, developerRate: 100_000, developmentCost: 1_200_000, selections: [{ optionName: "Snapshot Option", valueLabel: "Snapshot Value", hours: 2 }] }],
  design: { name: "Snapshot Design", price: 300_000 },
  hostings: [{ label: "Snapshot Hosting", provider: "Provider", plan: "Plan", internalCost: 70_000, clientPrice: 100_000, clientProvided: false, billingPeriod: "YEARLY" }],
  maintenances: [{ name: "Snapshot Maintenance", price: 200_000, billingPeriod: "MONTHLY" }],
  timeline: { estimatedHours: 12, bufferPercentage: 20, bufferedHours: 15, workingHoursPerDay: 8, workingDays: 2 },
  pricing: { developmentCost: 1_200_000, designCost: 300_000, hostingCost: 100_000, maintenanceCost: 200_000, subtotal: 1_800_000, marginPercentage: 30, marginAmount: 540_000, rushFeePercentage: 10, rushFeeAmount: 234_000, finalPrice: 2_574_000 },
  revisionPolicy: { freeRevisionCount: 2, additionalRevisionPrice: 50_000 },
};

describe("quotation routes", () => {
  let app: FastifyInstance | undefined;
  afterEach(async () => { await app?.close(); app = undefined; });

  function createTestApp(service: QuotationService, authenticated = true) {
    const lookup: SessionLookup = async () => authenticated
      ? { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "User", email: "user@example.com" } }
      : null;
    app = buildApp(undefined, lookup, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, service);
    return app;
  }

  function quotationService(overrides: Partial<QuotationService> = {}): QuotationService {
    return {
      listQuotations: async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }),
      createDraftQuotation: async () => quotation,
      ...overrides,
    } as QuotationService;
  }

  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("lists owned quotation summaries with query filters and documented metadata", async () => {
    const summary = {
      id: "quotation-a", quotationNumber: "QT-000001", projectId: "project-a", version: 1, status: "FINAL" as const,
      clientName: "Client A", projectName: "Website", finalPrice: 7_930_000, createdAt: new Date("2026-10-14T00:00:00.000Z"),
    };
    const listQuotations = vi.fn(async () => ({ data: [summary], meta: { page: 2, pageSize: 10, total: 11, totalPages: 2 } }));
    const response = await createTestApp(quotationService({ listQuotations })).inject({
      method: "GET", url: "/api/quotations?page=2&pageSize=10&search=Client&status=FINAL&projectId=project-a&sort=finalPrice&order=asc", headers: headers(),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [{ ...summary, createdAt: "2026-10-14T00:00:00.000Z" }], meta: { page: 2, pageSize: 10, total: 11, totalPages: 2 } });
    expect(listQuotations).toHaveBeenCalledWith("user-a", { page: 2, pageSize: 10, search: "Client", status: "FINAL", projectId: "project-a", sort: "finalPrice", order: "asc" });
  });

  it("requires authentication to list quotations", async () => {
    const listQuotations = vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }));
    const response = await createTestApp(quotationService({ listQuotations }), false).inject({ method: "GET", url: "/api/quotations" });
    expect(response.statusCode).toBe(401);
    expect(listQuotations).not.toHaveBeenCalled();
  });

  it("rejects invalid status, sort, order, pagination, and unknown query parameters", async () => {
    const listQuotations = vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }));
    const testApp = createTestApp(quotationService({ listQuotations }));
    const responses = await Promise.all([
      testApp.inject({ method: "GET", url: "/api/quotations?status=ACCEPTED", headers: headers() }),
      testApp.inject({ method: "GET", url: "/api/quotations?sort=project.userId", headers: headers() }),
      testApp.inject({ method: "GET", url: "/api/quotations?order=sideways", headers: headers() }),
      testApp.inject({ method: "GET", url: "/api/quotations?page=0", headers: headers() }),
      testApp.inject({ method: "GET", url: "/api/quotations?pageSize=101", headers: headers() }),
      testApp.inject({ method: "GET", url: "/api/quotations?unexpected=true", headers: headers() }),
    ]);
    expect(responses.map((response) => response.statusCode)).toEqual([400, 400, 400, 400, 400, 400]);
    expect(listQuotations).not.toHaveBeenCalled();
  });

  it("returns the documented not found error for a foreign project filter", async () => {
    const listQuotations = vi.fn(async () => { throw new QuotationProjectFilterNotFoundError(); });
    const response = await createTestApp(quotationService({ listQuotations })).inject({ method: "GET", url: "/api/quotations?projectId=foreign-project", headers: headers() });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("PROJECT_NOT_FOUND");
  });

  it("creates a DRAFT quotation with the API Contract response", async () => {
    const createDraftQuotation = vi.fn(async () => quotation);
    const response = await createTestApp(quotationService({ createDraftQuotation })).inject({
      method: "POST",
      url: "/api/projects/project-a/quotations",
      headers: headers(),
      payload: {},
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ data: {
      ...quotation,
      createdAt: "2026-10-14T00:00:00.000Z",
    } });
    expect(response.json().data.status).toBe("DRAFT");
    expect(createDraftQuotation).toHaveBeenCalledWith("user-a", "project-a");
  });

  it("rejects an unauthenticated request", async () => {
    const createDraftQuotation = vi.fn(async () => quotation);
    const response = await createTestApp(quotationService({ createDraftQuotation }), false).inject({
      method: "POST",
      url: "/api/projects/project-a/quotations",
      payload: {},
    });

    expect(response.statusCode).toBe(401);
    expect(createDraftQuotation).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or foreign project", async () => {
    const createDraftQuotation = vi.fn(async () => { throw new QuotationProjectNotFoundError(); });
    const response = await createTestApp(quotationService({ createDraftQuotation })).inject({
      method: "POST",
      url: "/api/projects/foreign-project/quotations",
      headers: headers(),
      payload: {},
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("PROJECT_NOT_FOUND");
    expect(createDraftQuotation).toHaveBeenCalledWith("user-a", "foreign-project");
  });

  it("returns 409 when the project already has a DRAFT quotation", async () => {
    const createDraftQuotation = vi.fn(async () => { throw new DraftQuotationAlreadyExistsError(); });
    const response = await createTestApp(quotationService({ createDraftQuotation })).inject({
      method: "POST",
      url: "/api/projects/project-a/quotations",
      headers: headers(),
      payload: {},
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("DRAFT_QUOTATION_EXISTS");
  });

  it("does not accept a client supplied quotation status", async () => {
    const createDraftQuotation = vi.fn(async () => quotation);
    const response = await createTestApp(quotationService({ createDraftQuotation })).inject({
      method: "POST",
      url: "/api/projects/project-a/quotations",
      headers: headers(),
      payload: { status: "FINAL" },
    });

    expect(response.statusCode).toBe(400);
    expect(createDraftQuotation).not.toHaveBeenCalled();
  });

  it("recalculates a draft and returns the same summary shape", async () => {
    const recalculateDraftQuotation = vi.fn(async () => quotation);
    const response = await createTestApp(quotationService({ recalculateDraftQuotation })).inject({
      method: "POST",
      url: "/api/quotations/quotation-a/recalculate",
      headers: headers(),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { ...quotation, createdAt: "2026-10-14T00:00:00.000Z" } });
    expect(recalculateDraftQuotation).toHaveBeenCalledWith("user-a", "quotation-a");
  });

  it("rejects unauthenticated recalculation", async () => {
    const recalculateDraftQuotation = vi.fn(async () => quotation);
    const response = await createTestApp(quotationService({ recalculateDraftQuotation }), false).inject({ method: "POST", url: "/api/quotations/quotation-a/recalculate" });
    expect(response.statusCode).toBe(401);
    expect(recalculateDraftQuotation).not.toHaveBeenCalled();
  });

  it("masks missing or foreign quotations as 404", async () => {
    const recalculateDraftQuotation = vi.fn(async () => { throw new QuotationNotFoundError(); });
    const response = await createTestApp(quotationService({ recalculateDraftQuotation })).inject({ method: "POST", url: "/api/quotations/foreign-id/recalculate", headers: headers() });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("QUOTATION_NOT_FOUND");
  });

  it("returns the documented finalized error", async () => {
    const recalculateDraftQuotation = vi.fn(async () => { throw new QuotationFinalizedError(); });
    const response = await createTestApp(quotationService({ recalculateDraftQuotation })).inject({ method: "POST", url: "/api/quotations/quotation-a/recalculate", headers: headers() });
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("QUOTATION_FINALIZED");
  });

  it("returns all quotation detail categories from stored snapshots", async () => {
    const getQuotationDetail = vi.fn(async () => quotationDetail);
    const response = await createTestApp(quotationService({ getQuotationDetail })).inject({
      method: "GET",
      url: "/api/quotations/quotation-a",
      headers: headers(),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: quotationDetail });
    expect(getQuotationDetail).toHaveBeenCalledWith("user-a", "quotation-a");
  });

  it("rejects unauthenticated quotation detail requests", async () => {
    const getQuotationDetail = vi.fn(async () => quotationDetail);
    const response = await createTestApp(quotationService({ getQuotationDetail }), false).inject({ method: "GET", url: "/api/quotations/quotation-a" });
    expect(response.statusCode).toBe(401);
    expect(getQuotationDetail).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or foreign quotation detail", async () => {
    const getQuotationDetail = vi.fn(async () => { throw new QuotationDetailNotFoundError(); });
    const response = await createTestApp(quotationService({ getQuotationDetail })).inject({ method: "GET", url: "/api/quotations/foreign-or-missing", headers: headers() });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("QUOTATION_NOT_FOUND");
  });
});
