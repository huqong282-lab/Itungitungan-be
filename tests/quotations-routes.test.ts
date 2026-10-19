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

function extractUncompressedPdfText(payload: Buffer): string {
  return [...payload.toString("latin1").matchAll(/BT([\s\S]*?)ET/g)]
    .map(([, textObject]) => [...textObject!.matchAll(/<([0-9a-f]{2,})>/gi)]
      .map(([, hexadecimal]) => Buffer.from(hexadecimal!, "hex"))
      .reduce((text, bytes) => Buffer.concat([text, bytes]), Buffer.alloc(0))
      .toString("latin1"))
    .join(" ");
}

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
      finalizeQuotation: async () => ({ id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "FINAL", finalizedAt: new Date("2026-10-14T00:00:00.000Z") }),
      createDraftQuotation: async () => quotation,
      ...overrides,
    } as QuotationService;
  }

  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

  it("finalizes a DRAFT quotation and returns the documented response", async () => {
    const finalized = { id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "FINAL" as const, finalizedAt: new Date("2026-10-19T00:00:00.000Z") };
    const finalizeQuotation = vi.fn(async () => finalized);
    const response = await createTestApp(quotationService({ finalizeQuotation })).inject({
      method: "POST", url: "/api/quotations/quotation-a/finalize", headers: headers(),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { ...finalized, finalizedAt: "2026-10-19T00:00:00.000Z" } });
    expect(finalizeQuotation).toHaveBeenCalledWith("user-a", "quotation-a");
  });

  it("rejects finalizing an already FINAL quotation", async () => {
    const finalizeQuotation = vi.fn(async () => { throw new QuotationFinalizedError(); });
    const response = await createTestApp(quotationService({ finalizeQuotation })).inject({
      method: "POST", url: "/api/quotations/quotation-a/finalize", headers: headers(),
    });
    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({ error: { code: "QUOTATION_FINALIZED", message: "Final quotations cannot be modified." } });
  });

  it("rejects unauthenticated finalization without calling the service", async () => {
    const finalizeQuotation = vi.fn(async () => quotationService().finalizeQuotation("user-a", "quotation-a"));
    const response = await createTestApp(quotationService({ finalizeQuotation }), false).inject({
      method: "POST", url: "/api/quotations/quotation-a/finalize",
    });
    expect(response.statusCode).toBe(401);
    expect(finalizeQuotation).not.toHaveBeenCalled();
  });

  it("masks foreign and missing quotations as not found", async () => {
    const finalizeQuotation = vi.fn(async () => { throw new QuotationNotFoundError(); });
    const response = await createTestApp(quotationService({ finalizeQuotation })).inject({
      method: "POST", url: "/api/quotations/foreign-or-missing/finalize", headers: headers(),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: { code: "QUOTATION_NOT_FOUND", message: "Quotation not found" } });
  });

  it("rejects an empty quotation identifier using the standard parameter validation", async () => {
    const finalizeQuotation = vi.fn(async () => quotationService().finalizeQuotation("user-a", " "));
    const response = await createTestApp(quotationService({ finalizeQuotation })).inject({
      method: "POST", url: "/api/quotations/%20/finalize", headers: headers(),
    });
    expect(response.statusCode).toBe(400);
    expect(finalizeQuotation).not.toHaveBeenCalled();
  });

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

  it("rejects unauthenticated PDF requests before reading quotation data", async () => {
    const getQuotationDetail = vi.fn(async () => quotationDetail);
    const response = await createTestApp(quotationService({ getQuotationDetail }), false).inject({
      method: "GET", url: "/api/quotations/quotation-a/pdf",
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe("UNAUTHORIZED");
    expect(getQuotationDetail).not.toHaveBeenCalled();
  });

  it.each(["DRAFT", "FINAL"] as const)("returns a snapshot PDF for a %s quotation", async (status) => {
    const snapshot = structuredClone(quotationDetail);
    snapshot.header.status = status;
    snapshot.header.finalizedAt = status === "FINAL" ? "2026-10-19T00:00:00.000Z" : null;
    const originalSnapshot = structuredClone(snapshot);
    const liveCatalog = { featureName: "Live Catalog Feature", price: 999_000_000 };
    const getQuotationDetail = vi.fn(async () => snapshot);
    const response = await createTestApp(quotationService({ getQuotationDetail })).inject({
      method: "GET", url: "/api/quotations/quotation-a/pdf", headers: headers(),
    });
    liveCatalog.featureName = "Changed Catalog Feature";

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["content-disposition"]).toBe('attachment; filename="quotation-QT-000001-v1.pdf"');
    expect(response.rawPayload.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    const pdfText = extractUncompressedPdfText(response.rawPayload);
    expect(pdfText).toContain("QT-000001");
    expect(pdfText).toContain("Versi 1");
    expect(pdfText).toContain("Snapshot Feature");
    expect(pdfText).toContain("2.574.000");
    expect(pdfText).not.toContain("Live Catalog Feature");
    expect(pdfText).not.toContain("Changed Catalog Feature");
    expect(pdfText).not.toContain("70.000"); // internal hosting cost is not client-facing
    expect(snapshot).toEqual(originalSnapshot);
    expect(getQuotationDetail).toHaveBeenCalledExactlyOnceWith("user-a", "quotation-a");
  });

  it("masks missing and foreign PDF quotations as not found", async () => {
    const getQuotationDetail = vi.fn(async () => { throw new QuotationDetailNotFoundError(); });
    const response = await createTestApp(quotationService({ getQuotationDetail })).inject({
      method: "GET", url: "/api/quotations/foreign-or-missing/pdf", headers: headers(),
    });
    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("QUOTATION_NOT_FOUND");
    expect(getQuotationDetail).toHaveBeenCalledWith("user-a", "foreign-or-missing");
  });

  it("sanitizes the download name and paginates long snapshot text", async () => {
    const longQuotation = structuredClone(quotationDetail);
    longQuotation.header.quotationNumber = 'QT/"unsafe\\name';
    longQuotation.features = Array.from({ length: 30 }, (_, index) => ({
      ...quotationDetail.features[0]!,
      name: `Feature ${index + 1} ${"Long snapshot detail ".repeat(18)}`,
    }));
    const response = await createTestApp(quotationService({ getQuotationDetail: async () => longQuotation })).inject({
      method: "GET", url: "/api/quotations/quotation-a/pdf", headers: headers(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-disposition"]).toBe('attachment; filename="quotation-QT-unsafe-name-v1.pdf"');
    expect(response.rawPayload.toString("latin1").match(/\/Type \/Page\b/g)?.length).toBeGreaterThan(1);
  });
});
