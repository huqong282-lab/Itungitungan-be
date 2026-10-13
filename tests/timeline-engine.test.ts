import { describe, expect, it } from "vitest";
import { MAX_BUFFERED_HOURS } from "../src/modules/estimation/buffer.engine.js";
import { calculateWorkingDays } from "../src/modules/estimation/timeline.engine.js";

describe("calculateWorkingDays", () => {
  it.each([
    [8, 8, 1],
    [9, 8, 2],
    [53, 8, 7],
  ])("calculates %s buffered hours at %s hours per day", (bufferedHours, workingHoursPerDay, expected) => {
    expect(calculateWorkingDays(bufferedHours, workingHoursPerDay)).toBe(expected);
  });

  it("returns an exact integer when hours divide evenly", () => {
    expect(calculateWorkingDays(16, 8)).toBe(2);
  });

  it("rounds a fractional day up instead of rounding or truncating", () => {
    expect(calculateWorkingDays(1, 8)).toBe(1);
    expect(calculateWorkingDays(10, 8)).toBe(2);
  });

  it("returns zero days for zero buffered hours", () => {
    expect(calculateWorkingDays(0, 8)).toBe(0);
  });

  it("accepts the maximum valid Prisma Int values", () => {
    expect(calculateWorkingDays(MAX_BUFFERED_HOURS, 1)).toBe(MAX_BUFFERED_HOURS);
    expect(calculateWorkingDays(1, MAX_BUFFERED_HOURS)).toBe(1);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_BUFFERED_HOURS + 1])(
    "rejects invalid buffered hours %s",
    (invalidBufferedHours) => {
      expect(() => calculateWorkingDays(invalidBufferedHours, 8)).toThrow("INVALID_BUFFERED_HOURS");
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_BUFFERED_HOURS + 1])(
    "rejects invalid working hours per day %s",
    (invalidWorkingHoursPerDay) => {
      expect(() => calculateWorkingDays(8, invalidWorkingHoursPerDay)).toThrow("INVALID_WORKING_HOURS_PER_DAY");
    },
  );
});
