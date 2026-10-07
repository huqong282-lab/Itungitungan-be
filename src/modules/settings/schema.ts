import { Type } from "typebox";

export const updateSettingsBodySchema = Type.Object({
  developerRate: Type.Optional(Type.Integer({ minimum: 0 })),
  workingHoursPerDay: Type.Optional(Type.Integer({ minimum: 1 })),
  buffer: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  margin: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  rush: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
  freeRevisionCount: Type.Optional(Type.Integer({ minimum: 0 })),
  additionalRevisionPrice: Type.Optional(Type.Integer({ minimum: 0 })),
});

export const settingsResponseSchema = Type.Object({
  data: Type.Object({
    developerRate: Type.Integer(),
    workingHoursPerDay: Type.Integer(),
    buffer: Type.Number(),
    margin: Type.Number(),
    rush: Type.Number(),
    freeRevisionCount: Type.Integer(),
    additionalRevisionPrice: Type.Integer(),
  }),
});

export const settingsErrorSchema = Type.Object({
  error: Type.Object({ code: Type.String(), message: Type.String() }),
});
