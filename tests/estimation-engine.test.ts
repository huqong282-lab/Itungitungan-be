import { describe, expect, it } from "vitest";
import { calculateFeatureEstimate, MAX_ESTIMATED_HOURS } from "../src/modules/estimation/engine.js";

describe("calculateFeatureEstimate", () => {
  it("uses base hours when the feature has no selected options", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [], overrideHours: null })).toBe(5);
  });

  it("adds larger selected option hours to the base", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [12], overrideHours: null })).toBe(17);
  });

  it("adds all selected option hours", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 3, selectedOptionHours: [2, 4, 6], overrideHours: null })).toBe(15);
  });

  it("uses an override instead of the normal estimate", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [12, 4], overrideHours: 7 })).toBe(7);
  });

  it("preserves zero for base, option, and override hours", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 0, selectedOptionHours: [], overrideHours: null })).toBe(0);
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [0], overrideHours: null })).toBe(5);
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [3], overrideHours: 0 })).toBe(0);
  });

  it("treats a missing override as null and calculates normally", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: 5, selectedOptionHours: [3], overrideHours: null })).toBe(8);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_ESTIMATED_HOURS + 1])(
    "rejects invalid hour value %s",
    (invalidHours) => {
      expect(() => calculateFeatureEstimate({ baseEstimatedHours: invalidHours, selectedOptionHours: [], overrideHours: null })).toThrow(RangeError);
    },
  );

  it("rejects an invalid option value even when an override exists", () => {
    expect(() => calculateFeatureEstimate({ baseEstimatedHours: 1, selectedOptionHours: [-1], overrideHours: 0 })).toThrow(RangeError);
  });

  it("rejects totals above the Prisma Int limit", () => {
    expect(() => calculateFeatureEstimate({ baseEstimatedHours: MAX_ESTIMATED_HOURS, selectedOptionHours: [1], overrideHours: null })).toThrow("FEATURE_ESTIMATE_OUT_OF_RANGE");
  });

  it("accepts the maximum valid Prisma Int result", () => {
    expect(calculateFeatureEstimate({ baseEstimatedHours: MAX_ESTIMATED_HOURS, selectedOptionHours: [], overrideHours: null })).toBe(MAX_ESTIMATED_HOURS);
  });
});
