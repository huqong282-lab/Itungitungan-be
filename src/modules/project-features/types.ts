export type ProjectFeatureCreateInput = { featureId: string };
export type ProjectFeatureUpdateInput = { overrideHours?: number | null; notes?: string | null };
export type ProjectFeatureSelectionInput = { featureOptionId: string; featureOptionValueId: string };
export type ReplaceProjectFeatureSelectionsInput = { selections: ProjectFeatureSelectionInput[] };

export class ProjectFeatureNotFoundError extends Error {
  constructor() { super("PROJECT_FEATURE_NOT_FOUND"); this.name = "ProjectFeatureNotFoundError"; }
}
export class ProjectFeatureConflictError extends Error {
  constructor() { super("PROJECT_FEATURE_ALREADY_EXISTS"); this.name = "ProjectFeatureConflictError"; }
}
export class ProjectFeatureRuleError extends Error {
  constructor(message: string) { super(message); this.name = "ProjectFeatureRuleError"; }
}
