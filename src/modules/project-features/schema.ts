import { Type } from "typebox";

const projectFeatureSchema = Type.Object({
  id: Type.String(), projectId: Type.String(), featureId: Type.String(),
  overrideHours: Type.Union([Type.Integer({ minimum: 0 }), Type.Null()]), notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }),
});
const selectionSchema = Type.Object({ id: Type.String(), projectFeatureId: Type.String(), featureOptionId: Type.String(), featureOptionValueId: Type.String(), createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }) });
export const projectFeatureParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectFeatureIdParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }), projectFeatureId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectFeatureCreateBodySchema = Type.Object({ featureId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectFeatureUpdateBodySchema = Type.Object({
  overrideHours: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  notes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
}, { additionalProperties: false, minProperties: 1 });
export const replaceSelectionsBodySchema = Type.Object({
  selections: Type.Array(Type.Object({ featureOptionId: Type.String({ minLength: 1 }), featureOptionValueId: Type.String({ minLength: 1 }) }, { additionalProperties: false })),
}, { additionalProperties: false });
export const projectFeatureResponseSchema = Type.Object({ data: projectFeatureSchema });
export const projectSelectionsResponseSchema = Type.Object({ data: Type.Array(selectionSchema) });
export const projectFeatureErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
