import type { DesignRepository } from "./repository.js";
import type { DesignCreateInput, DesignListQuery, DesignListResult, DesignStatusInput, DesignUpdateInput, ResolvedDesignListQuery } from "./types.js";
import { DesignNotFoundError } from "./types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function createDesignService(repository: DesignRepository) {
  return {
    async listDesigns(userId: string, query: DesignListQuery): Promise<DesignListResult> {
      const resolvedQuery: ResolvedDesignListQuery = {
        page: query.page ?? DEFAULT_PAGE,
        pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
        ...(query.search !== undefined && { search: query.search }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      };
      const { data, total } = await repository.listByUserId(userId, resolvedQuery);
      return {
        data,
        meta: { page: resolvedQuery.page, pageSize: resolvedQuery.pageSize, total, totalPages: Math.ceil(total / resolvedQuery.pageSize) },
      };
    },
    async getDesign(userId: string, id: string) {
      const design = await repository.findByIdAndUserId(id, userId);
      if (!design) throw new DesignNotFoundError();
      return design;
    },
    async createDesign(userId: string, input: DesignCreateInput) {
      return repository.createForUser(userId, input);
    },
    async updateDesign(userId: string, id: string, input: DesignUpdateInput) {
      const design = await repository.updateOwned(id, userId, input);
      if (!design) throw new DesignNotFoundError();
      return design;
    },
    async updateDesignStatus(userId: string, id: string, input: DesignStatusInput) {
      const design = await repository.updateStatusOwned(id, userId, input);
      if (!design) throw new DesignNotFoundError();
      return design;
    },
  };
}

export type DesignService = ReturnType<typeof createDesignService>;
