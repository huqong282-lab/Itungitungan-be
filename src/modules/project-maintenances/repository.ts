import { Prisma } from "../../generated/prisma/client.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import type { ProjectMaintenanceCreateInput } from "./types.js";
import { ProjectMaintenanceDuplicateError } from "./types.js";

const projectMaintenanceSelect = { id: true, projectId: true, maintenancePlanId: true, createdAt: true, updatedAt: true } as const;

export function createProjectMaintenanceRepository(prisma: PrismaClient) {
  return {
    findOwnedProject(projectId: string, userId: string) {
      return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    },
    findMaintenancePlanForUser(maintenancePlanId: string, userId: string) {
      return prisma.maintenancePlan.findFirst({ where: { id: maintenancePlanId, userId }, select: { id: true } });
    },
    async createForProject(projectId: string, input: ProjectMaintenanceCreateInput) {
      try {
        return await prisma.projectMaintenance.create({ data: { projectId, maintenancePlanId: input.maintenancePlanId }, select: projectMaintenanceSelect });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ProjectMaintenanceDuplicateError();
        throw error;
      }
    },
    async deleteOwned(projectId: string, maintenanceId: string, userId: string) {
      const result = await prisma.projectMaintenance.deleteMany({ where: { id: maintenanceId, projectId, project: { is: { userId } } } });
      return result.count > 0;
    },
  };
}

export type ProjectMaintenanceRepository = ReturnType<typeof createProjectMaintenanceRepository>;
