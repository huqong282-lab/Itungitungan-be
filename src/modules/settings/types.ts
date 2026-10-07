export type Settings = {
  developerRate: number;
  workingHoursPerDay: number;
  buffer: number;
  margin: number;
  rush: number;
  freeRevisionCount: number;
  additionalRevisionPrice: number;
};

export type UpdateSettingsInput = Partial<Settings>;

export type SettingsRecord = {
  developerRate: number;
  workingHoursPerDay: number;
  bufferPercentage: number | { toNumber(): number };
  defaultMarginPercentage: number | { toNumber(): number };
  defaultRushPercentage: number | { toNumber(): number };
  freeRevisionCount: number;
  additionalRevisionPrice: number;
};

export class SettingsNotFoundError extends Error {
  constructor() {
    super("SETTINGS_NOT_FOUND");
    this.name = "SettingsNotFoundError";
  }
}

export class InvalidSettingsError extends Error {
  constructor(public readonly field: keyof Settings) {
    super(`Invalid value for ${field}`);
    this.name = "InvalidSettingsError";
  }
}
