import type { BillingPeriod } from "../../generated/prisma/client.js";

export type HostingPlan = {
  id: string;
  provider: string;
  name: string;
  internalCost: number;
  clientPrice: number;
  billingPeriod: BillingPeriod;
  isActive: boolean;
};

export type HostingPlanCreateInput = {
  provider: string;
  name: string;
  internalCost: number;
  clientPrice: number;
  billingPeriod: BillingPeriod;
};

export type HostingPlanUpdateInput = Partial<HostingPlanCreateInput>;
export type HostingPlanStatusInput = { isActive: boolean };

export type HostingPlanListQuery = { page?: number; pageSize?: number; search?: string; isActive?: boolean };
export type ResolvedHostingPlanListQuery = { page: number; pageSize: number; search?: string; isActive?: boolean };
export type HostingPlanListResult = {
  data: HostingPlan[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export class HostingPlanNotFoundError extends Error {
  constructor() {
    super("HOSTING_PLAN_NOT_FOUND");
    this.name = "HostingPlanNotFoundError";
  }
}
