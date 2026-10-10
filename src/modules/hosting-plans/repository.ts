import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { HostingPlanCreateInput, HostingPlanStatusInput, HostingPlanUpdateInput, ResolvedHostingPlanListQuery } from "./types.js";

const hostingPlanSelect = {
  id: true, provider: true, name: true, internalCost: true, clientPrice: true, billingPeriod: true, isActive: true,
} as const;

export function createHostingPlanRepository(prisma: PrismaClient) {
  return {
    async listByUserId(userId: string, query: ResolvedHostingPlanListQuery) {
      const where = buildWhere(userId, query);
      const [data, total] = await Promise.all([
        prisma.hostingPlan.findMany({
          where,
          select: hostingPlanSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.hostingPlan.count({ where }),
      ]);
      return { data, total };
    },
    findByIdAndUserId(id: string, userId: string) {
      return prisma.hostingPlan.findFirst({ where: { id, userId }, select: hostingPlanSelect });
    },
    createForUser(userId: string, input: HostingPlanCreateInput) {
      return prisma.hostingPlan.create({ data: { ...input, userId }, select: hostingPlanSelect });
    },
    async updateOwned(id: string, userId: string, input: HostingPlanUpdateInput) {
      const result = await prisma.hostingPlan.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.hostingPlan.findFirst({ where: { id, userId }, select: hostingPlanSelect });
    },
    async updateStatusOwned(id: string, userId: string, input: HostingPlanStatusInput) {
      const result = await prisma.hostingPlan.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.hostingPlan.findFirst({ where: { id, userId }, select: hostingPlanSelect });
    },
  };
}

function buildWhere(userId: string, query: ResolvedHostingPlanListQuery): Prisma.HostingPlanWhereInput {
  return {
    userId,
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search !== undefined && query.search.length > 0 && {
      OR: [
        { provider: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };
}

export type HostingPlanRepository = ReturnType<typeof createHostingPlanRepository>;
