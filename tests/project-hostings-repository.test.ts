import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { createProjectHostingRepository } from "../src/modules/project-hostings/repository.js";

describe("project hosting repository ownership", () => {
  it("checks project and plan ownership, and stores only project hosting fields", async () => {
    const projectFindFirst = vi.fn(async () => ({ id: "project-a" }));
    const planFindFirst = vi.fn(async () => ({ id: "plan-a", isActive: true }));
    const create = vi.fn(async () => ({}));
    const repository = createProjectHostingRepository({ project: { findFirst: projectFindFirst }, hostingPlan: { findFirst: planFindFirst }, projectHosting: { create } } as unknown as PrismaClient);
    await repository.findOwnedProject("project-a", "user-a");
    await repository.findHostingPlanForUser("plan-a", "user-a");
    await repository.createForProject("project-a", { label: "Production", hostingPlanId: "plan-a", clientProvided: false });
    expect(projectFindFirst).toHaveBeenCalledWith({ where: { id: "project-a", userId: "user-a" }, select: { id: true } });
    expect(planFindFirst).toHaveBeenCalledWith({ where: { id: "plan-a", userId: "user-a" }, select: { id: true, isActive: true } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { projectId: "project-a", label: "Production", hostingPlanId: "plan-a", clientProvided: false } }));
  });

  it("scopes update and delete through hosting ID, project ID, and project owner", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const findFirst = vi.fn(async () => ({ id: "hosting-a" }));
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const repository = createProjectHostingRepository({ projectHosting: { updateMany, findFirst, deleteMany } } as unknown as PrismaClient);
    await repository.findOwnedHosting("project-a", "hosting-a", "user-a");
    await repository.updateOwned("project-a", "hosting-a", "user-a", { label: "Staging" });
    await repository.deleteOwned("project-a", "hosting-a", "user-a");
    const where = { id: "hosting-a", projectId: "project-a", project: { is: { userId: "user-a" } } };
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(updateMany).toHaveBeenCalledWith({ where, data: { label: "Staging" } });
    expect(deleteMany).toHaveBeenCalledWith({ where });
  });
});
