import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app/app.js";
import { env } from "../src/config/env.js";
import type { AuthRepository } from "../src/modules/auth/auth.repository.js";
import { createAuthService } from "../src/modules/auth/auth.service.js";
import type { SessionLookup } from "../src/modules/auth/session.middleware.js";
import { createProjectService } from "../src/modules/projects/service.js";
import type { Project } from "../src/modules/projects/types.js";
import { createSettingsService } from "../src/modules/settings/service.js";
import type { SettingsRecord } from "../src/modules/settings/types.js";

describe("core authenticated API workflow", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("registers and logs in independent users, isolates settings and projects, and revokes logout sessions", async () => {
    const users = new Map<string, { id: string; email: string; name: string; passwordHash: string }>();
    const sessions = new Map<string, { userId: string; expiresAt: Date }>();
    const settings = new Map<string, SettingsRecord>();
    const projects = new Map<string, Project & { userId: string }>();
    let nextUserId = 0;
    let nextProjectId = 0;

    const authRepository = {
      async findUserById(id: string) {
        const user = users.get(id);
        return user ? { id, email: user.email, name: user.name, createdAt: new Date(), updatedAt: new Date() } : null;
      },
      async findUserByEmail(email: string) {
        const user = [...users.values()].find((candidate) => candidate.email === email);
        return user ?? null;
      },
      async register(input: { email: string; name: string; passwordHash: string; sessionTokenHash: string; sessionExpiresAt: Date }) {
        const user = { id: `user-${++nextUserId}`, email: input.email, name: input.name, passwordHash: input.passwordHash };
        users.set(user.id, user);
        sessions.set(input.sessionTokenHash, { userId: user.id, expiresAt: input.sessionExpiresAt });
        settings.set(user.id, defaultSettings());
        return { id: user.id, email: user.email, name: user.name };
      },
      async createSession(input: { userId: string; sessionTokenHash: string; sessionExpiresAt: Date }) {
        sessions.set(input.sessionTokenHash, { userId: input.userId, expiresAt: input.sessionExpiresAt });
        return { id: `session-${sessions.size}` };
      },
      async deleteSessionByTokenHash(tokenHash: string) { sessions.delete(tokenHash); },
    } as unknown as AuthRepository;

    const authService = createAuthService(authRepository);
    const lookup: SessionLookup = async (tokenHash) => {
      const session = sessions.get(tokenHash);
      const storedUser = session && users.get(session.userId);
      return session && storedUser ? {
        expiresAt: session.expiresAt,
        user: { id: storedUser.id, name: storedUser.name, email: storedUser.email },
      } : null;
    };
    const settingsService = createSettingsService({
      async findByUserId(userId) { return settings.get(userId) ?? null; },
      async updateByUserId(userId, input) {
        const current = settings.get(userId);
        if (!current) throw Object.assign(new Error("missing settings"), { code: "P2025" });
        const updated = {
          ...current,
          ...(input.developerRate !== undefined && { developerRate: input.developerRate }),
          ...(input.workingHoursPerDay !== undefined && { workingHoursPerDay: input.workingHoursPerDay }),
          ...(input.buffer !== undefined && { bufferPercentage: input.buffer }),
          ...(input.margin !== undefined && { defaultMarginPercentage: input.margin }),
          ...(input.rush !== undefined && { defaultRushPercentage: input.rush }),
          ...(input.freeRevisionCount !== undefined && { freeRevisionCount: input.freeRevisionCount }),
          ...(input.additionalRevisionPrice !== undefined && { additionalRevisionPrice: input.additionalRevisionPrice }),
        };
        settings.set(userId, updated);
        return updated;
      },
    } as never);
    const projectService = createProjectService({
      async listByUserId(userId, query) {
        const owned = [...projects.values()].filter((project) => project.userId === userId);
        return { data: owned.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map(publicProject), total: owned.length };
      },
      async findByIdAndUserId(id, userId) {
        const project = projects.get(id);
        return project?.userId === userId ? publicProject(project) : null;
      },
      async createForUser(userId, input) {
        const now = new Date();
        const project = {
          id: `project-${++nextProjectId}`, userId, clientName: input.clientName, projectName: input.projectName,
          logoUrl: input.logoUrl ?? null, deadline: input.deadline ? new Date(input.deadline) : null,
          status: "DRAFT" as const, createdAt: now, updatedAt: now,
        };
        projects.set(project.id, project);
        return publicProject(project);
      },
      async updateOwned(id, userId, input) {
        const project = projects.get(id);
        if (!project || project.userId !== userId) return null;
        Object.assign(project, input, { updatedAt: new Date() });
        return publicProject(project);
      },
    } as never);
    app = buildApp(authService, lookup, settingsService, undefined, undefined, undefined, undefined, projectService);

    const register = async (email: string, name: string) => app!.inject({
      method: "POST", url: "/api/auth/register", payload: { email, name, password: "a-secure-password" },
    });
    const [registeredA, registeredB] = await Promise.all([
      register("a@example.com", "User A"), register("b@example.com", "User B"),
    ]);
    expect([registeredA.statusCode, registeredB.statusCode]).toEqual([201, 201]);
    expect(JSON.stringify(registeredA.json())).not.toMatch(/passwordHash|tokenHash|sessionToken/);
    expect((await register("a@example.com", "Duplicate")).statusCode).toBe(409);
    expect((await register("invalid-email", "Invalid")).statusCode).toBe(400);

    const login = async (email: string, password = "a-secure-password") => app!.inject({
      method: "POST", url: "/api/auth/login", payload: { email, password },
    });
    const [loginA, loginB] = await Promise.all([login("a@example.com"), login("b@example.com")]);
    expect([loginA.statusCode, loginB.statusCode]).toEqual([200, 200]);
    expect((await login("a@example.com", "wrong-password")).statusCode).toBe(401);
    const cookieA = cookieValue(loginA.headers["set-cookie"]);
    const cookieB = cookieValue(loginB.headers["set-cookie"]);
    const getMe = (cookie: string) => app!.inject({ method: "GET", url: "/api/auth/me", headers: { cookie } });
    expect((await getMe(cookieA)).json().data.email).toBe("a@example.com");
    expect((await getMe(cookieB)).json().data.email).toBe("b@example.com");
    expect((await getMe("")).statusCode).toBe(401);

    const settingsGet = (cookie: string) => app!.inject({ method: "GET", url: "/api/settings", headers: { cookie } });
    const settingsUpdate = (cookie: string, payload: object) => app!.inject({ method: "PATCH", url: "/api/settings", headers: { cookie }, payload });
    expect((await settingsGet(cookieA)).statusCode).toBe(200);
    expect((await settingsUpdate(cookieA, { developerRate: 125, buffer: 20, margin: 15 })).statusCode).toBe(200);
    expect((await settingsUpdate(cookieA, { rush: 101 })).statusCode).toBe(400);
    expect((await settingsGet(cookieA)).json().data.developerRate).toBe(125);
    expect((await settingsGet(cookieB)).json().data.developerRate).toBe(0);
    expect((await settingsGet("")).statusCode).toBe(401);

    const createProject = (cookie: string, clientName: string) => app!.inject({
      method: "POST", url: "/api/projects", headers: { cookie }, payload: { clientName, projectName: `${clientName} website` },
    });
    const [projectAResponse, projectBResponse] = await Promise.all([
      createProject(cookieA, "Client A"), createProject(cookieB, "Client B"),
    ]);
    expect([projectAResponse.statusCode, projectBResponse.statusCode]).toEqual([201, 201]);
    const projectA = projectAResponse.json().data.id as string;
    const projectB = projectBResponse.json().data.id as string;
    const getProject = (cookie: string, id: string) => app!.inject({ method: "GET", url: `/api/projects/${id}`, headers: { cookie } });
    expect((await getProject(cookieA, projectA)).statusCode).toBe(200);
    expect((await getProject(cookieB, projectB)).statusCode).toBe(200);
    const crossRead = await getProject(cookieA, projectB);
    expect(crossRead.statusCode).toBe(404);
    expect(JSON.stringify(crossRead.json())).not.toContain("Client B");
    expect((await app.inject({
      method: "PATCH", url: `/api/projects/${projectB}`, headers: { cookie: cookieA }, payload: { projectName: "Hijacked" },
    })).statusCode).toBe(404);
    expect((await getProject(cookieB, projectB)).json().data.projectName).toBe("Client B website");

    await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie: cookieA } });
    expect((await getMe(cookieA)).statusCode).toBe(401);
  }, 30_000);
});

function defaultSettings(): SettingsRecord {
  return {
    developerRate: 0, workingHoursPerDay: 8, bufferPercentage: 0, defaultMarginPercentage: 0,
    defaultRushPercentage: 0, freeRevisionCount: 0, additionalRevisionPrice: 0,
  };
}

function publicProject(project: Project & { userId: string }): Project {
  const { userId: _userId, ...result } = project;
  return result;
}

function cookieValue(setCookie: string | string[] | undefined): string {
  const header = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!header) throw new Error("Expected session cookie");
  const [pair] = header.split(";");
  const [name, value] = (pair ?? "").split("=", 2);
  return `${name}=${value}`;
}
