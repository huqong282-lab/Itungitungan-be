import type { FeatureRepository } from "./repository.js";
import type { FeatureCreateInput, FeatureListQuery, FeatureListResult, FeatureOptionInput, FeatureOptionUpdateInput, FeatureOptionValueInput, FeatureOptionValueUpdateInput, FeatureStatusInput, FeatureUpdateInput, ResolvedFeatureListQuery } from "./types.js";
import { FeatureNotFoundError, FeatureOptionNotFoundError, FeatureOptionValueNotFoundError } from "./types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function createFeatureService(repository: FeatureRepository) {
  return {
    async listFeatures(userId: string, query: FeatureListQuery): Promise<FeatureListResult> {
      const resolvedQuery: ResolvedFeatureListQuery = {
        page: query.page ?? DEFAULT_PAGE,
        pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
        ...(query.search !== undefined && { search: query.search }),
        ...(query.category !== undefined && { category: query.category }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      };
      const { data, total } = await repository.listByUserId(userId, resolvedQuery);
      return {
        data,
        meta: {
          page: resolvedQuery.page,
          pageSize: resolvedQuery.pageSize,
          total,
          totalPages: Math.ceil(total / resolvedQuery.pageSize),
        },
      };
    },
    async getFeature(userId: string, id: string) {
      const feature = await repository.findByIdAndUserId(id, userId);
      if (!feature) throw new FeatureNotFoundError();
      return feature;
    },
    async createFeature(userId: string, input: FeatureCreateInput) {
      return await repository.createForUser(userId, input);
    },
    async createFeatureOption(userId: string, featureId: string, input: FeatureOptionInput) {
      const option = await repository.createOptionForOwnedFeature(featureId, userId, input);
      if (!option) throw new FeatureNotFoundError();
      return option;
    },
    async updateFeatureOption(userId: string, featureId: string, optionId: string, input: FeatureOptionUpdateInput) {
      const option = await repository.updateOptionOwnedByFeature(featureId, optionId, userId, input);
      if (!option) throw new FeatureOptionNotFoundError();
      return option;
    },
    async createFeatureOptionValue(userId: string, featureId: string, optionId: string, input: FeatureOptionValueInput) {
      const value = await repository.createOptionValueForOwnedOption(featureId, optionId, userId, input);
      if (!value) throw new FeatureOptionNotFoundError();
      return value;
    },
    async updateFeatureOptionValue(userId: string, featureId: string, optionId: string, valueId: string, input: FeatureOptionValueUpdateInput) {
      const value = await repository.updateOptionValueOwnedByOption(featureId, optionId, valueId, userId, input);
      if (!value) throw new FeatureOptionValueNotFoundError();
      return value;
    },
    async updateFeature(userId: string, id: string, input: FeatureUpdateInput) {
      const feature = await repository.updateOwned(id, userId, input);
      if (!feature) throw new FeatureNotFoundError();
      return feature;
    },
    async updateFeatureStatus(userId: string, id: string, input: FeatureStatusInput) {
      const feature = await repository.updateStatusOwned(id, userId, input);
      if (!feature) throw new FeatureNotFoundError();
      return feature;
    },
  };
}

export type FeatureService = ReturnType<typeof createFeatureService>;
