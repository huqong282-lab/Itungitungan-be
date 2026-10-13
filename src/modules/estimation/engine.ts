/** Prisma `Int` maps to a signed 32-bit integer in PostgreSQL. */
export const MAX_ESTIMATED_HOURS = 2_147_483_647;

export type FeatureEstimationInput = {
  baseEstimatedHours: number;
  selectedOptionHours: readonly number[];
  overrideHours: number | null;
};

/**
 * Calculates one feature's estimate from persisted catalog and project data.
 * Selection ownership and feature membership must be validated by the caller
 * before passing selected option hours to this pure calculation function.
 */
export function calculateFeatureEstimate(input: FeatureEstimationInput): number {
  assertValidHours(input.baseEstimatedHours, "baseEstimatedHours");
  if (input.overrideHours !== null) assertValidHours(input.overrideHours, "overrideHours");
  input.selectedOptionHours.forEach((hours, index) => assertValidHours(hours, `selectedOptionHours[${index}]`));

  if (input.overrideHours !== null) return input.overrideHours;

  let estimate = input.baseEstimatedHours;
  for (const hours of input.selectedOptionHours) {
    estimate += hours;
    if (estimate > MAX_ESTIMATED_HOURS) {
      throw new RangeError("FEATURE_ESTIMATE_OUT_OF_RANGE");
    }
  }

  return estimate;
}

function assertValidHours(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_ESTIMATED_HOURS) {
    throw new RangeError(`INVALID_${field.toUpperCase()}`);
  }
}
