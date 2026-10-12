import { describe, expect, it, vi } from "vitest";
import type { ProjectMaintenanceRepository } from "../src/modules/project-maintenances/repository.js";
import { createProjectMaintenanceService } from "../src/modules/project-maintenances/service.js";
import { ProjectMaintenanceNotFoundError, ProjectMaintenancePlanNotFoundError, ProjectMaintenanceProjectNotFoundError } from "../src/modules/project-maintenances/types.js";

const relation = { id: "relation-a", projectId: "project-a", maintenancePlanId: "plan-a", createdAt: new Date(), updatedAt: new Date() };
function makeRepository(overrides: Partial<ProjectMaintenanceRepository> = {}): ProjectMaintenanceRepository {
  return { findOwnedProject: async () => ({ id: "project-a" }), findMaintenancePlanForUser: async () => ({ id: "plan-a" }), createForProject: async () => relation, deleteOwned: async () => true, ...overrides } as ProjectMaintenanceRepository;
}

describe("project maintenance service", () => {
  it("checks both resource owners and adds distinct plans", async () => {
    const createForProject = vi.fn(async (_projectId: string, input: { maintenancePlanId: string }) => ({ ...relation, maintenancePlanId: input.maintenancePlanId }));
    const service = createProjectMaintenanceService(makeRepository({ createForProject }));
    await service.addMaintenance("user-a", "project-a", { maintenancePlanId: "plan-a" });
    await service.addMaintenance("user-a", "project-a", { maintenancePlanId: "plan-b" });
    expect(createForProject).toHaveBeenCalledTimes(2);
    await expect(createProjectMaintenanceService(makeRepository({ findOwnedProject: async () => null })).addMaintenance("user-a", "foreign", { maintenancePlanId: "plan-a" })).rejects.toBeInstanceOf(ProjectMaintenanceProjectNotFoundError);
    await expect(createProjectMaintenanceService(makeRepository({ findMaintenancePlanForUser: async () => null })).addMaintenance("user-a", "project-a", { maintenancePlanId: "foreign-plan" })).rejects.toBeInstanceOf(ProjectMaintenancePlanNotFoundError);
  });

  it("uses the unique constraint result to reject duplicates and scopes relation deletion", async () => {
    const deleteOwned = vi.fn(async () => true);
    const service = createProjectMaintenanceService(makeRepository({ deleteOwned }));
    await service.removeMaintenance("user-a", "project-a", "relation-a");
    expect(deleteOwned).toHaveBeenCalledWith("project-a", "relation-a", "user-a");
    await expect(createProjectMaintenanceService(makeRepository({ createForProject: async () => { throw new Error("unique constraint"); } })).addMaintenance("user-a", "project-a", { maintenancePlanId: "plan-a" })).rejects.toThrow("unique constraint");
    await expect(createProjectMaintenanceService(makeRepository({ deleteOwned: async () => false })).removeMaintenance("user-a", "project-a", "unrelated")).rejects.toBeInstanceOf(ProjectMaintenanceNotFoundError);
  });
});
