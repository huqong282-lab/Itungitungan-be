import type { ProjectRepository } from "./repository.js";
import type { ProjectCreateInput, ProjectListQuery, ProjectListResult, ProjectUpdateInput } from "./types.js";
import { ProjectNotFoundError } from "./types.js";

export function createProjectService(repository: ProjectRepository) {
  return {
    async listProjects(userId: string, query: ProjectListQuery): Promise<ProjectListResult> {
      const resolved = { page: query.page ?? 1, pageSize: query.pageSize ?? 20 };
      const { data, total } = await repository.listByUserId(userId, resolved);
      return { data, meta: { ...resolved, total, totalPages: Math.ceil(total / resolved.pageSize) } };
    },
    async getProject(userId: string, id: string) {
      const project = await repository.findByIdAndUserId(id, userId);
      if (!project) throw new ProjectNotFoundError();
      return project;
    },
    async createProject(userId: string, input: ProjectCreateInput) { return await repository.createForUser(userId, input); },
    async updateProject(userId: string, id: string, input: ProjectUpdateInput) {
      const project = await repository.updateOwned(id, userId, input);
      if (!project) throw new ProjectNotFoundError();
      return project;
    },
  };
}
export type ProjectService = ReturnType<typeof createProjectService>;
