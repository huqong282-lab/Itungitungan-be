import { describe, expect, it, vi } from "vitest";
import type { DesignRepository } from "../src/modules/designs/repository.js";
import { createDesignService } from "../src/modules/designs/service.js";
import { DesignNotFoundError } from "../src/modules/designs/types.js";

const design = { id: "design-a", name: "Premium UI", description: null, price: 100, isActive: true };

describe("design service", () => {
  it("applies pagination defaults and delegates the session owner", async () => {
    const repository = { listByUserId: vi.fn(async () => ({ data: [design], total: 1 })) } as unknown as DesignRepository;
    const result = await createDesignService(repository).listDesigns("user-a", { search: "ui" });
    expect(repository.listByUserId).toHaveBeenCalledWith("user-a", { page: 1, pageSize: 20, search: "ui" });
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });

  it("converts missing owned detail and updates to not found", async () => {
    const repository = {
      findByIdAndUserId: vi.fn(async () => null),
      updateOwned: vi.fn(async () => null),
      updateStatusOwned: vi.fn(async () => null),
    } as unknown as DesignRepository;
    const service = createDesignService(repository);
    await expect(service.getDesign("user-a", "design-b")).rejects.toBeInstanceOf(DesignNotFoundError);
    await expect(service.updateDesign("user-a", "design-b", { name: "x" })).rejects.toBeInstanceOf(DesignNotFoundError);
    await expect(service.updateDesignStatus("user-a", "design-b", { isActive: false })).rejects.toBeInstanceOf(DesignNotFoundError);
  });
});
