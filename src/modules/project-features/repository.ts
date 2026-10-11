import type { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import type { ProjectFeatureSelectionInput, ProjectFeatureUpdateInput } from "./types.js";

const projectFeatureSelect = { id: true, projectId: true, featureId: true, overrideHours: true, notes: true, createdAt: true, updatedAt: true } as const;
const selectionSelect = { id: true, projectFeatureId: true, featureOptionId: true, featureOptionValueId: true, createdAt: true, updatedAt: true } as const;

export function createProjectFeatureRepository(prisma: PrismaClient) {
  return {
    findOwnedProject(projectId: string, userId: string) {
      return prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    },
    findFeatureForUser(featureId: string, userId: string) {
      return prisma.feature.findFirst({ where: { id: featureId, userId }, select: { id: true, isActive: true } });
    },
    findExistingProjectFeature(projectId: string, featureId: string) {
      return prisma.projectFeature.findUnique({ where: { projectId_featureId: { projectId, featureId } }, select: { id: true } });
    },
    createForProject(projectId: string, featureId: string) {
      return prisma.projectFeature.create({ data: { projectId, featureId }, select: projectFeatureSelect });
    },
    updateOwned(projectId: string, projectFeatureId: string, userId: string, input: ProjectFeatureUpdateInput) {
      return prisma.projectFeature.updateMany({
        where: { id: projectFeatureId, projectId, project: { is: { userId } }, feature: { is: { userId } } },
        data: input,
      }).then(async (result) => result.count === 0 ? null : prisma.projectFeature.findFirst({ where: { id: projectFeatureId, projectId, project: { is: { userId } }, feature: { is: { userId } } }, select: projectFeatureSelect }));
    },
    async deleteOwned(projectId: string, projectFeatureId: string, userId: string) {
      const result = await prisma.projectFeature.deleteMany({ where: { id: projectFeatureId, projectId, project: { is: { userId } }, feature: { is: { userId } } } });
      return result.count > 0;
    },
    findSelectionContext(userId: string, projectId: string, projectFeatureId: string) {
      return prisma.projectFeature.findFirst({
          where: { id: projectFeatureId, projectId, project: { is: { userId } }, feature: { is: { userId } } },
          select: { id: true, feature: { select: { options: {
            select: { id: true, selectionType: true, values: { select: { id: true, isActive: true } } },
          } } } },
        }).then((projectFeature) => projectFeature && ({ id: projectFeature.id, options: projectFeature.feature.options }));
    },
    async replaceSelections(userId: string, projectId: string, projectFeatureId: string, selections: ProjectFeatureSelectionInput[]) {
      return prisma.$transaction(async (tx) => {
        const projectFeature = await tx.projectFeature.findFirst({ where: { id: projectFeatureId, projectId, project: { is: { userId } }, feature: { is: { userId } } }, select: { id: true } });
        if (!projectFeature) return null;
        await tx.projectFeatureSelection.deleteMany({ where: { projectFeatureId } });
        if (selections.length > 0) {
          await tx.projectFeatureSelection.createMany({ data: selections.map((selection) => ({ projectFeatureId, ...selection })) });
        }
        return tx.projectFeatureSelection.findMany({ where: { projectFeatureId }, select: selectionSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
      });
    },
  };
}

export type ProjectFeatureRepository = ReturnType<typeof createProjectFeatureRepository>;
