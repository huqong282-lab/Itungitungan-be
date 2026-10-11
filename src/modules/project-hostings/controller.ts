import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProjectHostingService } from "./service.js";
import type { ProjectHostingCreateInput, ProjectHostingUpdateInput } from "./types.js";
import { ProjectHostingNotFoundError, ProjectHostingPlanNotFoundError, ProjectHostingProjectNotFoundError, ProjectHostingRuleError } from "./types.js";

type ProjectParams = { projectId: string };
type HostingParams = ProjectParams & { hostingId: string };

export function createProjectHostingController(service: ProjectHostingService) {
  return {
    async create(request: FastifyRequest<{ Params: ProjectParams; Body: ProjectHostingCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(201).send({ data: await service.addHosting(request.user.id, request.params.projectId, request.body) }); }
      catch (error) { return handleError(error, reply); }
    },
    async patch(request: FastifyRequest<{ Params: HostingParams; Body: ProjectHostingUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.updateHosting(request.user.id, request.params.projectId, request.params.hostingId, request.body) }); }
      catch (error) { return handleError(error, reply); }
    },
    async remove(request: FastifyRequest<{ Params: HostingParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { await service.removeHosting(request.user.id, request.params.projectId, request.params.hostingId); return reply.code(204).send(); }
      catch (error) { return handleError(error, reply); }
    },
  };
}

function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ProjectHostingProjectNotFoundError) return reply.code(404).send({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
  if (error instanceof ProjectHostingPlanNotFoundError) return reply.code(404).send({ error: { code: "HOSTING_PLAN_NOT_FOUND", message: "Hosting plan not found" } });
  if (error instanceof ProjectHostingNotFoundError) return reply.code(404).send({ error: { code: "PROJECT_HOSTING_NOT_FOUND", message: "Project hosting not found" } });
  if (error instanceof ProjectHostingRuleError) return reply.code(422).send({ error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } });
  throw error;
}
