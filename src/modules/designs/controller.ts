import type { FastifyReply, FastifyRequest } from "fastify";
import type { DesignCreateInput, DesignListQuery, DesignStatusInput, DesignUpdateInput } from "./types.js";
import type { DesignService } from "./service.js";
import { DesignNotFoundError } from "./types.js";

type DesignIdParams = { id: string };

export function createDesignController(service: DesignService) {
  return {
    async list(request: FastifyRequest<{ Querystring: DesignListQuery }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(200).send(await service.listDesigns(request.user.id, request.query));
    },
    async get(request: FastifyRequest<{ Params: DesignIdParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.getDesign(request.user.id, request.params.id) });
      } catch (error) {
        if (error instanceof DesignNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async create(request: FastifyRequest<{ Body: DesignCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      return reply.code(201).send({ data: await service.createDesign(request.user.id, request.body) });
    },
    async patch(request: FastifyRequest<{ Params: DesignIdParams; Body: DesignUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.updateDesign(request.user.id, request.params.id, request.body) });
      } catch (error) {
        if (error instanceof DesignNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async patchStatus(request: FastifyRequest<{ Params: DesignIdParams; Body: DesignStatusInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        const design = await service.updateDesignStatus(request.user.id, request.params.id, request.body);
        return reply.code(200).send({ data: { id: design.id, isActive: design.isActive } });
      } catch (error) {
        if (error instanceof DesignNotFoundError) return notFound(reply);
        throw error;
      }
    },
  };
}

function unauthorized(reply: FastifyReply) {
  return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { code: "DESIGN_NOT_FOUND", message: "Design not found" } });
}
