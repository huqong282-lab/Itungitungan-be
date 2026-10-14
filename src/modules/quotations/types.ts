import type { ProjectCalculationSnapshot } from "../calculations/service.js";

export type CreateDraftQuotationInput = ProjectCalculationSnapshot;

export type CreatedQuotation = {
  id: string;
  quotationNumber: string;
  version: number;
  status: "DRAFT";
  finalPrice: number;
  workingDays: number;
  createdAt: Date;
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
