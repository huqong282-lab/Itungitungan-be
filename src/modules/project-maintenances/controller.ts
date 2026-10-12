import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProjectMaintenanceService } from "./service.js";
import type { ProjectMaintenanceCreateInput } from "./types.js";
import { ProjectMaintenanceDuplicateError, ProjectMaintenanceNotFoundError, ProjectMaintenancePlanNotFoundError, ProjectMaintenanceProjectNotFoundError } from "./types.js";

type ProjectParams = { projectId: string };
type MaintenanceParams = ProjectParams & { maintenanceId: string };

export function createProjectMaintenanceController(service: ProjectMaintenanceService) {
  return {
    async create(request: FastifyRequest<{ Params: ProjectParams; Body: ProjectMaintenanceCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(201).send({ data: await service.addMaintenance(request.user.id, request.params.projectId, request.body) }); }
      catch (error) { return handleError(error, reply); }
    },
    async remove(request: FastifyRequest<{ Params: MaintenanceParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { await service.removeMaintenance(request.user.id, request.params.projectId, request.params.maintenanceId); return reply.code(204).send(); }
      catch (error) { return handleError(error, reply); }
    },
  };
}

function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ProjectMaintenanceProjectNotFoundError) return reply.code(404).send({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
  if (error instanceof ProjectMaintenancePlanNotFoundError) return reply.code(404).send({ error: { code: "MAINTENANCE_PLAN_NOT_FOUND", message: "Maintenance plan not found" } });
  if (error instanceof ProjectMaintenanceNotFoundError) return reply.code(404).send({ error: { code: "PROJECT_MAINTENANCE_NOT_FOUND", message: "Project maintenance not found" } });
  if (error instanceof ProjectMaintenanceDuplicateError) return reply.code(409).send({ error: { code: "CONFLICT", message: "Maintenance plan is already added to this project" } });
  throw error;
}
