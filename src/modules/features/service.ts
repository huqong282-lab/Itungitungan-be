import type { FeatureRepository } from "./repository.js";
import type { FeatureCreateInput, FeatureListQuery, FeatureListResult, FeatureStatusInput, FeatureUpdateInput, ResolvedFeatureListQuery } from "./types.js";
import { FeatureNotFoundError } from "./types.js";

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
