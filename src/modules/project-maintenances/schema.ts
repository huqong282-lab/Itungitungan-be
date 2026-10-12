import { Type } from "typebox";

export const projectMaintenanceParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectMaintenanceRelationParamsSchema = Type.Object({ projectId: Type.String({ minLength: 1 }), maintenanceId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
export const projectMaintenanceCreateBodySchema = Type.Object({ maintenancePlanId: Type.String({ minLength: 1 }) }, { additionalProperties: false });
const projectMaintenanceSchema = Type.Object({
  id: Type.String(), projectId: Type.String(), maintenancePlanId: Type.String(),
  createdAt: Type.String({ format: "date-time" }), updatedAt: Type.String({ format: "date-time" }),
});
export const projectMaintenanceResponseSchema = Type.Object({ data: projectMaintenanceSchema });
export const projectMaintenanceErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) });
