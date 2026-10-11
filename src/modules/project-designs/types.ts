export type SetProjectDesignInput = { designId: string };
export type ProjectDesign = { id: string; projectId: string; designId: string; createdAt: Date; updatedAt: Date };

export class ProjectDesignNotFoundError extends Error {
  constructor() { super("PROJECT_OR_DESIGN_NOT_FOUND"); this.name = "ProjectDesignNotFoundError"; }
}
export class ProjectDesignRuleError extends Error {
  constructor(message: string) { super(message); this.name = "ProjectDesignRuleError"; }
}
