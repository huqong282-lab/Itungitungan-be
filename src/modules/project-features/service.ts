import type { ProjectFeatureRepository } from "./repository.js";
import type { ProjectFeatureCreateInput, ProjectFeatureSelectionInput, ProjectFeatureUpdateInput } from "./types.js";
import { ProjectFeatureConflictError, ProjectFeatureNotFoundError, ProjectFeatureRuleError } from "./types.js";

export function createProjectFeatureService(repository: ProjectFeatureRepository) {
  return {
    async addFeature(userId: string, projectId: string, input: ProjectFeatureCreateInput) {
      if (!await repository.findOwnedProject(projectId, userId)) throw new ProjectFeatureNotFoundError();
      const feature = await repository.findFeatureForUser(input.featureId, userId);
      if (!feature) throw new ProjectFeatureNotFoundError();
      if (!feature.isActive) throw new ProjectFeatureRuleError("FEATURE_INACTIVE");
      if (await repository.findExistingProjectFeature(projectId, input.featureId)) throw new ProjectFeatureConflictError();
      try { return await repository.createForProject(projectId, input.featureId); }
      catch (error) {
        if (isUniqueConstraintError(error)) throw new ProjectFeatureConflictError();
        throw error;
      }
    },
    async updateFeature(userId: string, projectId: string, projectFeatureId: string, input: ProjectFeatureUpdateInput) {
      const result = await repository.updateOwned(projectId, projectFeatureId, userId, input);
      if (!result) throw new ProjectFeatureNotFoundError();
      return result;
    },
    async removeFeature(userId: string, projectId: string, projectFeatureId: string) {
      if (!await repository.deleteOwned(projectId, projectFeatureId, userId)) throw new ProjectFeatureNotFoundError();
    },
    async replaceSelections(userId: string, projectId: string, projectFeatureId: string, selections: ProjectFeatureSelectionInput[]) {
      const context = await repository.findSelectionContext(userId, projectId, projectFeatureId);
      if (!context) throw new ProjectFeatureNotFoundError();
      const optionsById = new Map(context.options.map((option) => [option.id, option]));
      const seen = new Set<string>();
      const counts = new Map<string, number>();
      for (const selection of selections) {
        const key = `${selection.featureOptionId}:${selection.featureOptionValueId}`;
        if (seen.has(key)) throw new ProjectFeatureRuleError("DUPLICATE_SELECTION");
        seen.add(key);
        const option = optionsById.get(selection.featureOptionId);
        if (!option) throw new ProjectFeatureRuleError("OPTION_NOT_IN_FEATURE");
        const value = option.values.find((item) => item.id === selection.featureOptionValueId);
        if (!value) throw new ProjectFeatureRuleError("VALUE_NOT_IN_OPTION");
        if (!value.isActive) throw new ProjectFeatureRuleError("VALUE_INACTIVE");
        const count = (counts.get(option.id) ?? 0) + 1;
        counts.set(option.id, count);
        if (option.selectionType === "SINGLE" && count > 1) throw new ProjectFeatureRuleError("SINGLE_OPTION_MULTIPLE_VALUES");
      }
      const result = await repository.replaceSelections(userId, projectId, projectFeatureId, selections);
      if (!result) throw new ProjectFeatureNotFoundError();
      return result;
    },
  };
}
export type ProjectFeatureService = ReturnType<typeof createProjectFeatureService>;

function isUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
