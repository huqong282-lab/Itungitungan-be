import { Type } from "typebox";

export const quotationListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String({ maxLength: 200 })),
  status: Type.Optional(Type.Union([Type.Literal("DRAFT"), Type.Literal("FINAL")])),
  projectId: Type.Optional(Type.String({ minLength: 1, pattern: "\\S" })),
  sort: Type.Optional(Type.Union([Type.Literal("createdAt"), Type.Literal("quotationNumber"), Type.Literal("finalPrice"), Type.Literal("version")])),
  order: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
}, { additionalProperties: false });

export const quotationListResponseSchema = Type.Object({
  data: Type.Array(Type.Object({
    id: Type.String(),
    quotationNumber: Type.String(),
    projectId: Type.String(),
    version: Type.Integer({ minimum: 1 }),
    status: Type.Union([Type.Literal("DRAFT"), Type.Literal("FINAL")]),
    clientName: Type.String(),
    projectName: Type.String(),
    finalPrice: Type.Integer({ minimum: 0 }),
    createdAt: Type.String({ format: "date-time" }),
  })),
  meta: Type.Object({ page: Type.Integer(), pageSize: Type.Integer(), total: Type.Integer(), totalPages: Type.Integer() }),
});

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

const nullableString = Type.Union([Type.String(), Type.Null()]);
const nullableDateTime = Type.Union([Type.String({ format: "date-time" }), Type.Null()]);
const billingPeriod = Type.Union([Type.Literal("MONTHLY"), Type.Literal("YEARLY"), Type.Literal("ONE_TIME")]);

export const quotationDetailResponseSchema = Type.Object({
  data: Type.Object({
    header: Type.Object({
      id: Type.String(),
      quotationNumber: Type.String(),
      version: Type.Integer({ minimum: 1 }),
      status: Type.Union([Type.Literal("DRAFT"), Type.Literal("FINAL")]),
      clientName: Type.String(),
      projectName: Type.String(),
      logoUrl: nullableString,
      deadline: nullableDateTime,
      developerRate: Type.Integer({ minimum: 0 }),
      finalizedAt: nullableDateTime,
      createdAt: Type.String({ format: "date-time" }),
      updatedAt: Type.String({ format: "date-time" }),
    }),
    features: Type.Array(Type.Object({
      name: Type.String(),
      baseHours: Type.Integer({ minimum: 0 }),
      estimatedHours: Type.Integer({ minimum: 0 }),
      developerRate: Type.Integer({ minimum: 0 }),
      developmentCost: Type.Integer({ minimum: 0 }),
      selections: Type.Array(Type.Object({
        optionName: Type.String(),
        valueLabel: Type.String(),
        hours: Type.Integer({ minimum: 0 }),
      })),
    })),
    design: Type.Union([Type.Object({ name: Type.String(), price: Type.Integer({ minimum: 0 }) }), Type.Null()]),
    hostings: Type.Array(Type.Object({
      label: Type.String(),
      provider: nullableString,
      plan: nullableString,
      internalCost: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]),
      clientPrice: Type.Integer({ minimum: 0 }),
      clientProvided: Type.Boolean(),
      billingPeriod: Type.Union([billingPeriod, Type.Null()]),
    })),
    maintenances: Type.Array(Type.Object({
      name: Type.String(),
      price: Type.Integer({ minimum: 0 }),
      billingPeriod,
    })),
    timeline: Type.Object({
      estimatedHours: Type.Integer({ minimum: 0 }),
      bufferPercentage: Type.Number({ minimum: 0 }),
      bufferedHours: Type.Integer({ minimum: 0 }),
      workingHoursPerDay: Type.Integer({ minimum: 1 }),
      workingDays: Type.Integer({ minimum: 0 }),
    }),
    pricing: Type.Object({
      developmentCost: Type.Integer({ minimum: 0 }),
      designCost: Type.Integer({ minimum: 0 }),
      hostingCost: Type.Integer({ minimum: 0 }),
      maintenanceCost: Type.Integer({ minimum: 0 }),
      subtotal: Type.Integer({ minimum: 0 }),
      marginPercentage: Type.Number({ minimum: 0 }),
      marginAmount: Type.Integer({ minimum: 0 }),
      rushFeePercentage: Type.Number({ minimum: 0 }),
      rushFeeAmount: Type.Integer({ minimum: 0 }),
      finalPrice: Type.Integer({ minimum: 0 }),
    }),
    revisionPolicy: Type.Object({
      freeRevisionCount: Type.Integer({ minimum: 0 }),
      additionalRevisionPrice: Type.Integer({ minimum: 0 }),
    }),
  }),
});

export const recalculateQuotationParamsSchema = Type.Object({
  quotationId: Type.String({ minLength: 1, pattern: "\\S" }),
}, { additionalProperties: false });

export const quotationErrorSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
});
