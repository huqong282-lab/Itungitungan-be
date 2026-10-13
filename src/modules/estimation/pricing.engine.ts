/** Prisma `Int` maps to a signed 32-bit integer in PostgreSQL. */
export const MAX_PRICE_AMOUNT = 2_147_483_647;

export type PricingInput = {
  developmentCost: number;
  designCost: number;
  hostingCost: number;
  maintenanceCost: number;
  marginPercentage: number;
  rushFeePercentage: number;
  isRush: boolean;
};

export type PricingResult = {
  subtotal: number;
  marginAmount: number;
  rushFeeAmount: number;
  finalPrice: number;
};

/** Calculates project pricing from already-resolved cost components. */
export function calculatePricing(input: PricingInput): PricingResult {
  assertValidMoney(input.developmentCost, "developmentCost");
  assertValidMoney(input.designCost, "designCost");
  assertValidMoney(input.hostingCost, "hostingCost");
  assertValidMoney(input.maintenanceCost, "maintenanceCost");
  assertValidPercentage(input.marginPercentage, "marginPercentage");
  assertValidPercentage(input.rushFeePercentage, "rushFeePercentage");

  const subtotal = input.developmentCost + input.designCost + input.hostingCost + input.maintenanceCost;
  assertValidMoney(subtotal, "subtotal");

  const marginAmount = calculatePercentageAmount(subtotal, input.marginPercentage, "marginAmount");
  const rushFeeBase = subtotal + marginAmount;
  const rushFeeAmount = input.isRush
    ? calculatePercentageAmount(rushFeeBase, input.rushFeePercentage, "rushFeeAmount")
    : 0;
  const finalPrice = subtotal + marginAmount + rushFeeAmount;
  assertValidMoney(finalPrice, "finalPrice");

  return { subtotal, marginAmount, rushFeeAmount, finalPrice };
}

function calculatePercentageAmount(baseAmount: number, percentage: number, field: string): number {
  const amount = Math.ceil((baseAmount * percentage) / 100);
  assertValidMoney(amount, field);
  return amount;
}

function assertValidMoney(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PRICE_AMOUNT) {
    throw new RangeError(`INVALID_${field.toUpperCase()}`);
  }
}

function assertValidPercentage(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`INVALID_${field.toUpperCase()}`);
  }
}
