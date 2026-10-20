import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import { createProjectService } from "../src/modules/projects/service.js";
import type { Project } from "../src/modules/projects/types.js";
import { ProjectNotFoundError } from "../src/modules/projects/types.js";

describe("ownership isolation across authenticated users", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("uses each validated session for project create, read, and update", async () => {
    const sessions = new Map([
      [hash("session-a"), { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-a", name: "A", email: "a@example.com" } }],
      [hash("session-b"), { expiresAt: new Date(Date.now() + 60_000), user: { id: "user-b", name: "B", email: "b@example.com" } }],
    ]);
    const records = new Map<string, Project & { userId: string }>();
    let nextId = 0;
    const projectService = createProjectService({
      async listByUserId(userId, query) {
        const data = [...records.values()].filter((project) => project.userId === userId);
        return { data: data.slice((query.page - 1) * query.pageSize, query.page * query.pageSize), total: data.length };
      },
      async findByIdAndUserId(id, userId) {
        const project = records.get(id);
        return project?.userId === userId ? withoutOwner(project) : null;
      },
      async createForUser(userId, input) {
        const now = new Date();
        const project: Project & { userId: string } = {
          id: `project-${++nextId}`, userId, clientName: input.clientName, projectName: input.projectName,
          logoUrl: input.logoUrl ?? null, deadline: input.deadline ? new Date(input.deadline) : null,
          status: "DRAFT", createdAt: now, updatedAt: now,
        };
        records.set(project.id, project);
        return withoutOwner(project);
      },
      async updateOwned(id, userId, input) {
        const project = records.get(id);
        if (!project || project.userId !== userId) return null;
        Object.assign(project, input, { updatedAt: new Date() });
        return withoutOwner(project);
      },
    });
    const lookup: SessionLookup = async (tokenHash) => sessions.get(tokenHash) ?? null;
    app = buildApp(undefined, lookup, undefined, undefined, undefined, undefined, undefined, projectService);

    const create = (token: string, clientName: string) => app!.inject({
      method: "POST", url: "/api/projects",
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=${token}` },
      payload: { clientName, projectName: `${clientName} site` },
    });
    const [createdA, createdB] = await Promise.all([create("session-a", "Client A"), create("session-b", "Client B")]);
    expect([createdA.statusCode, createdB.statusCode]).toEqual([201, 201]);
    const idA = createdA.json().data.id as string;
    const idB = createdB.json().data.id as string;
    expect(idA).not.toBe(idB);

    const get = (token: string, id: string) => app!.inject({
      method: "GET", url: `/api/projects/${id}`,
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=${token}` },
    });
    const [ownA, ownB, crossA, crossB] = await Promise.all([
      get("session-a", idA), get("session-b", idB), get("session-a", idB), get("session-b", idA),
    ]);
    expect(ownA.statusCode).toBe(200);
    expect(ownB.statusCode).toBe(200);
    expect(crossA.statusCode).toBe(404);
    expect(crossB.statusCode).toBe(404);
    expect(JSON.stringify(crossA.json())).not.toContain("Client B");
    expect(JSON.stringify(crossB.json())).not.toContain("Client A");

    const attemptedCrossUpdate = await app.inject({
      method: "PATCH", url: `/api/projects/${idB}`,
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=session-a` },
      payload: { projectName: "Hijacked", userId: "user-b" },
    });
    expect(attemptedCrossUpdate.statusCode).toBe(400);
    const separateCrossUpdate = await app.inject({
      method: "PATCH", url: `/api/projects/${idB}`,
      headers: { cookie: `${env.SESSION_COOKIE_NAME}=session-a` },
      payload: { projectName: "Hijacked" },
    });
    expect(separateCrossUpdate.statusCode).toBe(404);
    expect((await get("session-b", idB)).json().data.projectName).toBe("Client B site");
  }, 15_000);
});

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function withoutOwner(project: Project & { userId: string }): Project {
  const { userId: _userId, ...publicProject } = project;
  return publicProject;
}
