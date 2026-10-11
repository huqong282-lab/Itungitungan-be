import type { ProjectDesignRepository } from "./repository.js";
import type { SetProjectDesignInput } from "./types.js";
import { ProjectDesignNotFoundError, ProjectDesignRuleError } from "./types.js";

export function createProjectDesignService(repository: ProjectDesignRepository) {
  return {
    async setDesign(userId: string, projectId: string, input: SetProjectDesignInput) {
      if (!await repository.findOwnedProject(projectId, userId)) throw new ProjectDesignNotFoundError();
      const design = await repository.findDesignForUser(input.designId, userId);
      if (!design) throw new ProjectDesignNotFoundError();
      if (!design.isActive) throw new ProjectDesignRuleError("DESIGN_INACTIVE");
      return await repository.setForProject(projectId, input.designId);
    },
    async removeDesign(userId: string, projectId: string) {
      if (!await repository.removeFromOwnedProject(projectId, userId)) throw new ProjectDesignNotFoundError();
    },
  };
}
export type ProjectDesignService = ReturnType<typeof createProjectDesignService>;
