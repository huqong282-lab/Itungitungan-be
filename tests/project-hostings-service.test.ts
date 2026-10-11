import { describe, expect, it, vi } from "vitest";
import type { ProjectHostingRepository } from "../src/modules/project-hostings/repository.js";
import { createProjectHostingService } from "../src/modules/project-hostings/service.js";
import { ProjectHostingNotFoundError, ProjectHostingPlanNotFoundError, ProjectHostingProjectNotFoundError, ProjectHostingRuleError } from "../src/modules/project-hostings/types.js";

const hosting = { id: "hosting-a", projectId: "project-a", hostingPlanId: "plan-a", label: "Production", clientProvided: false, createdAt: new Date(), updatedAt: new Date() };
function makeRepository(overrides: Partial<ProjectHostingRepository> = {}): ProjectHostingRepository {
  return { findOwnedProject: async () => ({ id: "project-a" }), findHostingPlanForUser: async () => ({ id: "plan-a", isActive: true }), createForProject: async () => hosting, findOwnedHosting: async () => hosting, updateOwned: async () => hosting, deleteOwned: async () => true, ...overrides } as ProjectHostingRepository;
}

describe("project hosting service", () => {
  it("requires an owned project and validates the selected active plan", async () => {
    await expect(createProjectHostingService(makeRepository({ findOwnedProject: async () => null })).addHosting("user-a", "foreign", { label: "Production", hostingPlanId: "plan-a", clientProvided: false })).rejects.toBeInstanceOf(ProjectHostingProjectNotFoundError);
    await expect(createProjectHostingService(makeRepository({ findHostingPlanForUser: async () => null })).addHosting("user-a", "project-a", { label: "Production", hostingPlanId: "foreign", clientProvided: false })).rejects.toBeInstanceOf(ProjectHostingPlanNotFoundError);
    await expect(createProjectHostingService(makeRepository({ findHostingPlanForUser: async () => ({ id: "plan-a", isActive: false }) })).addHosting("user-a", "project-a", { label: "Production", hostingPlanId: "plan-a", clientProvided: false })).rejects.toBeInstanceOf(ProjectHostingRuleError);
  });

  it("enforces the chosen clientProvided/plan rule and accepts multiple hosted entries", async () => {
    const createForProject = vi.fn(async () => hosting);
    const service = createProjectHostingService(makeRepository({ createForProject }));
    await service.addHosting("user-a", "project-a", { label: "Production", hostingPlanId: "plan-a", clientProvided: false });
    await service.addHosting("user-a", "project-a", { label: "Client Staging", hostingPlanId: null, clientProvided: true });
    expect(createForProject).toHaveBeenCalledTimes(2);
    await expect(service.addHosting("user-a", "project-a", { label: "Bad client", hostingPlanId: "plan-a", clientProvided: true })).rejects.toBeInstanceOf(ProjectHostingRuleError);
    await expect(service.addHosting("user-a", "project-a", { label: "Missing plan", hostingPlanId: null, clientProvided: false })).rejects.toBeInstanceOf(ProjectHostingRuleError);
  });

  it("validates PATCH against the resulting hosting state and scopes update/delete", async () => {
    const updateOwned = vi.fn(async () => hosting);
    const deleteOwned = vi.fn(async () => true);
    const service = createProjectHostingService(makeRepository({ updateOwned, deleteOwned }));
    await service.updateHosting("user-a", "project-a", "hosting-a", { label: "Staging" });
    expect(updateOwned).toHaveBeenCalledWith("project-a", "hosting-a", "user-a", { label: "Staging" });
    await expect(service.updateHosting("user-a", "project-a", "hosting-a", { clientProvided: true })).rejects.toBeInstanceOf(ProjectHostingRuleError);
    await service.updateHosting("user-a", "project-a", "hosting-a", { clientProvided: true, hostingPlanId: null });
    await service.removeHosting("user-a", "project-a", "hosting-a");
    expect(deleteOwned).toHaveBeenCalledWith("project-a", "hosting-a", "user-a");
    await expect(createProjectHostingService(makeRepository({ findOwnedHosting: async () => null })).updateHosting("user-a", "project-a", "other", { label: "x" })).rejects.toBeInstanceOf(ProjectHostingNotFoundError);
    await expect(createProjectHostingService(makeRepository({ deleteOwned: async () => false })).removeHosting("user-a", "project-a", "other")).rejects.toBeInstanceOf(ProjectHostingNotFoundError);
  });
});
