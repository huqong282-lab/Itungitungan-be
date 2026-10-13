import type { PrismaClient } from "../../generated/prisma/client.js";

const calculationProjectSelect = {
  id: true,
  userId: true,
  deadline: true,
  features: {
    select: {
      featureId: true,
      overrideHours: true,
      feature: { select: { id: true, userId: true, baseEstimatedHours: true } },
      selections: {
        select: {
          featureOptionId: true,
          featureOption: { select: { id: true, featureId: true, selectionType: true } },
          featureOptionValue: { select: { id: true, featureOptionId: true, estimatedHours: true } },
        },
      },
    },
  },
  design: {
    select: { design: { select: { userId: true, price: true } } },
  },
  hostings: {
    select: {
      clientProvided: true,
      hostingPlan: { select: { userId: true, clientPrice: true } },
    },
  },
  maintenances: {
    select: { maintenancePlan: { select: { userId: true, price: true } } },
  },
} as const;

const calculationSettingsSelect = {
  developerRate: true,
  workingHoursPerDay: true,
  bufferPercentage: true,
  defaultMarginPercentage: true,
  defaultRushPercentage: true,
  freeRevisionCount: true,
  additionalRevisionPrice: true,
} as const;

export function createCalculationRepository(prisma: PrismaClient) {
  return {
    findOwnedProjectForCalculation(projectId: string, userId: string) {
      return prisma.project.findFirst({
        where: { id: projectId, userId },
        select: calculationProjectSelect,
      });
    },
    findSettingsForUser(userId: string) {
      return prisma.developerSettings.findUnique({
        where: { userId },
        select: calculationSettingsSelect,
      });
    },
  };
}

export type CalculationRepository = ReturnType<typeof createCalculationRepository>;
export type CalculationProjectData = NonNullable<Awaited<ReturnType<CalculationRepository["findOwnedProjectForCalculation"]>>>;
export type CalculationSettingsData = {
  developerRate: number;
  workingHoursPerDay: number;
  bufferPercentage: number | { toNumber(): number };
  defaultMarginPercentage: number | { toNumber(): number };
  defaultRushPercentage: number | { toNumber(): number };
  freeRevisionCount: number;
  additionalRevisionPrice: number;
};
export type CalculationRepositoryPort = {
  findOwnedProjectForCalculation(projectId: string, userId: string): Promise<CalculationProjectData | null>;
  findSettingsForUser(userId: string): Promise<CalculationSettingsData | null>;
};
