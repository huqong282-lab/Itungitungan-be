import { calculateFeatureEstimate } from "../estimation/engine.js";
import { calculateBufferedHours } from "../estimation/buffer.engine.js";
import { calculateWorkingDays } from "../estimation/timeline.engine.js";
import { calculatePricing } from "../estimation/pricing.engine.js";
import { detectRushStatus } from "../estimation/rush.engine.js";
import type { CalculationProjectData, CalculationRepositoryPort } from "./repository.js";
import {
  CalculationDataInvalidError,
  CalculationProjectNotFoundError,
  CalculationSettingsNotFoundError,
} from "./types.js";
import type { CalculateProjectInput, ProjectCalculation } from "./types.js";

const MAX_PRISMA_INT = 2_147_483_647;

export type ProjectCalculationSnapshot = {
  calculation: ProjectCalculation;
  snapshot: {
    clientName: string;
    projectName: string;
    logoUrl: string | null;
    deadline: Date | null;
    developerRate: number;
    workingHoursPerDay: number;
    features: Array<{
      name: string;
      baseHours: number;
      estimatedHours: number;
      developmentCost: number;
      selections: Array<{ optionName: string; valueLabel: string; hours: number }>;
    }>;
    design: { name: string; price: number } | null;
    hostings: Array<{
      label: string;
      provider: string | null;
      plan: string | null;
      internalCost: number | null;
      clientPrice: number;
      clientProvided: boolean;
      billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" | null;
    }>;
    maintenances: Array<{ name: string; price: number; billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" }>;
  };
};

export function createCalculationService(
  repository: CalculationRepositoryPort,
  clock: () => Date = () => new Date(),
) {
  async function calculate(userId: string, projectId: string, input: CalculateProjectInput): Promise<ProjectCalculationSnapshot> {
    const [project, settings] = await Promise.all([
      repository.findOwnedProjectForCalculation(projectId, userId),
      repository.findSettingsForUser(userId),
    ]);
    if (!project) throw new CalculationProjectNotFoundError();
    if (project.userId !== userId) throw new CalculationProjectNotFoundError();
    if (!settings) throw new CalculationSettingsNotFoundError();

    const features = calculateFeatureSnapshots(project.features, userId, settings.developerRate);
    const estimatedHours = features.reduce((sum, feature) => sum + feature.estimatedHours, 0);
    assertPrismaInt(estimatedHours);
    const bufferPercentage = decimalToNumber(settings.bufferPercentage);
    const marginPercentage = input.marginPercentage ?? decimalToNumber(settings.defaultMarginPercentage);
    const rushFeePercentage = decimalToNumber(settings.defaultRushPercentage);
    const bufferedHours = calculateBufferedHours(estimatedHours, bufferPercentage);
    const workingDays = calculateWorkingDays(bufferedHours, settings.workingHoursPerDay);
    const rush = project.deadline === null
      ? { deadlineStatus: "NORMAL" as const, isRush: false }
      : detectRushStatus(calculateEstimatedCompletionDate(clock(), workingDays), project.deadline);

    const developmentCost = calculateDevelopmentCost(estimatedHours, settings.developerRate);
    if (features.reduce((sum, feature) => sum + feature.developmentCost, 0) !== developmentCost) {
      throw new CalculationDataInvalidError();
    }
    if (project.design && project.design.design.userId !== userId) throw new CalculationDataInvalidError();
    const designCost = project.design ? project.design.design.price : 0;
    const hostingCost = sumHostingCosts(project.hostings, userId);
    const maintenanceCost = sumMaintenanceCosts(project.maintenances, userId);
    const pricing = calculatePricing({
      developmentCost,
      designCost,
      hostingCost,
      maintenanceCost,
      marginPercentage,
      rushFeePercentage,
      isRush: rush.isRush,
    });

    const calculation: ProjectCalculation = {
      estimatedHours,
      bufferPercentage,
      bufferedHours,
      workingHoursPerDay: settings.workingHoursPerDay,
      workingDays,
      deadline: project.deadline?.toISOString() ?? null,
      deadlineStatus: rush.deadlineStatus,
      developmentCost,
      designCost,
      hostingCost,
      maintenanceCost,
      subtotal: pricing.subtotal,
      marginPercentage,
      marginAmount: pricing.marginAmount,
      rushFeePercentage: rush.isRush ? rushFeePercentage : 0,
      rushFeeAmount: pricing.rushFeeAmount,
      finalPrice: pricing.finalPrice,
      revisionPolicy: {
        freeRevisionCount: settings.freeRevisionCount,
        additionalRevisionPrice: settings.additionalRevisionPrice,
      },
    };

    return {
      calculation,
      snapshot: {
        clientName: project.clientName,
        projectName: project.projectName,
        logoUrl: project.logoUrl,
        deadline: project.deadline,
        developerRate: settings.developerRate,
        workingHoursPerDay: settings.workingHoursPerDay,
        features,
        design: project.design ? { name: project.design.design.name, price: project.design.design.price } : null,
        hostings: project.hostings.map((hosting) => {
          if (hosting.clientProvided) {
            if (hosting.hostingPlan !== null) throw new CalculationDataInvalidError();
            return {
              label: hosting.label,
              provider: null,
              plan: null,
              internalCost: null,
              clientPrice: 0,
              clientProvided: true,
              billingPeriod: null,
            };
          }
          if (!hosting.hostingPlan || hosting.hostingPlan.userId !== userId) throw new CalculationDataInvalidError();
          return {
            label: hosting.label,
            provider: hosting.hostingPlan.provider,
            plan: hosting.hostingPlan.name,
            internalCost: hosting.hostingPlan.internalCost,
            clientPrice: hosting.hostingPlan.clientPrice,
            clientProvided: false,
            billingPeriod: hosting.hostingPlan.billingPeriod,
          };
        }),
        maintenances: project.maintenances.map(({ maintenancePlan }) => {
          if (maintenancePlan.userId !== userId) throw new CalculationDataInvalidError();
          return {
            name: maintenancePlan.name,
            price: maintenancePlan.price,
            billingPeriod: maintenancePlan.billingPeriod,
          };
        }),
      },
    };
  }

  return {
    async calculateProject(userId: string, projectId: string, input: CalculateProjectInput = {}): Promise<ProjectCalculation> {
      return (await calculate(userId, projectId, input)).calculation;
    },
    calculateProjectSnapshot(userId: string, projectId: string, input: CalculateProjectInput = {}) {
      return calculate(userId, projectId, input);
    },
  };
}

export type CalculationService = ReturnType<typeof createCalculationService>;

function calculateFeatureSnapshots(
  features: CalculationProjectData["features"],
  userId: string,
  developerRate: number,
): ProjectCalculationSnapshot["snapshot"]["features"] {
  const snapshots = features.map((projectFeature) => {
    if (projectFeature.feature.userId !== userId || projectFeature.feature.id !== projectFeature.featureId) {
      throw new CalculationDataInvalidError();
    }
    const counts = new Map<string, number>();
    const selections = projectFeature.selections.map((selection) => {
      if (selection.featureOption.id !== selection.featureOptionId
        || selection.featureOption.featureId !== projectFeature.featureId
        || selection.featureOptionValue.featureOptionId !== selection.featureOptionId) {
        throw new CalculationDataInvalidError();
      }
      const count = (counts.get(selection.featureOptionId) ?? 0) + 1;
      counts.set(selection.featureOptionId, count);
      if (selection.featureOption.selectionType === "SINGLE" && count > 1) {
        throw new CalculationDataInvalidError();
      }
      return {
        optionName: selection.featureOption.name,
        valueLabel: selection.featureOptionValue.label,
        hours: selection.featureOptionValue.estimatedHours,
      };
    });
    const estimatedHours = calculateFeatureEstimate({
      baseEstimatedHours: projectFeature.feature.baseEstimatedHours,
      selectedOptionHours: selections.map(({ hours }) => hours),
      overrideHours: projectFeature.overrideHours,
    });
    const developmentCost = calculateDevelopmentCost(estimatedHours, developerRate);
    return {
      name: projectFeature.feature.name,
      baseHours: projectFeature.feature.baseEstimatedHours,
      estimatedHours,
      developmentCost,
      selections,
    };
  });
  let hoursTotal = 0;
  let costTotal = 0;
  for (const feature of snapshots) {
    hoursTotal += feature.estimatedHours;
    costTotal += feature.developmentCost;
    assertPrismaInt(hoursTotal);
    assertPrismaInt(costTotal);
  }
  return snapshots;
}

function sumHostingCosts(hostings: readonly {
  clientProvided: boolean;
  hostingPlan: { userId: string; clientPrice: number } | null;
}[], userId: string): number {
  let total = 0;
  for (const hosting of hostings) {
    if (hosting.clientProvided) {
      if (hosting.hostingPlan !== null) throw new CalculationDataInvalidError();
      continue;
    }
    if (!hosting.hostingPlan || hosting.hostingPlan.userId !== userId) throw new CalculationDataInvalidError();
    total += hosting.hostingPlan.clientPrice;
    assertPrismaInt(total);
  }
  return total;
}

function sumMaintenanceCosts(maintenances: readonly {
  maintenancePlan: { userId: string; price: number };
}[], userId: string): number {
  let total = 0;
  for (const maintenance of maintenances) {
    if (maintenance.maintenancePlan.userId !== userId) throw new CalculationDataInvalidError();
    total += maintenance.maintenancePlan.price;
    assertPrismaInt(total);
  }
  return total;
}

function calculateDevelopmentCost(estimatedHours: number, developerRate: number): number {
  assertPrismaInt(developerRate);
  const cost = estimatedHours * developerRate;
  assertPrismaInt(cost);
  return cost;
}

function calculateEstimatedCompletionDate(startDate: Date, workingDays: number): Date {
  if (!(startDate instanceof Date) || !Number.isFinite(startDate.getTime())) {
    throw new CalculationDataInvalidError();
  }
  if (!Number.isInteger(workingDays) || workingDays < 0 || workingDays > MAX_PRISMA_INT) {
    throw new CalculationDataInvalidError();
  }

  const completion = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  if (workingDays === 0) return completion;
  let remainingWorkDays = workingDays;
  const startingWeekday = completion.getUTCDay();
  if (startingWeekday === 6) completion.setUTCDate(completion.getUTCDate() + 2);
  else if (startingWeekday === 0) completion.setUTCDate(completion.getUTCDate() + 1);
  remainingWorkDays -= 1;
  if (!Number.isFinite(completion.getTime())) throw new CalculationDataInvalidError();
  if (remainingWorkDays === 0) return completion;

  const completeWeeks = Math.floor(remainingWorkDays / 5);
  completion.setUTCDate(completion.getUTCDate() + completeWeeks * 7);
  if (!Number.isFinite(completion.getTime())) throw new CalculationDataInvalidError();
  let remainingDays = remainingWorkDays % 5;
  while (remainingDays > 0) {
    completion.setUTCDate(completion.getUTCDate() + 1);
    const weekday = completion.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remainingDays -= 1;
  }
  if (!Number.isFinite(completion.getTime())) throw new CalculationDataInvalidError();
  return completion;
}

function assertPrismaInt(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PRISMA_INT) {
    throw new RangeError("CALCULATION_OUT_OF_RANGE");
  }
}

function decimalToNumber(value: number | { toNumber(): number }): number {
  return typeof value === "number" ? value : value.toNumber();
}
