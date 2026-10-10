import type { FastifyReply, FastifyRequest } from "fastify";
import type { HostingPlanCreateInput, HostingPlanListQuery, HostingPlanStatusInput, HostingPlanUpdateInput } from "./types.js";
import type { HostingPlanService } from "./service.js";
import { HostingPlanNotFoundError } from "./types.js";

type HostingPlanIdParams = { id: string };

export function createHostingPlanController(service: HostingPlanService) {
  return {
    async list(request: FastifyRequest<{ Querystring: HostingPlanListQuery }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(200).send(await service.listHostingPlans(request.user.id, request.query));
    },
    async get(request: FastifyRequest<{ Params: HostingPlanIdParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.getHostingPlan(request.user.id, request.params.id) });
      } catch (error) {
        if (error instanceof HostingPlanNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async create(request: FastifyRequest<{ Body: HostingPlanCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(201).send({ data: await service.createHostingPlan(request.user.id, request.body) });
    },
    async patch(request: FastifyRequest<{ Params: HostingPlanIdParams; Body: HostingPlanUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.updateHostingPlan(request.user.id, request.params.id, request.body) });
      } catch (error) {
        if (error instanceof HostingPlanNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async patchStatus(request: FastifyRequest<{ Params: HostingPlanIdParams; Body: HostingPlanStatusInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        const hostingPlan = await service.updateHostingPlanStatus(request.user.id, request.params.id, request.body);
        return reply.code(200).send({ data: { id: hostingPlan.id, isActive: hostingPlan.isActive } });
      } catch (error) {
        if (error instanceof HostingPlanNotFoundError) return notFound(reply);
        throw error;
      }
    },
  };
}

function unauthorized(reply: FastifyReply) {
  return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { code: "HOSTING_PLAN_NOT_FOUND", message: "Hosting plan not found" } });
}
