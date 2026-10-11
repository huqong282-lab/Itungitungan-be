import type { FastifyReply, FastifyRequest } from "fastify";
import type { ProjectCreateInput, ProjectListQuery, ProjectUpdateInput } from "./types.js";
import type { ProjectService } from "./service.js";
import { ProjectNotFoundError } from "./types.js";

type IdParams = { id: string };
export function createProjectController(service: ProjectService) {
  return {
    async list(request: FastifyRequest<{ Querystring: ProjectListQuery }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(200).send(await service.listProjects(request.user.id, request.query));
    },
    async get(request: FastifyRequest<{ Params: IdParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.getProject(request.user.id, request.params.id) }); }
      catch (error) { if (error instanceof ProjectNotFoundError) return notFound(reply); throw error; }
    },
    async create(request: FastifyRequest<{ Body: ProjectCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(201).send({ data: await service.createProject(request.user.id, request.body) });
    },
    async patch(request: FastifyRequest<{ Params: IdParams; Body: ProjectUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try { return reply.code(200).send({ data: await service.updateProject(request.user.id, request.params.id, request.body) }); }
      catch (error) { if (error instanceof ProjectNotFoundError) return notFound(reply); throw error; }
    },
  };
}
function unauthorized(reply: FastifyReply) { return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }); }
function notFound(reply: FastifyReply) { return reply.code(404).send({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } }); }
