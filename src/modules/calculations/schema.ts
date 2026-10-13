import { Type } from "typebox";

export const calculateProjectParamsSchema = Type.Object({
  projectId: Type.String({ minLength: 1, pattern: "\\S" }),
}, { additionalProperties: false });

export const calculateProjectBodySchema = Type.Object({
  marginPercentage: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
}, { additionalProperties: false });

const revisionPolicySchema = Type.Object({
  freeRevisionCount: Type.Integer({ minimum: 0 }),
  additionalRevisionPrice: Type.Integer({ minimum: 0 }),
});

export const projectCalculationResponseSchema = Type.Object({
  data: Type.Object({
    estimatedHours: Type.Integer({ minimum: 0 }),
    bufferPercentage: Type.Number({ minimum: 0, maximum: 100 }),
    bufferedHours: Type.Integer({ minimum: 0 }),
    workingHoursPerDay: Type.Integer({ minimum: 1 }),
    workingDays: Type.Integer({ minimum: 0 }),
    deadline: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
    deadlineStatus: Type.Union([Type.Literal("NORMAL"), Type.Literal("RUSH")]),
    developmentCost: Type.Integer({ minimum: 0 }),
    designCost: Type.Integer({ minimum: 0 }),
    hostingCost: Type.Integer({ minimum: 0 }),
    maintenanceCost: Type.Integer({ minimum: 0 }),
    subtotal: Type.Integer({ minimum: 0 }),
    marginPercentage: Type.Number({ minimum: 0, maximum: 100 }),
    marginAmount: Type.Integer({ minimum: 0 }),
    rushFeePercentage: Type.Number({ minimum: 0, maximum: 100 }),
    rushFeeAmount: Type.Integer({ minimum: 0 }),
    finalPrice: Type.Integer({ minimum: 0 }),
    revisionPolicy: revisionPolicySchema,
  }),
});

export const calculationErrorSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
});
