import { Type } from "typebox";

export const featureCreateBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  category: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  baseEstimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
}, { additionalProperties: false });

export const featureUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  category: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  baseEstimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
}, { additionalProperties: false });

export const featureStatusBodySchema = Type.Object({ isActive: Type.Boolean() }, { additionalProperties: false });

export const featureOptionCreateBodySchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  selectionType: Type.Union([Type.Literal("SINGLE"), Type.Literal("MULTIPLE")]),
}, { additionalProperties: false });

export const featureOptionUpdateBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  selectionType: Type.Optional(Type.Union([Type.Literal("SINGLE"), Type.Literal("MULTIPLE")])),
}, { additionalProperties: false, minProperties: 1 });

export const featureOptionParamsSchema = Type.Object({
  featureId: Type.String({ minLength: 1 }),
  optionId: Type.String({ minLength: 1 }),
}, { additionalProperties: false });

export const featureOptionFeatureParamsSchema = Type.Object({ featureId: Type.String({ minLength: 1 }) }, { additionalProperties: false });

export const featureOptionValueParamsSchema = Type.Object({
  featureId: Type.String({ minLength: 1 }),
  optionId: Type.String({ minLength: 1 }),
  valueId: Type.String({ minLength: 1 }),
}, { additionalProperties: false });

export const featureOptionValueCreateBodySchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  estimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
  isDefault: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

export const featureOptionValueUpdateBodySchema = Type.Object({
  label: Type.Optional(Type.String({ minLength: 1 })),
  estimatedHours: Type.Optional(Type.Integer({ minimum: 0 })),
  isDefault: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false, minProperties: 1 });

const featureOptionSchema = Type.Object({
  id: Type.String(),
  featureId: Type.String(),
  name: Type.String(),
  selectionType: Type.Union([Type.Literal("SINGLE"), Type.Literal("MULTIPLE")]),
});

export const featureOptionResponseSchema = Type.Object({ data: featureOptionSchema });

export const featureOptionValueResponseSchema = Type.Object({ data: Type.Object({
  id: Type.String(),
  featureOptionId: Type.String(),
  label: Type.String(),
  estimatedHours: Type.Integer(),
  isDefault: Type.Boolean(),
  isActive: Type.Boolean(),
}) });

export const featureIdParamsSchema = Type.Object({ id: Type.String({ minLength: 1 }) }, { additionalProperties: false });

export const featureListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  search: Type.Optional(Type.String()),
  category: Type.Optional(Type.String()),
  isActive: Type.Optional(Type.Boolean()),
}, { additionalProperties: false });

const featureSummarySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  category: Type.Union([Type.String(), Type.Null()]),
  baseEstimatedHours: Type.Integer(),
  isActive: Type.Boolean(),
});

export const featureListResponseSchema = Type.Object({
  data: Type.Array(featureSummarySchema),
  meta: Type.Object({
    page: Type.Integer(),
    pageSize: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

export const featureSummaryResponseSchema = Type.Object({ data: featureSummarySchema });

export const featureDetailResponseSchema = Type.Object({
  data: Type.Intersect([
    featureSummarySchema,
    Type.Object({
      options: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
        selectionType: Type.Union([Type.Literal("SINGLE"), Type.Literal("MULTIPLE")]),
        values: Type.Array(Type.Object({
          id: Type.String(),
          label: Type.String(),
          estimatedHours: Type.Integer(),
          isDefault: Type.Boolean(),
          isActive: Type.Boolean(),
        })),
      })),
    }),
  ]),
});

export const featureStatusResponseSchema = Type.Object({
  data: Type.Object({ id: Type.String(), isActive: Type.Boolean() }),
});

export const featureErrorSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
});
