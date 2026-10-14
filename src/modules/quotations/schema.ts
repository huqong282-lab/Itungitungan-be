import { Type } from "typebox";

export const createQuotationParamsSchema = Type.Object({
  projectId: Type.String({ minLength: 1, pattern: "\\S" }),
}, { additionalProperties: false });

export const createQuotationBodySchema = Type.Object({}, { additionalProperties: false });

export const quotationResponseSchema = Type.Object({
  data: Type.Object({
    id: Type.String(),
    quotationNumber: Type.String(),
    version: Type.Integer({ minimum: 1 }),
    status: Type.Literal("DRAFT"),
    finalPrice: Type.Integer({ minimum: 0 }),
    workingDays: Type.Integer({ minimum: 0 }),
    createdAt: Type.String({ format: "date-time" }),
  }),
});

export const recalculateQuotationParamsSchema = Type.Object({
  quotationId: Type.String({ minLength: 1, pattern: "\\S" }),
}, { additionalProperties: false });

export const quotationErrorSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
});
