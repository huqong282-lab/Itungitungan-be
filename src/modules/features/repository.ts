import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { FeatureCreateInput, FeatureStatusInput, FeatureUpdateInput, ResolvedFeatureListQuery } from "./types.js";

const featureSummarySelect = {
  id: true,
  name: true,
  description: true,
  category: true,
  baseEstimatedHours: true,
  isActive: true,
} as const;

export function createFeatureRepository(prisma: PrismaClient) {
  return {
    async listByUserId(userId: string, query: ResolvedFeatureListQuery) {
      const where = buildWhere(userId, query);
      const [data, total] = await Promise.all([
        prisma.feature.findMany({
          where,
          select: featureSummarySelect,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.feature.count({ where }),
      ]);
      return { data, total };
    },
    findByIdAndUserId(id: string, userId: string) {
      return prisma.feature.findFirst({
        where: { id, userId },
        select: {
          ...featureSummarySelect,
          options: {
            select: {
              id: true,
              name: true,
              selectionType: true,
              values: {
                select: {
                  id: true,
                  label: true,
                  estimatedHours: true,
                  isDefault: true,
                  isActive: true,
                },
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    },
    createForUser(userId: string, input: FeatureCreateInput) {
      return prisma.feature.create({
        data: { ...input, userId },
        select: featureSummarySelect,
      });
    },
    async updateOwned(id: string, userId: string, input: FeatureUpdateInput) {
      const result = await prisma.feature.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.feature.findFirst({ where: { id, userId }, select: featureSummarySelect });
    },
    async updateStatusOwned(id: string, userId: string, input: FeatureStatusInput) {
      const result = await prisma.feature.updateMany({ where: { id, userId }, data: input });
      if (result.count === 0) return null;
      return prisma.feature.findFirst({ where: { id, userId }, select: { id: true, isActive: true } });
    },
  };
}

function buildWhere(userId: string, query: ResolvedFeatureListQuery): Prisma.FeatureWhereInput {
  return {
    userId,
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.category !== undefined && { category: query.category }),
    ...(query.search !== undefined && query.search.length > 0 && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { category: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };
}

export type FeatureRepository = ReturnType<typeof createFeatureRepository>;
