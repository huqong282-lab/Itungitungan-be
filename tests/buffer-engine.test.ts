import { describe, expect, it } from "vitest";
import { calculateBufferedHours, MAX_BUFFERED_HOURS } from "../src/modules/estimation/buffer.engine.js";

describe("calculateBufferedHours", () => {
  it.each([
    [10, 0, 10],
    [10, 10, 11],
    [10, 20, 12],
    [10, 50, 15],
    [10, 100, 20],
  ])("applies a %s hour estimate with %s%% buffer", (estimatedHours, bufferPercentage, expected) => {
    expect(calculateBufferedHours(estimatedHours, bufferPercentage)).toBe(expected);
  });

  it("rounds fractional buffered hours up to the next whole hour", () => {
    expect(calculateBufferedHours(5, 10)).toBe(6);
  });

  it("matches the documented 44 hour and 20% example", () => {
    expect(calculateBufferedHours(44, 20)).toBe(53);
  });

  it("accepts the inclusive percentage boundaries and a decimal percentage", () => {
    expect(calculateBufferedHours(1, 0)).toBe(1);
    expect(calculateBufferedHours(1, 100)).toBe(2);
    expect(calculateBufferedHours(4, 12.5)).toBe(5);
  });

  it("returns zero for zero estimated hours, including with maximum buffer", () => {
    expect(calculateBufferedHours(0, 0)).toBe(0);
    expect(calculateBufferedHours(0, 100)).toBe(0);
  });

  it.each([-0.01, 100.01, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects buffer percentage %s outside the documented range",
    (invalidPercentage) => {
      expect(() => calculateBufferedHours(10, invalidPercentage)).toThrow("INVALID_BUFFER_PERCENTAGE");
    },
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_BUFFERED_HOURS + 1])(
    "rejects invalid estimated hours %s",
    (invalidHours) => {
      expect(() => calculateBufferedHours(invalidHours, 0)).toThrow("INVALID_ESTIMATED_HOURS");
    },
  );

  it("rejects buffered hours above the Prisma Int limit", () => {
    expect(() => calculateBufferedHours(MAX_BUFFERED_HOURS, 0.01)).toThrow("BUFFERED_HOURS_OUT_OF_RANGE");
  });

  it("accepts the maximum valid buffered hour value", () => {
    expect(calculateBufferedHours(MAX_BUFFERED_HOURS, 0)).toBe(MAX_BUFFERED_HOURS);
  });
});
