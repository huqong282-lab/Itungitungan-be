import { describe, expect, it, vi } from "vitest";
import type { ProjectRepository } from "../src/modules/projects/repository.js";
import { createProjectService } from "../src/modules/projects/service.js";
import { ProjectNotFoundError } from "../src/modules/projects/types.js";

const project = { id: "project-a", clientName: "Client", projectName: "Website", logoUrl: null, deadline: null, status: "DRAFT" as const, createdAt: new Date(), updatedAt: new Date() };
describe("project service ownership", () => {
  it("applies default pagination through the session owner", async () => {
    const repository = { listByUserId: vi.fn(async () => ({ data: [project], total: 1 })) } as unknown as ProjectRepository;
    const result = await createProjectService(repository).listProjects("user-a", {});
    expect(repository.listByUserId).toHaveBeenCalledWith("user-a", { page: 1, pageSize: 20 });
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1, totalPages: 1 });
  });
  it("creates for the session user and maps missing owned records to not found", async () => {
    const repository = { createForUser: vi.fn(async () => project), findByIdAndUserId: vi.fn(async () => null), updateOwned: vi.fn(async () => null) } as unknown as ProjectRepository;
    const service = createProjectService(repository);
    await service.createProject("user-a", { clientName: "Client", projectName: "Website" });
    expect(repository.createForUser).toHaveBeenCalledWith("user-a", { clientName: "Client", projectName: "Website" });
    await expect(service.getProject("user-a", "foreign")).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(service.updateProject("user-a", "foreign", { projectName: "Changed" })).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});
