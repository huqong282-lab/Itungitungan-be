import { Type } from "typebox";

export const projectDesignParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const setProjectDesignBodySchema = Type.Object({ designId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
const projectDesignSchema = Type.Object({
  id: Type.String(), projectId: Type.String(), designId: Type.String(),
  createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }),
});
export const projectDesignResponseSchema = Type.Object({ data: projectDesignSchema });
export const projectDesignErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
