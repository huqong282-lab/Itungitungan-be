export type Project = {
  id: string;
  clientName: string;
  projectName: string;
  logoUrl: string | null;
  deadline: Date | null;
  status: "DRAFT" | "QUOTED" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectCreateInput = { clientName: string; projectName: string; logoUrl?: string | null; deadline?: string | null };
export type ProjectUpdateInput = Partial<ProjectCreateInput>;
export type ProjectListQuery = { page?: number; pageSize?: number };
export type ResolvedProjectListQuery = { page: number; pageSize: number };
export type ProjectListResult = { data: Project[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export class ProjectNotFoundError extends Error {
  constructor() { super("PROJECT_NOT_FOUND"); this.name = "ProjectNotFoundError"; }
}
