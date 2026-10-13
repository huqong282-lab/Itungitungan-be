import { describe, expect, it } from "vitest";
import { detectRushStatus } from "../src/modules/estimation/rush.engine.js";

describe("detectRushStatus", () => {
  it("returns NORMAL when the client deadline is after estimated completion", () => {
    expect(detectRushStatus(
      new Date("2026-10-20T00:00:00.000Z"),
      new Date("2026-10-21T00:00:00.000Z"),
    )).toEqual({ deadlineStatus: "NORMAL", isRush: false });
  });

  it("returns NORMAL when the client deadline equals estimated completion", () => {
    expect(detectRushStatus(
      new Date("2026-10-20T00:00:00.000Z"),
      new Date("2026-10-20T00:00:00.000Z"),
    )).toEqual({ deadlineStatus: "NORMAL", isRush: false });
  });

  it("returns RUSH when the client deadline is before estimated completion", () => {
    expect(detectRushStatus(
      new Date("2026-10-20T00:00:00.000Z"),
      new Date("2026-10-19T23:59:59.999Z"),
    )).toEqual({ deadlineStatus: "RUSH", isRush: true });
  });

  it("returns NORMAL with no rush when the client has not set a deadline", () => {
    expect(detectRushStatus(new Date("2026-10-20T00:00:00.000Z"), null)).toEqual({
      deadlineStatus: "NORMAL",
      isRush: false,
    });
  });

  it("compares timestamps as instants across timezone offsets", () => {
    expect(detectRushStatus(
      new Date("2026-10-20T00:00:00.000Z"),
      new Date("2026-10-20T07:00:00.000+07:00"),
    )).toEqual({ deadlineStatus: "NORMAL", isRush: false });
  });

  it.each([
    [new Date(Number.NaN), "INVALID_NORMALESTIMATEDCOMPLETION"],
    ["2026-10-20T00:00:00.000Z", "INVALID_NORMALESTIMATEDCOMPLETION"],
    [null, "INVALID_NORMALESTIMATEDCOMPLETION"],
  ])("rejects invalid estimated completion dates", (estimatedCompletion, errorCode) => {
    expect(() => detectRushStatus(estimatedCompletion as Date, null)).toThrow(errorCode);
  });

  it.each([
    new Date(Number.NaN),
    "2026-10-20T00:00:00.000Z",
  ])("rejects invalid client deadline values", (clientDeadline) => {
    expect(() => detectRushStatus(new Date("2026-10-20T00:00:00.000Z"), clientDeadline as Date)).toThrow("INVALID_CLIENTDEADLINE");
  });
});
