import type { ProjectCalculationSnapshot } from "../calculations/service.js";

export type CreateDraftQuotationInput = ProjectCalculationSnapshot;

export type QuotationListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "DRAFT" | "FINAL";
  projectId?: string;
  sort?: "createdAt" | "quotationNumber" | "finalPrice" | "version";
  order?: "asc" | "desc";
};
export type ResolvedQuotationListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: "DRAFT" | "FINAL";
  projectId?: string;
  sort: NonNullable<QuotationListQuery["sort"]>;
  order: NonNullable<QuotationListQuery["order"]>;
};
export type QuotationSummary = {
  id: string;
  quotationNumber: string;
  projectId: string;
  version: number;
  status: "DRAFT" | "FINAL";
  clientName: string;
  projectName: string;
  finalPrice: number;
  createdAt: Date;
};
export type QuotationListResult = {
  data: QuotationSummary[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type CreatedQuotation = {
  id: string;
  quotationNumber: string;
  version: number;
  status: "DRAFT";
  finalPrice: number;
  workingDays: number;
  createdAt: Date;
};

export type FinalizedQuotation = {
  id: string;
  quotationNumber: string;
  version: number;
  status: "FINAL";
  finalizedAt: Date;
};

export type QuotationDetail = {
  header: {
    id: string;
    quotationNumber: string;
    version: number;
    status: "DRAFT" | "FINAL";
    clientName: string;
    projectName: string;
    logoUrl: string | null;
    deadline: string | null;
    developerRate: number;
    finalizedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  features: Array<{
    name: string;
    baseHours: number;
    estimatedHours: number;
    developerRate: number;
    developmentCost: number;
    selections: Array<{ optionName: string; valueLabel: string; hours: number }>;
  }>;
  design: { name: string; price: number } | null;
  hostings: Array<{
    label: string;
    provider: string | null;
    plan: string | null;
    internalCost: number | null;
    clientPrice: number;
    clientProvided: boolean;
    billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" | null;
  }>;
  maintenances: Array<{ name: string; price: number; billingPeriod: "MONTHLY" | "YEARLY" | "ONE_TIME" }>;
  timeline: {
    estimatedHours: number;
    bufferPercentage: number;
    bufferedHours: number;
    workingHoursPerDay: number;
    workingDays: number;
  };
  pricing: {
    developmentCost: number;
    designCost: number;
    hostingCost: number;
    maintenanceCost: number;
    subtotal: number;
    marginPercentage: number;
    marginAmount: number;
    rushFeePercentage: number;
    rushFeeAmount: number;
    finalPrice: number;
  };
  revisionPolicy: { freeRevisionCount: number; additionalRevisionPrice: number };
};

export class QuotationProjectNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "QuotationProjectNotFoundError";
  }
}

export class DraftQuotationAlreadyExistsError extends Error {
  constructor() {
    super("A draft quotation already exists for this project");
    this.name = "DraftQuotationAlreadyExistsError";
  }
}

export class QuotationDataInvalidError extends Error {
  constructor() {
    super("Quotation data is invalid");
    this.name = "QuotationDataInvalidError";
  }
}

export class QuotationNotFoundError extends Error {
  constructor() {
    super("Quotation not found");
    this.name = "QuotationNotFoundError";
  }
}

export class QuotationFinalizedError extends Error {
  constructor() {
    super("Final quotations cannot be modified.");
    this.name = "QuotationFinalizedError";
  }
}

export class QuotationDetailNotFoundError extends Error {
  constructor() {
    super("Quotation not found");
    this.name = "QuotationDetailNotFoundError";
  }
}

export class QuotationProjectFilterNotFoundError extends Error {
  constructor() {
    super("Project not found");
    this.name = "QuotationProjectFilterNotFoundError";
  }
}
