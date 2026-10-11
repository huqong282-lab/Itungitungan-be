import { Type } from "typebox";

const nullableId = Type.Union([Type.String({ minLength: 1 }), Type.Null()]);
export const projectHostingsParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectHostingParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }), hostingId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectHostingCreateBodySchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  hostingPlanId: nullableId,
  clientProvided: Type.Boolean(),
}, { additionalProperties: false });
export const projectHostingUpdateBodySchema = Type.Object({
  label: Type.Optional(Type.String({ minLength: 1 })),
  hostingPlanId: Type.Optional(nullableId),
  clientProvided: Type.Optional(Type.Boolean()),
}, { additionalProperties: false, minProperties: 1 });
const projectHostingSchema = Type.Object({
  id: Type.String(), projectId: Type.String(), hostingPlanId: Type.Union([Type.String(), Type.Null()]),
  label: Type.String(), clientProvided: Type.Boolean(), createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }),
});
export const projectHostingResponseSchema = Type.Object({ data: projectHostingSchema });
export const projectHostingErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
