import { Type } from "typebox";

const billingPeriodSchema = Type.Union([Type.Literal("MONTHLY"), Type.Literal("YEARLY"), Type.Literal("ONE_TIME")]);

export const hostingPlanCreateBodySchema = Type.Object({
  provider: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  internalCost: Type.Integer({ minimum: 0 }),
  clientPrice: Type.Integer({ minimum: 0 }),
  billingPeriod: billingPeriodSchema,
}, { additionalProperties: false });

export const hostingPlanUpdateBodySchema = Type.Object({
  provider: Type.Optional(Type.String({ minLength: 1 })),
  name: Type.Optional(Type.String({ minLength: 1 })),
  internalCost: Type.Optional(Type.Integer({ minimum: 0 })),
  clientPrice: Type.Optional(Type.Integer({ minimum: 0 })),
  billingPeriod: Type.Optional(billingPeriodSchema),
}, { additionalProperties: false, minProperties: 1 });

export const hostingPlanStatusBodySchema = Type.Object({ isActive: Type.Boolean() }, { additionalProperties: false });
export const hostingPlanIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const hostingPlanListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

const hostingPlanSchema = Type.Object({
  id: Type.String(),
  provider: Type.String(),
  name: Type.String(),
  internalCost: Type.Integer(),
  clientPrice: Type.Integer(),
  billingPeriod: billingPeriodSchema,
  isActive: Type.Boolean(),
});
export const hostingPlanListResponseSchema = Type.Object({
  data: Type.Array(hostingPlanSchema),
  meta: Type.Object({ page: Type.Integer(), pageSize: Type.Integer(), total: Type.Integer(), totalPages: Type.Integer() }),
});
export const hostingPlanResponseSchema = Type.Object({ data: hostingPlanSchema });
export const hostingPlanStatusResponseSchema = Type.Object({ data: Type.Object({ id: Type.String(), isActive: Type.Boolean() }) });
export const hostingPlanErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
