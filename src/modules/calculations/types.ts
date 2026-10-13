import type { DeadlineStatus } from "../estimation/rush.engine.js";

export type CalculateProjectInput = {
  marginPercentage?: number;
};

export type RevisionPolicy = {
  freeRevisionCount: number;
  additionalRevisionPrice: number;
};

export type ProjectCalculation = {
  estimatedHours: number;
  bufferPercentage: number;
  bufferedHours: number;
  workingHoursPerDay: number;
  workingDays: number;
  deadline: string | null;
  deadlineStatus: DeadlineStatus;
  developmentCost: number;
  designCost: number;
  hostingCost: number;
  maintenanceCost: number;
  subtotal: number;
  marginPercentage: number;
  marginAmount: number;
  rushFeePercentage: number;
  rushFeeAmount: number;
  finalPrice: number;
  revisionPolicy: RevisionPolicy;
};

export class CalculationProjectNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "CalculationProjectNotFoundError";
  }
}

export class CalculationSettingsNotFoundError extends Error {
  constructor() {
    super("Developer settings not found");
    this.name = "CalculationSettingsNotFoundError";
  }
}

export class CalculationDataInvalidError extends Error {
  constructor() {
    super("Project calculation data is invalid");
    this.name = "CalculationDataInvalidError";
  }
}
