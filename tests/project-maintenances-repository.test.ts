import { describe, expect, it, vi } from "vitest";
import { Prisma, type PrismaClient } from "../src/generated/prisma/client.js";
import { createProjectMaintenanceRepository } from "../src/modules/project-maintenances/repository.js";
import { ProjectMaintenanceDuplicateError } from "../src/modules/project-maintenances/types.js";

describe("project maintenance repository ownership", () => {
  it("scopes project and plan lookups to the session owner and creates only the relation", async () => {
    const projectFindFirst = vi.fn(async () => ({ id: "project-a" }));
    const planFindFirst = vi.fn(async () => ({ id: "plan-a" }));
    const create = vi.fn(async () => ({}));
    const repository = createProjectMaintenanceRepository({ project: { findFirst: projectFindFirst }, maintenancePlan: { findFirst: planFindFirst }, projectMaintenance: { create } } as unknown as PrismaClient);
    await repository.findOwnedProject("project-a", "user-a");
    await repository.findMaintenancePlanForUser("plan-a", "user-a");
    await repository.createForProject("project-a", { maintenancePlanId: "plan-a" });
    expect(projectFindFirst).toHaveBeenCalledWith({ where: { id: "project-a", userId: "user-a" }, select: { id: true } });
    expect(planFindFirst).toHaveBeenCalledWith({ where: { id: "plan-a", userId: "user-a" }, select: { id: true } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: { projectId: "project-a", maintenancePlanId: "plan-a" } }));
  });

  it("maps Prisma unique violations and deletes only the owned project relation", async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const deletePlan = vi.fn();
    const repository = createProjectMaintenanceRepository({ projectMaintenance: { deleteMany, create: async () => { throw new Error("unused"); } }, maintenancePlan: { delete: deletePlan } } as unknown as PrismaClient);
    await repository.deleteOwned("project-a", "relation-a", "user-a");
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "relation-a", projectId: "project-a", project: { is: { userId: "user-a" } } } });
    expect(deletePlan).not.toHaveBeenCalled();

    const createErrorRepository = createProjectMaintenanceRepository({ projectMaintenance: { create: async () => { throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" }); } } } as unknown as PrismaClient);
    await expect(createErrorRepository.createForProject("project-a", { maintenancePlanId: "plan-a" })).rejects.toBeInstanceOf(ProjectMaintenanceDuplicateError);
  });
});
