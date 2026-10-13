/** Prisma `Int` maps to a signed 32-bit integer in PostgreSQL. */
export const MAX_BUFFERED_HOURS = 2_147_483_647;

/** Applies the configured percentage buffer and rounds hours up to an integer. */
export function calculateBufferedHours(estimatedHours: number, bufferPercentage: number): number {
  assertValidEstimatedHours(estimatedHours);
  assertValidBufferPercentage(bufferPercentage);

  const bufferedHours = Math.ceil(estimatedHours * (1 + bufferPercentage / 100));
  if (bufferedHours > MAX_BUFFERED_HOURS) {
    throw new RangeError("BUFFERED_HOURS_OUT_OF_RANGE");
  }

  return bufferedHours;
}

function assertValidEstimatedHours(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_BUFFERED_HOURS) {
    throw new RangeError("INVALID_ESTIMATED_HOURS");
  }
}

function assertValidBufferPercentage(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError("INVALID_BUFFER_PERCENTAGE");
  }
}
