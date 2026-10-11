import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { MaintenancePlanCreateInput, MaintenancePlanStatusInput, MaintenancePlanUpdateInput, ResolvedMaintenancePlanListQuery } from "./types.js";

const maintenancePlanSelect = { id: true, name: true, price: true, billingPeriod: true, isActive: true } as const;

export function createMaintenancePlanRepository(prisma: PrismaClient) {
  return {
    async listByUserId(userId: string, query: ResolvedMaintenancePlanListQuery) {
      const where = buildWhere(userId, query);
      const [data, total] = await Promise.all([
        prisma.maintenancePlan.findMany({ where, select: maintenancePlanSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        prisma.maintenancePlan.count({ where }),
      ]);
      return { data, total };
    },
    findByIdAndUserId(id: string, userId: string) {
      return prisma.maintenancePlan.findFirst({ where: { id, userId }, select: maintenancePlanSelect });
    },
    createForUser(userId: string, input: MaintenancePlanCreateInput) {
      return prisma.maintenancePlan.create({ data: { ...input, userId }, select: maintenancePlanSelect });
    },
    async updateOwned(id: string, userId: string, input: MaintenancePlanUpdateInput) {
      const result = await prisma.maintenancePlan.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.maintenancePlan.findFirst({ where: { id, userId }, select: maintenancePlanSelect });
    },
    async updateStatusOwned(id: string, userId: string, input: MaintenancePlanStatusInput) {
      const result = await prisma.maintenancePlan.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.maintenancePlan.findFirst({ where: { id, userId }, select: maintenancePlanSelect });
    },
  };
}

function buildWhere(userId: string, query: ResolvedMaintenancePlanListQuery): Prisma.MaintenancePlanWhereInput {
  return { userId, ...(query.isActive !== undefined && { isActive: query.isActive }), ...(query.search !== undefined && query.search.length > 0 && { name: { contains: query.search, mode: "insensitive" } }) };
}

export type MaintenancePlanRepository = ReturnType<typeof createMaintenancePlanRepository>;
