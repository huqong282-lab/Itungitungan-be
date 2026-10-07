import type { SettingsRepository } from "./repository.js";
import type { Settings, SettingsRecord, UpdateSettingsInput } from "./types.js";
import { InvalidSettingsError, SettingsNotFoundError } from "./types.js";

const settingsFields: Array<keyof Settings> = [
  "developerRate",
  "workingHoursPerDay",
  "buffer",
  "margin",
  "rush",
  "freeRevisionCount",
  "additionalRevisionPrice",
];

export function createSettingsService(repository: SettingsRepository) {
  return {
    async getSettings(userId: string): Promise<Settings> {
      const record = await repository.findByUserId(userId);
      if (!record) throw new SettingsNotFoundError();
      return toSettings(record);
    },
    async updateSettings(userId: string, input: UpdateSettingsInput): Promise<Settings> {
      validateSettings(input);
      try {
        return toSettings(await repository.updateByUserId(userId, input));
      } catch (error) {
        if (isPrismaRecordNotFound(error)) throw new SettingsNotFoundError();
        throw error;
      }
    },
  };
}

function validateSettings(input: UpdateSettingsInput): void {
  for (const field of settingsFields) {
    const value = input[field];
    if (value === undefined) continue;
    const isIntegerField = field === "developerRate" || field === "workingHoursPerDay"
      || field === "freeRevisionCount" || field === "additionalRevisionPrice";
    if (!Number.isFinite(value) || (isIntegerField && !Number.isInteger(value))) {
      throw new InvalidSettingsError(field);
    }
    if ((field === "workingHoursPerDay" && value <= 0)
      || ((field === "buffer" || field === "margin" || field === "rush") && (value < 0 || value > 100))
      || (field !== "workingHoursPerDay" && field !== "buffer" && field !== "margin" && field !== "rush" && value < 0)) {
      throw new InvalidSettingsError(field);
    }
  }
}

function toSettings(record: SettingsRecord): Settings {
  return {
    developerRate: record.developerRate,
    workingHoursPerDay: record.workingHoursPerDay,
    buffer: decimalToNumber(record.bufferPercentage),
    margin: decimalToNumber(record.defaultMarginPercentage),
    rush: decimalToNumber(record.defaultRushPercentage),
    freeRevisionCount: record.freeRevisionCount,
    additionalRevisionPrice: record.additionalRevisionPrice,
  };
}

function decimalToNumber(value: number | { toNumber(): number }): number {
  return typeof value === "number" ? value : value.toNumber();
}

function isPrismaRecordNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

export type SettingsService = ReturnType<typeof createSettingsService>;
