import type { ProjectHostingRepository } from "./repository.js";
import type { ProjectHostingCreateInput, ProjectHostingUpdateInput } from "./types.js";
import { ProjectHostingNotFoundError, ProjectHostingPlanNotFoundError, ProjectHostingProjectNotFoundError, ProjectHostingRuleError } from "./types.js";

export function createProjectHostingService(repository: ProjectHostingRepository) {
  return {
    async addHosting(userId: string, projectId: string, input: ProjectHostingCreateInput) {
      if (!await repository.findOwnedProject(projectId, userId)) throw new ProjectHostingProjectNotFoundError();
      await validatePlanSelection(repository, userId, input.hostingPlanId, input.clientProvided);
      return await repository.createForProject(projectId, input);
    },
    async updateHosting(userId: string, projectId: string, hostingId: string, input: ProjectHostingUpdateInput) {
      const current = await repository.findOwnedHosting(projectId, hostingId, userId);
      if (!current) throw new ProjectHostingNotFoundError();
      const clientProvided = input.clientProvided ?? current.clientProvided;
      const hostingPlanId = input.hostingPlanId !== undefined ? input.hostingPlanId : current.hostingPlanId;
      await validatePlanSelection(repository, userId, hostingPlanId, clientProvided, input.hostingPlanId !== undefined);
      const updated = await repository.updateOwned(projectId, hostingId, userId, input);
      if (!updated) throw new ProjectHostingNotFoundError();
      return updated;
    },
    async removeHosting(userId: string, projectId: string, hostingId: string) {
      if (!await repository.deleteOwned(projectId, hostingId, userId)) throw new ProjectHostingNotFoundError();
    },
  };
}
export type ProjectHostingService = ReturnType<typeof createProjectHostingService>;

async function validatePlanSelection(repository: ProjectHostingRepository, userId: string, hostingPlanId: string | null, clientProvided: boolean, planWasSet = true) {
  if (clientProvided) {
    if (hostingPlanId !== null) throw new ProjectHostingRuleError("CLIENT_PROVIDED_REQUIRES_NULL_HOSTING_PLAN");
    return;
  }
  if (hostingPlanId === null) throw new ProjectHostingRuleError("HOSTING_PLAN_REQUIRED");
  if (!planWasSet) return;
  const plan = await repository.findHostingPlanForUser(hostingPlanId, userId);
  if (!plan) throw new ProjectHostingPlanNotFoundError();
  if (!plan.isActive) throw new ProjectHostingRuleError("HOSTING_PLAN_INACTIVE");
}
