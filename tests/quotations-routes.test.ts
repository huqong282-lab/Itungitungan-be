import { afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import type { QuotationService } from "../src/modules/quotations/service.js";
import { DraftQuotationAlreadyExistsError, QuotationProjectNotFoundError } from "../src/modules/quotations/types.js";

const quotation = {
  id: "quotation-a",
  quotationNumber: "QT-000001",
  version: 1,
  status: "DRAFT" as const,
  finalPrice: 7_930_000,
  workingDays: 7,
  createdAt: new Date("2026-10-14T00:00:00.000Z"),
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
    return { createDraftQuotation: async () => quotation, ...overrides };
  }

  const headers = () => ({ cookie: `${env.SESSION_COOKIE_NAME}=valid-session` });

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
});
