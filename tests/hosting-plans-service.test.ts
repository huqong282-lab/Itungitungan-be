import { describe, expect, it, vi } from "vitest";
import type { HostingPlanRepository } from "../src/modules/hosting-plans/repository.js";
import { createHostingPlanService } from "../src/modules/hosting-plans/service.js";
import { HostingPlanNotFoundError } from "../src/modules/hosting-plans/types.js";

const hostingPlan = { id: "hosting-a", provider: "Railway", name: "Hobby", internalCost: 100, clientPrice: 200, billingPeriod: "MONTHLY" as const, isActive: true };

describe("hosting plan service", () => {
  it("applies list defaults and returns pagination metadata", async () => {
    const repository = { listByUserId: vi.fn(async () => ({ data: [hostingPlan], total: 1 })) } as unknown as HostingPlanRepository;
    const result = await createHostingPlanService(repository).listHostingPlans("user-a", {});
    expect(repository.listByUserId).toHaveBeenCalledWith("user-a", { page: 1, pageSize: 20 });
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });
  it("returns not found for missing or unowned records", async () => {
    const repository = {
      findByIdAndUserId: vi.fn(async () => null),
      updateOwned: vi.fn(async () => null),
      updateStatusOwned: vi.fn(async () => null),
    } as unknown as HostingPlanRepository;
    const service = createHostingPlanService(repository);
    await expect(service.getHostingPlan("user-a", "hosting-b")).rejects.toBeInstanceOf(HostingPlanNotFoundError);
    await expect(service.updateHostingPlan("user-a", "hosting-b", { name: "x" })).rejects.toBeInstanceOf(HostingPlanNotFoundError);
    await expect(service.updateHostingPlanStatus("user-a", "hosting-b", { isActive: false })).rejects.toBeInstanceOf(HostingPlanNotFoundError);
  });
});
