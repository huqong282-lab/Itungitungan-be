import { Type } from "typebox";

const billingPeriodSchema = Type.Union([Type.Literal("MONTHLY"), Type.Literal("YEARLY"), Type.Literal("ONE_TIME")]);
export const maintenancePlanCreateBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  price: Type.Integer({ minimum: 0 }),
  billingPeriod: billingPeriodSchema,
}, { additionalProperties: false });
export const maintenancePlanUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  price: Type.Optional(Type.Integer({ minimum: 0 })),
  billingPeriod: Type.Optional(billingPeriodSchema),
}, { additionalProperties: false, minProperties: 1 });
export const maintenancePlanStatusBodySchema = Type.Object({ isActive: Type.Boolean() }, { additionalProperties: false });
export const maintenancePlanIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const maintenancePlanListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });
const maintenancePlanSchema = Type.Object({
  id: Type.String(), name: Type.String(), price: Type.Integer(), billingPeriod: billingPeriodSchema, isActive: Type.Boolean(),
});
export const maintenancePlanListResponseSchema = Type.Object({
  data: Type.Array(maintenancePlanSchema),
  meta: Type.Object({ page: Type.Integer(), pageSize: Type.Integer(), total: Type.Integer(), totalPages: Type.Integer() }),
});
export const maintenancePlanResponseSchema = Type.Object({ data: maintenancePlanSchema });
export const maintenancePlanStatusResponseSchema = Type.Object({ data: Type.Object({ id: Type.String(), isActive: Type.Boolean() }) });
export const maintenancePlanErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
