import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createProjectRepository } from "../src/modules/projects/repository.js";

describe("project repository ownership", () => {
  it("scopes list and count to the session user", async () => {
    const findMany = vi.fn(async () => []); const count = vi.fn(async () => 0);
    const repository = createProjectRepository({ project: { findMany, count } } as unknown as PrismaClient);
    await repository.listByUserId("user-a", { page: 2, pageSize: 10 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" }, skip: 10, take: 10 }));
    expect(count).toHaveBeenCalledWith({ where: { userId: "user-a" } });
  });
  it("scopes detail, create, and patch to authenticated ownership", async () => {
    const findFirst = vi.fn(async () => ({ id: "project-a" })); const create = vi.fn(async () => ({})); const updateMany = vi.fn(async () => ({ count: 1 }));
    const repository = createProjectRepository({ project: { findFirst, create, updateMany } } as unknown as PrismaClient);
    await repository.findByIdAndUserId("project-a", "user-a");
    await repository.createForUser("user-a", { clientName: "Client", projectName: "Website" });
    await repository.updateOwned("project-a", "user-a", { projectName: "Changed" });
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "project-a", userId: "user-a" } }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { userId: "user-a", clientName: "Client", projectName: "Website" } }));
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "project-a", userId: "user-a" }, data: { projectName: "Changed" } });
  });
});
