import type { PrismaClient } from "../../generated/prisma/client.js";

const projectDesignSelect = { id: true, projectId: true, designId: true, createdAt: true, updatedAt: true } as const;

export function createProjectDesignRepository(prisma: PrismaClient) {
  return {
    findOwnedProject(projectId: string, userId: string) {
      return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    },
    findDesignForUser(designId: string, userId: string) {
      return prisma.design.findFirst({ where: { id: designId, userId }, select: { id: true, isActive: true } });
    },
    setForProject(projectId: string, designId: string) {
      return prisma.projectDesign.upsert({
        where: { projectId },
        create: { projectId, designId },
        update: { designId },
        select: projectDesignSelect,
      });
    },
    async removeFromOwnedProject(projectId: string, userId: string) {
      const result = await prisma.projectDesign.deleteMany({ where: { projectId, project: { is: { userId } } } });
      return result.count > 0;
    },
  };
}

export type ProjectDesignRepository = ReturnType<typeof createProjectDesignRepository>;
