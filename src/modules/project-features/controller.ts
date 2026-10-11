import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProjectFeatureService } from "./service.js";
import type { ProjectFeatureCreateInput, ProjectFeatureUpdateInput, ReplaceProjectFeatureSelectionsInput } from "./types.js";
import { ProjectFeatureConflictError, ProjectFeatureNotFoundError, ProjectFeatureRuleError } from "./types.js";

type ProjectParams = { projectId: string };
type ProjectFeatureParams = ProjectParams & { projectFeatureId: string };

export function createProjectFeatureController(service: ProjectFeatureService) {
  return {
    async add(request: FastifyRequest<{ Params: ProjectParams; Body: ProjectFeatureCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        await service.addFeature(request.user.id, request.params.projectId, request.body);
        return reply.code(201).send();
      } catch (error) { return handleError(error, reply); }
    },
    async patch(request: FastifyRequest<{ Params: ProjectFeatureParams; Body: ProjectFeatureUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.updateFeature(request.user.id, request.params.projectId, request.params.projectFeatureId, request.body) }); }
      catch (error) { return handleError(error, reply); }
    },
    async remove(request: FastifyRequest<{ Params: ProjectFeatureParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { await service.removeFeature(request.user.id, request.params.projectId, request.params.projectFeatureId); return reply.code(204).send(); }
      catch (error) { return handleError(error, reply); }
    },
    async putSelections(request: FastifyRequest<{ Params: ProjectFeatureParams; Body: ReplaceProjectFeatureSelectionsInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.replaceSelections(request.user.id, request.params.projectId, request.params.projectFeatureId, request.body.selections) }); }
      catch (error) { return handleError(error, reply); }
    },
  };
}

function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof ProjectFeatureNotFoundError) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Project feature not found" } });
  if (error instanceof ProjectFeatureConflictError) return reply.code(409).send({ error: { code: "CONFLICT", message: "Feature already exists in this project" } });
  if (error instanceof ProjectFeatureRuleError) return reply.code(422).send({ error: { code: "BUSINESS_RULE_VIOLATION", message: error.message } });
  throw error;
}
