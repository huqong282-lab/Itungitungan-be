import type { FastifyReply, FastifyRequest } from "fastify";
import type { MaintenancePlanCreateInput, MaintenancePlanListQuery, MaintenancePlanStatusInput, MaintenancePlanUpdateInput } from "./types.js";
import type { MaintenancePlanService } from "./service.js";
import { MaintenancePlanNotFoundError } from "./types.js";

type MaintenancePlanIdParams = { id: string };
export function createMaintenancePlanController(service: MaintenancePlanService) {
  return {
    async list(request: FastifyRequest<{ Querystring: MaintenancePlanListQuery }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(200).send(await service.listMaintenancePlans(request.user.id, request.query));
    },
    async get(request: FastifyRequest<{ Params: MaintenancePlanIdParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.getMaintenancePlan(request.user.id, request.params.id) }); }
      catch (error) { if (error instanceof MaintenancePlanNotFoundError) return notFound(reply); throw error; }
    },
    async create(request: FastifyRequest<{ Body: MaintenancePlanCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(201).send({ data: await service.createMaintenancePlan(request.user.id, request.body) });
    },
    async patch(request: FastifyRequest<{ Params: MaintenancePlanIdParams; Body: MaintenancePlanUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.updateMaintenancePlan(request.user.id, request.params.id, request.body) }); }
      catch (error) { if (error instanceof MaintenancePlanNotFoundError) return notFound(reply); throw error; }
    },
    async patchStatus(request: FastifyRequest<{ Params: MaintenancePlanIdParams; Body: MaintenancePlanStatusInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        const plan = await service.updateMaintenancePlanStatus(request.user.id, request.params.id, request.body);
        return reply.code(200).send({ data: { id: plan.id, isActive: plan.isActive } });
      } catch (error) { if (error instanceof MaintenancePlanNotFoundError) return notFound(reply); throw error; }
    },
  };
}
function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function notFound(reply: FastifyReply) { return reply.code(404).send({ error: { code: "MAINTENANCE_PLAN_NOT_FOUND", message: "Maintenance plan not found" } }); }
