import type { ProjectMaintenanceRepository } from "./repository.js";
import type { ProjectMaintenanceCreateInput } from "./types.js";
import { ProjectMaintenanceNotFoundError, ProjectMaintenancePlanNotFoundError, ProjectMaintenanceProjectNotFoundError } from "./types.js";

export function createProjectMaintenanceService(repository: ProjectMaintenanceRepository) {
  return {
    async addMaintenance(userId: string, projectId: string, input: ProjectMaintenanceCreateInput) {
      if (!await repository.findOwnedProject(projectId, userId)) throw new ProjectMaintenanceProjectNotFoundError();
      if (!await repository.findMaintenancePlanForUser(input.maintenancePlanId, userId)) throw new ProjectMaintenancePlanNotFoundError();
      return repository.createForProject(projectId, input);
    },
    async removeMaintenance(userId: string, projectId: string, maintenanceId: string) {
      if (!await repository.deleteOwned(projectId, maintenanceId, userId)) throw new ProjectMaintenanceNotFoundError();
    },
  };
}

export type ProjectMaintenanceService = ReturnType<typeof createProjectMaintenanceService>;
