import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProjectDesignService } from "./service.js";
import type { SetProjectDesignInput } from "./types.js";
import { ProjectDesignNotFoundError, ProjectDesignRuleError } from "./types.js";

type ProjectParams = { projectId: string };
export function createProjectDesignController(service: ProjectDesignService) {
  return {
    async put(request: FastifyRequest<{ Params: ProjectParams; Body: SetProjectDesignInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.setDesign(request.user.id, request.params.projectId, request.body) }); }
      catch (error) { return handleError(error, reply); }
    },
    async remove(request: FastifyRequest<{ Params: ProjectParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { await service.removeDesign(request.user.id, request.params.projectId); return reply.code(204).send(); }
      catch (error) { return handleError(error, reply); }
    },
  };
}

function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ProjectDesignNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Project or design not found" } });
  if (error instanceof ProjectDesignRuleError) return reply.code(422).send({ error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } });
  throw error;
}
