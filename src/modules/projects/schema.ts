import { Type } from "typebox";

const nullableString = Type.Union([Type.String(), Type.Null()]);
const nullableDateTime = Type.Union([Type.String({ format: "date-time" }), Type.Null()]);
const projectSchema = Type.Object({
  id: Type.String(), clientName: Type.String(), projectName: Type.String(),
  logoUrl: nullableString, deadline: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
  status: Type.Union([Type.Literal("DRAFT"), Type.Literal("QUOTED"), Type.Literal("ACCEPTED"), Type.Literal("REJECTED")]),
  createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }),
});

export const projectCreateBodySchema = Type.Object({
  clientName: Type.String({ minLength: 1 }), projectName: Type.String({ minLength: 1 }),
  logoUrl: Type.Optional(nullableString), deadline: Type.Optional(nullableDateTime),
}, { additionalProperties: false });
export const projectUpdateBodySchema = Type.Object({
  clientName: Type.Optional(Type.String({ minLength: 1 })), projectName: Type.Optional(Type.String({ minLength: 1 })),
  logoUrl: Type.Optional(nullableString), deadline: Type.Optional(nullableDateTime),
}, { additionalProperties: false, minProperties: 1 });
export const projectIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })), pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
}, { additionalProperties: false });
export const projectListResponseSchema = Type.Object({
  data: Type.Array(projectSchema),
  meta: Type.Object({ page: Type.Integer(), pageSize: Type.Integer(), total: Type.Integer(), totalPages: Type.Integer() }),
});
export const projectResponseSchema = Type.Object({ data: projectSchema });
export const projectErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
