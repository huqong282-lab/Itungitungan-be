import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { ProjectCreateInput, ProjectUpdateInput, ResolvedProjectListQuery } from "./types.js";

const projectSelect = { id: true, clientName: true, projectName: true, logoUrl: true, deadline: true, status: true, createdAt: true, updatedAt: true } as const;

export function createProjectRepository(prisma: PrismaClient) {
  return {
    async listByUserId(userId: string, query: ResolvedProjectListQuery) {
      const where: Prisma.ProjectWhereInput = { userId };
      const [data, total] = await Promise.all([
        prisma.project.findMany({ where, select: projectSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        prisma.project.count({ where }),
      ]);
      return { data, total };
    },
    findByIdAndUserId(id: string, userId: string) { return prisma.project.findFirst({ where: { id, userId }, select: projectSelect }); },
    createForUser(userId: string, input: ProjectCreateInput) {
      return prisma.project.create({ data: { userId, clientName: input.clientName, projectName: input.projectName, ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }), ...(input.deadline !== undefined && { deadline: input.deadline === null ? null : new Date(input.deadline) }) }, select: projectSelect });
    },
    async updateOwned(id: string, userId: string, input: ProjectUpdateInput) {
      const data: Prisma.ProjectUpdateManyMutationInput = { ...input, ...(input.deadline !== undefined && { deadline: input.deadline === null ? null : new Date(input.deadline) }) };
      const result = await prisma.project.updateMany({ where: { id, userId }, data });
      if (result.count === 0) return null;
      return prisma.project.findFirst({ where: { id, userId }, select: projectSelect });
    },
  };
}

export type ProjectRepository = ReturnType<typeof createProjectRepository>;
