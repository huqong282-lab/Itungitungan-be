import { describe, expect, it } from "vitest";
import { calculatePricing, MAX_PRICE_AMOUNT } from "../src/modules/estimation/pricing.engine.js";

describe("calculatePricing", () => {
  it("matches the API Contract pricing example using its listed cost components", () => {
    expect(calculatePricing({
      developmentCost: 4_000_000,
      designCost: 1_000_000,
      hostingCost: 200_000,
      maintenanceCost: 500_000,
      marginPercentage: 30,
      rushFeePercentage: 0,
      isRush: false,
    })).toEqual({ subtotal: 5_700_000, marginAmount: 1_710_000, rushFeeAmount: 0, finalPrice: 7_410_000 });
  });

  it("calculates a rush fee from subtotal after margin exactly once", () => {
    expect(calculatePricing({
      developmentCost: 5_000_000,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 30,
      rushFeePercentage: 30,
      isRush: true,
    })).toEqual({ subtotal: 5_000_000, marginAmount: 1_500_000, rushFeeAmount: 1_950_000, finalPrice: 8_450_000 });
  });

  it("accepts zero and maximum percentages with positive cost components", () => {
    expect(calculatePricing({
      developmentCost: 100,
      designCost: 50,
      hostingCost: 25,
      maintenanceCost: 25,
      marginPercentage: 0,
      rushFeePercentage: 0,
      isRush: false,
    })).toEqual({ subtotal: 200, marginAmount: 0, rushFeeAmount: 0, finalPrice: 200 });

    expect(calculatePricing({
      developmentCost: 100,
      designCost: 50,
      hostingCost: 25,
      maintenanceCost: 25,
      marginPercentage: 100,
      rushFeePercentage: 100,
      isRush: true,
    })).toEqual({ subtotal: 200, marginAmount: 200, rushFeeAmount: 400, finalPrice: 800 });
  });

  it("does not apply a configured rush fee to a non-rush project with a positive subtotal", () => {
    expect(calculatePricing({
      developmentCost: 500,
      designCost: 200,
      hostingCost: 100,
      maintenanceCost: 200,
      marginPercentage: 0,
      rushFeePercentage: 100,
      isRush: false,
    })).toEqual({ subtotal: 1_000, marginAmount: 0, rushFeeAmount: 0, finalPrice: 1_000 });
  });

  it("rounds fractional margin and rush fee amounts up", () => {
    expect(calculatePricing({
      developmentCost: 1,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 30,
      rushFeePercentage: 30,
      isRush: true,
    })).toEqual({ subtotal: 1, marginAmount: 1, rushFeeAmount: 1, finalPrice: 3 });
  });

  it("keeps fee amounts zero for non-rush projects and supports zero values", () => {
    expect(calculatePricing({
      developmentCost: 0,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 0,
      rushFeePercentage: 100,
      isRush: false,
    })).toEqual({ subtotal: 0, marginAmount: 0, rushFeeAmount: 0, finalPrice: 0 });
  });

  it("rejects invalid percentages, negative amounts, and totals above Prisma Int", () => {
    expect(() => calculatePricing({
      developmentCost: -1,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 0,
      rushFeePercentage: 0,
      isRush: false,
    })).toThrow("INVALID_DEVELOPMENTCOST");
    expect(() => calculatePricing({
      developmentCost: 0,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 100.01,
      rushFeePercentage: 0,
      isRush: false,
    })).toThrow("INVALID_MARGINPERCENTAGE");
    expect(() => calculatePricing({
      developmentCost: MAX_PRICE_AMOUNT,
      designCost: 1,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 0,
      rushFeePercentage: 0,
      isRush: false,
    })).toThrow("INVALID_SUBTOTAL");
  });

  it("accepts the maximum final Prisma Int amount when no markup is applied", () => {
    expect(calculatePricing({
      developmentCost: MAX_PRICE_AMOUNT,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 0,
      rushFeePercentage: 100,
      isRush: false,
    })).toEqual({ subtotal: MAX_PRICE_AMOUNT, marginAmount: 0, rushFeeAmount: 0, finalPrice: MAX_PRICE_AMOUNT });
  });

  it("rejects a final price that crosses the Prisma Int limit after margin", () => {
    expect(() => calculatePricing({
      developmentCost: 1_073_741_824,
      designCost: 0,
      hostingCost: 0,
      maintenanceCost: 0,
      marginPercentage: 100,
      rushFeePercentage: 0,
      isRush: false,
    })).toThrow("INVALID_FINALPRICE");
  });
});
