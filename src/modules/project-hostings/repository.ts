import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { ProjectHostingCreateInput, ProjectHostingUpdateInput } from "./types.js";

const projectHostingSelect = { id: true, projectId: true, hostingPlanId: true, label: true, clientProvided: true, createdAt: true, updatedAt: true } as const;

export function createProjectHostingRepository(prisma: PrismaClient) {
  return {
    findOwnedProject(projectId: string, userId: string) {
      return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    },
    findHostingPlanForUser(hostingPlanId: string, userId: string) {
      return prisma.hostingPlan.findFirst({ where: { id: hostingPlanId, userId }, select: { id: true, isActive: true } });
    },
    createForProject(projectId: string, input: ProjectHostingCreateInput) {
      return prisma.projectHosting.create({ data: { projectId, label: input.label, hostingPlanId: input.hostingPlanId, clientProvided: input.clientProvided }, select: projectHostingSelect });
    },
    findOwnedHosting(projectId: string, hostingId: string, userId: string) {
      return prisma.projectHosting.findFirst({ where: { id: hostingId, projectId, project: { is: { userId } } }, select: projectHostingSelect });
    },
    async updateOwned(projectId: string, hostingId: string, userId: string, input: ProjectHostingUpdateInput) {
      const where = { id: hostingId, projectId, project: { is: { userId } } } satisfies Prisma.ProjectHostingWhereInput;
      const result = await prisma.projectHosting.updateMany({ where, data: input });
      if (result.count === 0) return null;
      return prisma.projectHosting.findFirst({ where, select: projectHostingSelect });
    },
    async deleteOwned(projectId: string, hostingId: string, userId: string) {
      const result = await prisma.projectHosting.deleteMany({ where: { id: hostingId, projectId, project: { is: { userId } } } });
      return result.count > 0;
    },
  };
}

export type ProjectHostingRepository = ReturnType<typeof createProjectHostingRepository>;
