import type { PrismaClient } from "../../generated/prisma/client.js";
import type { UpdateSettingsInput } from "./types.js";

const settingsSelect = {
  developerRate: true,
  workingHoursPerDay: true,
  bufferPercentage: true,
  defaultMarginPercentage: true,
  defaultRushPercentage: true,
  freeRevisionCount: true,
  additionalRevisionPrice: true,
} as const;

export function createSettingsRepository(prisma: PrismaClient) {
  return {
    findByUserId(userId: string) {
      return prisma.developerSettings.findUnique({
        where: { userId },
        select: settingsSelect,
      });
    },
    updateByUserId(userId: string, input: UpdateSettingsInput) {
      return prisma.developerSettings.update({
        where: { userId },
        data: {
          ...(input.developerRate !== undefined && { developerRate: input.developerRate }),
          ...(input.workingHoursPerDay !== undefined && { workingHoursPerDay: input.workingHoursPerDay }),
          ...(input.buffer !== undefined && { bufferPercentage: input.buffer }),
          ...(input.margin !== undefined && { defaultMarginPercentage: input.margin }),
          ...(input.rush !== undefined && { defaultRushPercentage: input.rush }),
          ...(input.freeRevisionCount !== undefined && { freeRevisionCount: input.freeRevisionCount }),
          ...(input.additionalRevisionPrice !== undefined && { additionalRevisionPrice: input.additionalRevisionPrice }),
        },
        select: settingsSelect,
      });
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
