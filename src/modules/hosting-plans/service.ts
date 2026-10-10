import type { HostingPlanRepository } from "./repository.js";
import type { HostingPlanCreateInput, HostingPlanListQuery, HostingPlanListResult, HostingPlanStatusInput, HostingPlanUpdateInput, ResolvedHostingPlanListQuery } from "./types.js";
import { HostingPlanNotFoundError } from "./types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function createHostingPlanService(repository: HostingPlanRepository) {
  return {
    async listHostingPlans(userId: string, query: HostingPlanListQuery): Promise<HostingPlanListResult> {
      const resolvedQuery: ResolvedHostingPlanListQuery = {
        page: query.page ?? DEFAULT_PAGE,
        pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
        ...(query.search !== undefined && { search: query.search }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      };
      const { data, total } = await repository.listByUserId(userId, resolvedQuery);
      return { data, meta: { page: resolvedQuery.page, pageSize: resolvedQuery.pageSize, total, totalPages: Math.ceil(total / resolvedQuery.pageSize) } };
    },
    async getHostingPlan(userId: string, id: string) {
      const hostingPlan = await repository.findByIdAndUserId(id, userId);
      if (!hostingPlan) throw new HostingPlanNotFoundError();
      return hostingPlan;
    },
    async createHostingPlan(userId: string, input: HostingPlanCreateInput) {
      return repository.createForUser(userId, input);
    },
    async updateHostingPlan(userId: string, id: string, input: HostingPlanUpdateInput) {
      const hostingPlan = await repository.updateOwned(id, userId, input);
      if (!hostingPlan) throw new HostingPlanNotFoundError();
      return hostingPlan;
    },
    async updateHostingPlanStatus(userId: string, id: string, input: HostingPlanStatusInput) {
      const hostingPlan = await repository.updateStatusOwned(id, userId, input);
      if (!hostingPlan) throw new HostingPlanNotFoundError();
      return hostingPlan;
    },
  };
}

export type HostingPlanService = ReturnType<typeof createHostingPlanService>;
