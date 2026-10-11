import type { BillingPeriod } from "../../generated/prisma/client.js";

export type MaintenancePlan = { id: string; name: string; price: number; billingPeriod: BillingPeriod; isActive: boolean };
export type MaintenancePlanCreateInput = { name: string; price: number; billingPeriod: BillingPeriod };
export type MaintenancePlanUpdateInput = Partial<MaintenancePlanCreateInput>;
export type MaintenancePlanStatusInput = { isActive: boolean };
export type MaintenancePlanListQuery = { page?: number; pageSize?: number; search?: string; isActive?: boolean };
export type ResolvedMaintenancePlanListQuery = { page: number; pageSize: number; search?: string; isActive?: boolean };
export type MaintenancePlanListResult = { data: MaintenancePlan[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export class MaintenancePlanNotFoundError extends Error {
  constructor() { super("MAINTENANCE_PLAN_NOT_FOUND"); this.name = "MaintenancePlanNotFoundError"; }
}
