export type ProjectHostingCreateInput = {
  label: string;
  hostingPlanId: string | null;
  clientProvided: boolean;
};

export type ProjectHostingUpdateInput = {
  label?: string;
  hostingPlanId?: string | null;
  clientProvided?: boolean;
};

export class ProjectHostingNotFoundError extends Error {
  constructor() { super("PROJECT_HOSTING_NOT_FOUND"); this.name = "ProjectHostingNotFoundError"; }
}
export class ProjectHostingProjectNotFoundError extends Error {
  constructor() { super("PROJECT_NOT_FOUND"); this.name = "ProjectHostingProjectNotFoundError"; }
}
export class ProjectHostingPlanNotFoundError extends Error {
  constructor() { super("HOSTING_PLAN_NOT_FOUND"); this.name = "ProjectHostingPlanNotFoundError"; }
}
export class ProjectHostingRuleError extends Error {
  constructor(message: string) { super(message); this.name = "ProjectHostingRuleError"; }
}
