import { MAX_BUFFERED_HOURS } from "./buffer.engine.js";

/** Calculates whole working days from hours already adjusted by the buffer engine. */
export function calculateWorkingDays(bufferedHours: number, workingHoursPerDay: number): number {
  assertValidBufferedHours(bufferedHours);
  assertValidWorkingHoursPerDay(workingHoursPerDay);

  return Math.ceil(bufferedHours / workingHoursPerDay);
}

function assertValidBufferedHours(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_BUFFERED_HOURS) {
    throw new RangeError("INVALID_BUFFERED_HOURS");
  }
}

function assertValidWorkingHoursPerDay(value: number): void {
  if (!Number.isInteger(value) || value <= 0 || value > MAX_BUFFERED_HOURS) {
    throw new RangeError("INVALID_WORKING_HOURS_PER_DAY");
  }
}
