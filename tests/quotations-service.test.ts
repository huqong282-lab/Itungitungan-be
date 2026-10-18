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

  it("recalculates an owned draft using its project and the BE-037 snapshot", async () => {
    const findQuotationForRecalculation = vi.fn(async () => ({ projectId: "project-a", status: "DRAFT" as const }));
    const recalculateDraftQuotation = vi.fn(async () => created);
    const calculateProjectSnapshot = vi.fn(async () => ({ calculation, snapshot }));
    const service = createQuotationService(
      { createDraftQuotation: async () => created, findQuotationForRecalculation, recalculateDraftQuotation },
      { calculateProjectSnapshot } as unknown as CalculationService,
    );

    await expect(service.recalculateDraftQuotation("user-a", "quotation-a")).resolves.toBe(created);
    expect(findQuotationForRecalculation).toHaveBeenCalledWith("quotation-a", "user-a");
    expect(calculateProjectSnapshot).toHaveBeenCalledWith("user-a", "project-a", {});
    expect(recalculateDraftQuotation).toHaveBeenCalledWith("quotation-a", "user-a", { calculation, snapshot });
  });

  it("rejects FINAL quotations before recalculation", async () => {
    const recalculateDraftQuotation = vi.fn(async () => created);
    const calculateProjectSnapshot = vi.fn(async () => ({ calculation, snapshot }));
    const service = createQuotationService(
      { createDraftQuotation: async () => created, findQuotationForRecalculation: async () => ({ projectId: "project-a", status: "FINAL" }), recalculateDraftQuotation },
      { calculateProjectSnapshot } as unknown as CalculationService,
    );

    await expect(service.recalculateDraftQuotation("user-a", "quotation-a")).rejects.toThrow("Final quotations cannot be modified.");
    expect(calculateProjectSnapshot).not.toHaveBeenCalled();
    expect(recalculateDraftQuotation).not.toHaveBeenCalled();
  });

  it("maps quotation snapshot fields into detail without running a calculation", async () => {
    const persisted = {
      id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "DRAFT",
      clientNameSnapshot: "Snapshot Client", projectNameSnapshot: "Snapshot Project", logoUrlSnapshot: null,
      deadlineSnapshot: null, developerRateSnapshot: 100_000, workingHoursPerDaySnapshot: 8,
      developmentHours: 12, bufferPercentage: { toNumber: () => 20 }, bufferedHours: 15, workingDays: 2,
      developmentCost: 1_200_000, designCost: 300_000, hostingCost: 100_000, maintenanceCost: 200_000,
      subtotal: 1_800_000, marginPercentage: { toNumber: () => 30 }, marginAmount: 540_000,
      rushFeePercentage: { toNumber: () => 10 }, rushFeeAmount: 234_000,
      freeRevisionCount: 2, additionalRevisionPrice: 50_000, finalPrice: 2_574_000,
      finalizedAt: null, createdAt: new Date("2026-10-14T00:00:00.000Z"), updatedAt: new Date("2026-10-15T00:00:00.000Z"),
      features: [{ featureNameSnapshot: "Snapshot Feature", baseHoursSnapshot: 10, estimatedHours: 12, developerRateSnapshot: 100_000, developmentCost: 1_200_000,
        selections: [{ optionNameSnapshot: "Snapshot Option", valueLabelSnapshot: "Snapshot Value", hoursSnapshot: 2 }] }],
      design: { nameSnapshot: "Snapshot Design", priceSnapshot: 300_000 },
      hostings: [{ labelSnapshot: "Snapshot Hosting", providerSnapshot: "Snapshot Provider", planSnapshot: "Snapshot Plan", internalCostSnapshot: 70_000, clientPriceSnapshot: 100_000, clientProvided: false, billingPeriodSnapshot: "YEARLY" }],
      maintenances: [{ nameSnapshot: "Snapshot Maintenance", priceSnapshot: 200_000, billingPeriodSnapshot: "MONTHLY" }],
    };
    const findQuotationDetail = vi.fn(async () => persisted);
    const calculateProjectSnapshot = vi.fn(async () => ({ calculation, snapshot }));
    const service = createQuotationService(
      { createDraftQuotation: async () => created, findQuotationForRecalculation: async () => null, recalculateDraftQuotation: async () => null, findQuotationDetail },
      { calculateProjectSnapshot } as unknown as CalculationService,
    );

    await expect(service.getQuotationDetail("user-a", "quotation-a")).resolves.toEqual({
      header: {
        id: "quotation-a", quotationNumber: "QT-000001", version: 1, status: "DRAFT", clientName: "Snapshot Client", projectName: "Snapshot Project",
        logoUrl: null, deadline: null, developerRate: 100_000, finalizedAt: null,
        createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-15T00:00:00.000Z",
      },
      features: [{ name: "Snapshot Feature", baseHours: 10, estimatedHours: 12, developerRate: 100_000, developmentCost: 1_200_000,
        selections: [{ optionName: "Snapshot Option", valueLabel: "Snapshot Value", hours: 2 }] }],
      design: { name: "Snapshot Design", price: 300_000 },
      hostings: [{ label: "Snapshot Hosting", provider: "Snapshot Provider", plan: "Snapshot Plan", internalCost: 70_000, clientPrice: 100_000, clientProvided: false, billingPeriod: "YEARLY" }],
      maintenances: [{ name: "Snapshot Maintenance", price: 200_000, billingPeriod: "MONTHLY" }],
      timeline: { estimatedHours: 12, bufferPercentage: 20, bufferedHours: 15, workingHoursPerDay: 8, workingDays: 2 },
      pricing: {
        developmentCost: 1_200_000, designCost: 300_000, hostingCost: 100_000, maintenanceCost: 200_000, subtotal: 1_800_000,
        marginPercentage: 30, marginAmount: 540_000, rushFeePercentage: 10, rushFeeAmount: 234_000, finalPrice: 2_574_000,
      },
      revisionPolicy: { freeRevisionCount: 2, additionalRevisionPrice: 50_000 },
    });
    expect(findQuotationDetail).toHaveBeenCalledWith("quotation-a", "user-a");
    expect(calculateProjectSnapshot).not.toHaveBeenCalled();
  });

  it("returns not found for a missing or foreign quotation detail", async () => {
    const service = createQuotationService(
      { createDraftQuotation: async () => created, findQuotationForRecalculation: async () => null, recalculateDraftQuotation: async () => null, findQuotationDetail: async () => null },
      { calculateProjectSnapshot: vi.fn() } as unknown as CalculationService,
    );
    await expect(service.getQuotationDetail("user-a", "foreign-or-missing")).rejects.toThrow("Quotation not found");
  });
});
