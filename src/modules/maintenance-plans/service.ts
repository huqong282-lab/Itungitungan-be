import type { MaintenancePlanRepository } from "./repository.js";
import type { MaintenancePlanCreateInput, MaintenancePlanListQuery, MaintenancePlanListResult, MaintenancePlanStatusInput, MaintenancePlanUpdateInput, ResolvedMaintenancePlanListQuery } from "./types.js";
import { MaintenancePlanNotFoundError } from "./types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
export function createMaintenancePlanService(repository: MaintenancePlanRepository) {
  return {
    async listMaintenancePlans(userId: string, query: MaintenancePlanListQuery): Promise<MaintenancePlanListResult> {
      const resolvedQuery: ResolvedMaintenancePlanListQuery = { page: query.page ?? DEFAULT_PAGE, pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE, ...(query.search !== undefined && { search: query.search }), ...(query.isActive !== undefined && { isActive: query.isActive }) };
      const { data, total } = await repository.listByUserId(userId, resolvedQuery);
      return { data, meta: { page: resolvedQuery.page, pageSize: resolvedQuery.pageSize, total, totalPages: Math.ceil(total / resolvedQuery.pageSize) } };
    },
    async getMaintenancePlan(userId: string, id: string) {
      const plan = await repository.findByIdAndUserId(id, userId);
      if (!plan) throw new MaintenancePlanNotFoundError();
      return plan;
    },
    async createMaintenancePlan(userId: string, input: MaintenancePlanCreateInput) { return await repository.createForUser(userId, input); },
    async updateMaintenancePlan(userId: string, id: string, input: MaintenancePlanUpdateInput) {
      const plan = await repository.updateOwned(id, userId, input);
      if (!plan) throw new MaintenancePlanNotFoundError();
      return plan;
    },
    async updateMaintenancePlanStatus(userId: string, id: string, input: MaintenancePlanStatusInput) {
      const plan = await repository.updateStatusOwned(id, userId, input);
      if (!plan) throw new MaintenancePlanNotFoundError();
      return plan;
    },
  };
}
export type MaintenancePlanService = ReturnType<typeof createMaintenancePlanService>;
