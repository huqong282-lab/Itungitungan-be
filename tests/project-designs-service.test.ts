import { describe, expect, it, vi } from "vitest";
import type { ProjectDesignRepository } from "../src/modules/project-designs/repository.js";
import { createProjectDesignService } from "../src/modules/project-designs/service.js";
import { ProjectDesignNotFoundError, ProjectDesignRuleError } from "../src/modules/project-designs/types.js";

const assignment = { id: "pd-a", projectId: "p-a", designId: "d-a", createdAt: new Date(), updatedAt: new Date() };
function makeRepository(overrides: Partial<ProjectDesignRepository> = {}): ProjectDesignRepository {
  return { findOwnedProject: async () => ({ id: "p-a" }), findDesignForUser: async () => ({ id: "d-a", isActive: true }), setForProject: async () => assignment, removeFromOwnedProject: async () => true, ...overrides } as ProjectDesignRepository;
}

describe("project design service", () => {
  it("checks project ownership and design ownership before setting the relation", async () => {
    const findOwnedProject = vi.fn(async () => ({ id: "p-a" }));
    const findDesignForUser = vi.fn(async () => ({ id: "d-a", isActive: true }));
    const setForProject = vi.fn(async () => assignment);
    const repository = makeRepository({ findOwnedProject, findDesignForUser, setForProject });
    await createProjectDesignService(repository).setDesign("u-a", "p-a", { designId: "d-a" });
    expect(findOwnedProject).toHaveBeenCalledWith("p-a", "u-a");
    expect(findDesignForUser).toHaveBeenCalledWith("d-a", "u-a");
    expect(setForProject).toHaveBeenCalledWith("p-a", "d-a");
  });

  it("returns 404 for unowned project/design and 422 for an inactive owned design", async () => {
    await expect(createProjectDesignService(makeRepository({ findOwnedProject: async () => null })).setDesign("u-a", "foreign", { designId: "d-a" })).rejects.toBeInstanceOf(ProjectDesignNotFoundError);
    await expect(createProjectDesignService(makeRepository({ findDesignForUser: async () => null })).setDesign("u-a", "p-a", { designId: "foreign" })).rejects.toBeInstanceOf(ProjectDesignNotFoundError);
    await expect(createProjectDesignService(makeRepository({ findDesignForUser: async () => ({ id: "d-a", isActive: false }) })).setDesign("u-a", "p-a", { designId: "d-a" })).rejects.toBeInstanceOf(ProjectDesignRuleError);
  });

  it("requires an existing owned assignment before removing it", async () => {
    const removeFromOwnedProject = vi.fn(async () => true);
    const service = createProjectDesignService(makeRepository({ removeFromOwnedProject }));
    await service.removeDesign("u-a", "p-a");
    expect(removeFromOwnedProject).toHaveBeenCalledWith("p-a", "u-a");
    await expect(createProjectDesignService(makeRepository({ removeFromOwnedProject: async () => false })).removeDesign("u-a", "p-b")).rejects.toBeInstanceOf(ProjectDesignNotFoundError);
  });
});
