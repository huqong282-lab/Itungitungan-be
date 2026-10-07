import type { SelectionType } from "../../generated/prisma/client.js";

export type Feature = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  baseEstimatedHours: number;
  isActive: boolean;
};

export type FeatureCreateInput = {
  name: string;
  description?: string | null;
  category?: string | null;
  baseEstimatedHours?: number;
};

export type FeatureUpdateInput = Partial<FeatureCreateInput>;

export type FeatureOptionInput = {
  name: string;
  selectionType: SelectionType;
};

export type FeatureOptionUpdateInput = Partial<FeatureOptionInput>;

export type FeatureStatusInput = { isActive: boolean };

export type FeatureListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
};

export type ResolvedFeatureListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  isActive?: boolean;
};

export type FeatureListResult = {
  data: Feature[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export class FeatureNotFoundError extends Error {
  constructor() {
    super("FEATURE_NOT_FOUND");
    this.name = "FeatureNotFoundError";
  }
}
export class FeatureOptionNotFoundError extends Error {
  constructor() {
    super("FEATURE_OPTION_NOT_FOUND");
    this.name = "FeatureOptionNotFoundError";
  }
}
