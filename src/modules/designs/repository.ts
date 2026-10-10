import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { DesignCreateInput, DesignStatusInput, DesignUpdateInput, ResolvedDesignListQuery } from "./types.js";

const designSelect = { id: true, name: true, description: true, price: true, isActive: true } as const;

export function createDesignRepository(prisma: PrismaClient) {
  return {
    async listByUserId(userId: string, query: ResolvedDesignListQuery) {
      const where = buildWhere(userId, query);
      const [data, total] = await Promise.all([
        prisma.design.findMany({
          where,
          select: designSelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.design.count({ where }),
      ]);
      return { data, total };
    },
    findByIdAndUserId(id: string, userId: string) {
      return prisma.design.findFirst({ where: { id, userId }, select: designSelect });
    },
    createForUser(userId: string, input: DesignCreateInput) {
      return prisma.design.create({ data: { ...input, userId }, select: designSelect });
    },
    async updateOwned(id: string, userId: string, input: DesignUpdateInput) {
      const result = await prisma.design.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.design.findFirst({ where: { id, userId }, select: designSelect });
    },
    async updateStatusOwned(id: string, userId: string, input: DesignStatusInput) {
      const result = await prisma.design.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.design.findFirst({ where: { id, userId }, select: designSelect });
    },
  };
}

function buildWhere(userId: string, query: ResolvedDesignListQuery): Prisma.DesignWhereInput {
  return {
    userId,
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search !== undefined && query.search.length > 0 && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };
}

export type DesignRepository = ReturnType<typeof createDesignRepository>;
