import type { FastifyReply, FastifyRequest } from "fastify";
import type { FeatureCreateInput, FeatureListQuery, FeatureStatusInput, FeatureUpdateInput } from "./types.js";
import type { FeatureService } from "./service.js";
import { FeatureNotFoundError } from "./types.js";

type FeatureIdParams = { id: string };

export function createFeatureController(service: FeatureService) {
  return {
    async list(request: FastifyRequest<{ Querystring: FeatureListQuery }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      const result = await service.listFeatures(request.user.id, request.query);
      return reply.code(200).send(result);
    },
    async get(request: FastifyRequest<{ Params: FeatureIdParams }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.getFeature(request.user.id, request.params.id) });
      } catch (error) {
        if (error instanceof FeatureNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async create(request: FastifyRequest<{ Body: FeatureCreateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      await service.createFeature(request.user.id, request.body);
      return reply.code(201).send();
    },
    async patch(request: FastifyRequest<{ Params: FeatureIdParams; Body: FeatureUpdateInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.updateFeature(request.user.id, request.params.id, request.body) });
      } catch (error) {
        if (error instanceof FeatureNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async patchStatus(request: FastifyRequest<{ Params: FeatureIdParams; Body: FeatureStatusInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.updateFeatureStatus(request.user.id, request.params.id, request.body) });
      } catch (error) {
        if (error instanceof FeatureNotFoundError) return notFound(reply);
        throw error;
      }
    },
  };
}

function unauthorized(reply: FastifyReply) {
  return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { code: "FEATURE_NOT_FOUND", message: "Feature not found" } });
}
