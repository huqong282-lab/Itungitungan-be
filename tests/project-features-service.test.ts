import { describe, expect, it, vi } from "vitest";
import type { ProjectFeatureRepository } from "../src/modules/project-features/repository.js";
import { createProjectFeatureService } from "../src/modules/project-features/service.js";
import { ProjectFeatureConflictError, ProjectFeatureNotFoundError, ProjectFeatureRuleError } from "../src/modules/project-features/types.js";

const pf = { id: "pf-a", projectId: "p-a", featureId: "f-a", overrideHours: null, notes: null, createdAt: new Date(), updatedAt: new Date() };
const context = { id: "pf-a", options: [
  { id: "single", selectionType: "SINGLE" as const, values: [{ id: "s1", isActive: true }, { id: "s2", isActive: true }, { id: "off", isActive: false }] },
  { id: "multi", selectionType: "MULTIPLE" as const, values: [{ id: "m1", isActive: true }, { id: "m2", isActive: true }] },
] };

function makeRepo(overrides: Partial<ProjectFeatureRepository> = {}): ProjectFeatureRepository {
  return {
    findOwnedProject: async () => ({ id: "p-a" }), findFeatureForUser: async () => ({ id: "f-a", isActive: true }), findExistingProjectFeature: async () => null,
    createForProject: async () => pf, updateOwned: async () => pf, deleteOwned: async () => true,
    findSelectionContext: async () => context, replaceSelections: async (_user, _project, _pf, selections) => selections.map((item, index) => ({ id: `s-${index}`, projectFeatureId: "pf-a", ...item, createdAt: new Date(), updatedAt: new Date() })),
    ...overrides,
  } as ProjectFeatureRepository;
}

describe("project feature service", () => {
  it("requires owned project and active owned feature before create and detects duplicates", async () => {
    const repository = makeRepo({ findOwnedProject: async () => null });
    await expect(createProjectFeatureService(repository).addFeature("u-a", "p-b", { featureId: "f-a" })).rejects.toBeInstanceOf(ProjectFeatureNotFoundError);
    const inactiveOrForeign = makeRepo({ findFeatureForUser: async () => null });
    await expect(createProjectFeatureService(inactiveOrForeign).addFeature("u-a", "p-a", { featureId: "f-b" })).rejects.toBeInstanceOf(ProjectFeatureNotFoundError);
    await expect(createProjectFeatureService(makeRepo({ findFeatureForUser: async () => ({ id: "f-a", isActive: false }) })).addFeature("u-a", "p-a", { featureId: "f-a" })).rejects.toBeInstanceOf(ProjectFeatureRuleError);
    const duplicate = makeRepo({ findExistingProjectFeature: async () => ({ id: "existing" }) });
    await expect(createProjectFeatureService(duplicate).addFeature("u-a", "p-a", { featureId: "f-a" })).rejects.toBeInstanceOf(ProjectFeatureConflictError);
  });
  it("maps a concurrent unique violation to a conflict", async () => {
    const service = createProjectFeatureService(makeRepo({ createForProject: async () => { throw { code: "P2002" }; } }));
    await expect(service.addFeature("u-a", "p-a", { featureId: "f-a" })).rejects.toBeInstanceOf(ProjectFeatureConflictError);
  });
  it("updates and deletes only the requested project feature", async () => {
    const updateOwned = vi.fn(async () => pf); const deleteOwned = vi.fn(async () => true);
    const service = createProjectFeatureService(makeRepo({ updateOwned, deleteOwned }));
    await service.updateFeature("u-a", "p-a", "pf-a", { overrideHours: null, notes: "x" });
    await service.removeFeature("u-a", "p-a", "pf-a");
    expect(updateOwned).toHaveBeenCalledWith("p-a", "pf-a", "u-a", { overrideHours: null, notes: "x" });
    expect(deleteOwned).toHaveBeenCalledWith("p-a", "pf-a", "u-a");
    await expect(createProjectFeatureService(makeRepo({ deleteOwned: async () => false })).removeFeature("u-a", "p-a", "pf-b")).rejects.toBeInstanceOf(ProjectFeatureNotFoundError);
  });
  it("enforces option/value relationships, duplicate selections, and SINGLE/MULTIPLE", async () => {
    const replaceSelections = vi.fn(async (_user: string, _project: string, _pf: string, selections: { featureOptionId: string; featureOptionValueId: string }[]) => selections.map((item, index) => ({ id: `s-${index}`, projectFeatureId: "pf-a", ...item, createdAt: new Date(), updatedAt: new Date() })));
    const repo = makeRepo({ replaceSelections }); const service = createProjectFeatureService(repo);
    await expect(service.replaceSelections("u-a", "p-a", "pf-a", [
      { featureOptionId: "single", featureOptionValueId: "s1" },
      { featureOptionId: "multi", featureOptionValueId: "m1" },
      { featureOptionId: "multi", featureOptionValueId: "m2" },
    ])).resolves.toHaveLength(3);
    const cases = [
      [{ featureOptionId: "foreign", featureOptionValueId: "s1" }],
      [{ featureOptionId: "single", featureOptionValueId: "m1" }],
      [{ featureOptionId: "single", featureOptionValueId: "s1" }, { featureOptionId: "single", featureOptionValueId: "s2" }],
      [{ featureOptionId: "multi", featureOptionValueId: "m1" }, { featureOptionId: "multi", featureOptionValueId: "m1" }],
      [{ featureOptionId: "single", featureOptionValueId: "off" }],
    ];
    for (const selections of cases) await expect(service.replaceSelections("u-a", "p-a", "pf-a", selections)).rejects.toBeInstanceOf(ProjectFeatureRuleError);
    expect(replaceSelections).toHaveBeenCalledTimes(1);
  });
  it("does not replace selections if ownership lookup fails", async () => {
    const replaceSelections = vi.fn(async () => []);
    const service = createProjectFeatureService(makeRepo({ findSelectionContext: async () => null, replaceSelections }));
    await expect(service.replaceSelections("u-a", "p-b", "pf-a", [])).rejects.toBeInstanceOf(ProjectFeatureNotFoundError);
    expect(replaceSelections).not.toHaveBeenCalled();
  });
});
