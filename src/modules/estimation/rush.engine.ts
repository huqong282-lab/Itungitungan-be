export type DeadlineStatus = "NORMAL" | "RUSH";

export type RushDetectionResult = {
  deadlineStatus: DeadlineStatus;
  isRush: boolean;
};

/** Compares normalized date-time instants; fee calculation stays in the pricing engine. */
export function detectRushStatus(
  normalEstimatedCompletion: Date,
  clientDeadline: Date | null,
): RushDetectionResult {
  assertValidDate(normalEstimatedCompletion, "normalEstimatedCompletion");

  if (clientDeadline === null) return { deadlineStatus: "NORMAL", isRush: false };
  assertValidDate(clientDeadline, "clientDeadline");

  const isRush = normalEstimatedCompletion.getTime() > clientDeadline.getTime();
  return { deadlineStatus: isRush ? "RUSH" : "NORMAL", isRush };
}

function assertValidDate(value: Date, field: string): void {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new RangeError(`INVALID_${field.toUpperCase()}`);
  }
}
