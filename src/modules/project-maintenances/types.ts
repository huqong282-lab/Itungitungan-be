export type ProjectMaintenanceCreateInput = { maintenancePlanId: string };

export class ProjectMaintenanceNotFoundError extends Error {
  constructor() { super("PROJECT_MAINTENANCE_NOT_FOUND"); this.name = "ProjectMaintenanceNotFoundError"; }
}
export class ProjectMaintenancePlanNotFoundError extends Error {
  constructor() { super("MAINTENANCE_PLAN_NOT_FOUND"); this.name = "ProjectMaintenancePlanNotFoundError"; }
}
export class ProjectMaintenanceProjectNotFoundError extends Error {
  constructor() { super("PROJECT_NOT_FOUND"); this.name = "ProjectMaintenanceProjectNotFoundError"; }
}
export class ProjectMaintenanceDuplicateError extends Error {
  constructor() { super("MAINTENANCE_ALREADY_ADDED"); this.name = "ProjectMaintenanceDuplicateError"; }
}
