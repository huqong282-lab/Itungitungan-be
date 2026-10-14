import { describe, expect, it, vi } from "vitest";
import { createQuotationService } from "../src/modules/quotations/service.js";
import type { QuotationRepositoryPort } from "../src/modules/quotations/repository.js";
import type { CalculationService } from "../src/modules/calculations/service.js";
import type { CreatedQuotation } from "../src/modules/quotations/types.js";

const calculation = {
  estimatedHours: 44,
  bufferPercentage: 20,
  bufferedHours: 53,
  workingHoursPerDay: 8,
  workingDays: 7,
  deadline: null,
  deadlineStatus: "NORMAL" as const,
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

const snapshot = {
  clientName: "Client A",
  projectName: "Website",
  logoUrl: null,
  deadline: null,
  developerRate: 100_000,
  workingHoursPerDay: 8,
  features: [{ name: "Authentication", baseHours: 40, estimatedHours: 44, developmentCost: 4_400_000, selections: [{ optionName: "Provider", valueLabel: "Custom", hours: 4 }] }],
  design: { name: "Premium UI", price: 1_000_000 },
  hostings: [{ label: "Production", provider: "Cloud", plan: "VPS", internalCost: 150_000, clientPrice: 200_000, clientProvided: false, billingPeriod: "MONTHLY" as const }],
  maintenances: [{ name: "Monthly maintenance", price: 500_000, billingPeriod: "MONTHLY" as const }],
};

const created: CreatedQuotation = {
  id: "quotation-a",
  quotationNumber: "QT-000001",
  version: 1,
  status: "DRAFT",
  finalPrice: 7_930_000,
  workingDays: 7,
  createdAt: new Date("2026-10-14T00:00:00.000Z"),
};

describe("quotation service", () => {
  it("calculates from BE-037 and persists the resulting snapshot", async () => {
    const calculateProjectSnapshot = vi.fn(async () => ({ calculation, snapshot }));
    const createDraftQuotation = vi.fn(async () => created);
    const calculationService = { calculateProjectSnapshot } as unknown as CalculationService;
    const repository: QuotationRepositoryPort = { createDraftQuotation };
    const service = createQuotationService(repository, calculationService);

    await expect(service.createDraftQuotation("user-a", "project-a")).resolves.toBe(created);
    expect(calculateProjectSnapshot).toHaveBeenCalledWith("user-a", "project-a", {});
    expect(createDraftQuotation).toHaveBeenCalledWith("project-a", "user-a", { calculation, snapshot });
  });

  it("does not create a quotation when BE-037 calculation fails", async () => {
    const calculateProjectSnapshot = vi.fn(async () => { throw new Error("Calculation failed"); });
    const createDraftQuotation = vi.fn(async () => created);
    const service = createQuotationService(
      { createDraftQuotation } as QuotationRepositoryPort,
      { calculateProjectSnapshot } as unknown as CalculationService,
    );

    await expect(service.createDraftQuotation("user-a", "project-a")).rejects.toThrow("Calculation failed");
    expect(createDraftQuotation).not.toHaveBeenCalled();
  });
});
