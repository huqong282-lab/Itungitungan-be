export type Design = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
};

export type DesignCreateInput = {
  name: string;
  description?: string | null;
  price: number;
};

export type DesignUpdateInput = Partial<DesignCreateInput>;
export type DesignStatusInput = { isActive: boolean };

export type DesignListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
};

export type ResolvedDesignListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean;
};

export type DesignListResult = {
  data: Design[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export class DesignNotFoundError extends Error {
  constructor() {
    super("DESIGN_NOT_FOUND");
    this.name = "DesignNotFoundError";
  }
}
