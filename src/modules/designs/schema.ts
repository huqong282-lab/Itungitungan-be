import { Type } from "typebox";

export const designCreateBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  price: Type.Integer({ minimum: 0 }),
}, { additionalProperties: false });

export const designUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  price: Type.Optional(Type.Integer({ minimum: 0 })),
}, { additionalProperties: false, minProperties: 1 });

export const designStatusBodySchema = Type.Object({ isActive: Type.Boolean() }, { additionalProperties: false });
export const designIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const designListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

const designSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  price: Type.Integer(),
  isActive: Type.Boolean(),
});

export const designListResponseSchema = Type.Object({
  data: Type.Array(designSchema),
  meta: Type.Object({ page: Type.Integer(), pageSize: Type.Integer(), total: Type.Integer(), totalPages: Type.Integer() }),
});
export const designResponseSchema = Type.Object({ data: designSchema });
export const designStatusResponseSchema = Type.Object({ data: Type.Object({ id: Type.String(), isActive: Type.Boolean() }) });
export const designErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
