import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createProjectDesignRepository } from "../src/modules/project-designs/repository.js";

describe("project design repository ownership", () => {
  it("scopes project/design validation by session owner and checks active state", async () => {
    const projectFindFirst = vi.fn(async () => ({ id: "p-a" }));
    const designFindFirst = vi.fn(async () => ({ id: "d-a", isActive: true }));
    const repository = createProjectDesignRepository({ project: { findFirst: projectFindFirst }, design: { findFirst: designFindFirst } } as unknown as PrismaClient);
    await repository.findOwnedProject("p-a", "u-a");
    await repository.findDesignForUser("d-a", "u-a");
    expect(projectFindFirst).toHaveBeenCalledWith({ where: { id: "p-a", userId: "u-a" }, select: { id: true } });
    expect(designFindFirst).toHaveBeenCalledWith({ where: { id: "d-a", userId: "u-a" }, select: { id: true, isActive: true } });
  });

  it("upserts the unique project design relation and deletes only the owned relation", async () => {
    const upsert = vi.fn(async () => ({ id: "pd-a", projectId: "p-a", designId: "d-b" }));
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const repository = createProjectDesignRepository({ projectDesign: { upsert, deleteMany } } as unknown as PrismaClient);
    await repository.setForProject("p-a", "d-b");
    await repository.removeFromOwnedProject("p-a", "u-a");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { projectId: "p-a" }, create: { projectId: "p-a", designId: "d-b" }, update: { designId: "d-b" } }));
    expect(deleteMany).toHaveBeenCalledWith({ where: { projectId: "p-a", project: { is: { userId: "u-a" } } } });
  });
});
