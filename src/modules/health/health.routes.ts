import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "typebox";

export const healthRoutes: FastifyPluginAsyncTypebox = async (app) => {
  app.get("/health", {
    schema: {
      response: {
        200: Type.Object({
          data: Type.Object({
            status: Type.Literal("ok"),
          }),
        }),
      },
    },
  }, async () => ({ data: { status: "ok" as const } }));
};
