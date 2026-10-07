import type { FastifyReply, FastifyRequest } from "fastify";
import type { SettingsService } from "./service.js";
import { InvalidSettingsError, SettingsNotFoundError } from "./types.js";
import type { UpdateSettingsInput } from "./types.js";

export function createSettingsController(service: SettingsService) {
  return {
    async get(request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.getSettings(request.user.id) });
      } catch (error) {
        if (error instanceof SettingsNotFoundError) return notFound(reply);
        throw error;
      }
    },
    async patch(request: FastifyRequest<{ Body: UpdateSettingsInput }>, reply: FastifyReply) {
      if (!request.user) return unauthorized(reply);
      try {
        return reply.code(200).send({ data: await service.updateSettings(request.user.id, request.body) });
      } catch (error) {
        if (error instanceof InvalidSettingsError) {
          return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: error.message } });
        }
        if (error instanceof SettingsNotFoundError) return notFound(reply);
        throw error;
      }
    },
  };
}

function unauthorized(reply: FastifyReply) {
  return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}

function notFound(reply: FastifyReply) {
  return reply.code(404).send({ error: { code: "SETTINGS_NOT_FOUND", message: "Settings not found" } });
}
