-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'QUOTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "SelectionType" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "developerRate" INTEGER NOT NULL,
    "workingHoursPerDay" INTEGER NOT NULL DEFAULT 8,
    "bufferPercentage" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "defaultMarginPercentage" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "defaultRushPercentage" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "freeRevisionCount" INTEGER NOT NULL DEFAULT 2,
    "additionalRevisionPrice" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "baseEstimatedHours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureOption" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selectionType" "SelectionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureOptionValue" (
    "id" TEXT NOT NULL,
    "featureOptionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureOptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internalCost" INTEGER NOT NULL,
    "clientPrice" INTEGER NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "billingPeriod" "BillingPeriod" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "deadline" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFeature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "overrideHours" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFeatureSelection" (
    "id" TEXT NOT NULL,
    "projectFeatureId" TEXT NOT NULL,
    "featureOptionId" TEXT NOT NULL,
    "featureOptionValueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFeatureSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectDesign" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectHosting" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hostingPlanId" TEXT,
    "label" TEXT NOT NULL DEFAULT 'Production',
    "clientProvided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectHosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMaintenance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "maintenancePlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "clientNameSnapshot" TEXT NOT NULL,
    "projectNameSnapshot" TEXT NOT NULL,
    "logoUrlSnapshot" TEXT,
    "deadlineSnapshot" TIMESTAMP(3),
    "developerRateSnapshot" INTEGER NOT NULL,
    "workingHoursPerDaySnapshot" INTEGER NOT NULL,
    "developmentHours" INTEGER NOT NULL,
    "bufferPercentage" DECIMAL(5,2) NOT NULL,
    "bufferedHours" INTEGER NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "developmentCost" INTEGER NOT NULL,
    "designCost" INTEGER NOT NULL,
    "hostingCost" INTEGER NOT NULL,
    "maintenanceCost" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "marginPercentage" DECIMAL(5,2) NOT NULL,
    "marginAmount" INTEGER NOT NULL,
    "rushFeePercentage" DECIMAL(5,2) NOT NULL,
    "rushFeeAmount" INTEGER NOT NULL,
    "freeRevisionCount" INTEGER NOT NULL,
    "additionalRevisionPrice" INTEGER NOT NULL,
    "finalPrice" INTEGER NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationFeature" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "featureNameSnapshot" TEXT NOT NULL,
    "baseHoursSnapshot" INTEGER NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "developerRateSnapshot" INTEGER NOT NULL,
    "developmentCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationFeatureSelection" (
    "id" TEXT NOT NULL,
    "quotationFeatureId" TEXT NOT NULL,
    "optionNameSnapshot" TEXT NOT NULL,
    "valueLabelSnapshot" TEXT NOT NULL,
    "hoursSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationFeatureSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationDesign" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationHosting" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "labelSnapshot" TEXT NOT NULL,
    "providerSnapshot" TEXT,
    "planSnapshot" TEXT,
    "internalCostSnapshot" INTEGER,
    "clientPriceSnapshot" INTEGER NOT NULL,
    "clientProvided" BOOLEAN NOT NULL,
    "billingPeriodSnapshot" "BillingPeriod",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationHosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationMaintenance" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,
    "billingPeriodSnapshot" "BillingPeriod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperSettings_userId_key" ON "DeveloperSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Feature_userId_isActive_idx" ON "Feature"("userId", "isActive");

-- CreateIndex
CREATE INDEX "FeatureOption_featureId_idx" ON "FeatureOption"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureOption_featureId_name_key" ON "FeatureOption"("featureId", "name");

-- CreateIndex
CREATE INDEX "FeatureOptionValue_featureOptionId_isActive_idx" ON "FeatureOptionValue"("featureOptionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureOptionValue_featureOptionId_label_key" ON "FeatureOptionValue"("featureOptionId", "label");

-- CreateIndex
CREATE INDEX "Design_userId_isActive_idx" ON "Design"("userId", "isActive");

-- CreateIndex
CREATE INDEX "HostingPlan_userId_isActive_idx" ON "HostingPlan"("userId", "isActive");

-- CreateIndex
CREATE INDEX "MaintenancePlan_userId_isActive_idx" ON "MaintenancePlan"("userId", "isActive");

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");

-- CreateIndex
CREATE INDEX "Project_userId_createdAt_idx" ON "Project"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectFeature_projectId_idx" ON "ProjectFeature"("projectId");

-- CreateIndex
CREATE INDEX "ProjectFeature_featureId_idx" ON "ProjectFeature"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFeature_projectId_featureId_key" ON "ProjectFeature"("projectId", "featureId");

-- CreateIndex
CREATE INDEX "ProjectFeatureSelection_projectFeatureId_idx" ON "ProjectFeatureSelection"("projectFeatureId");

-- CreateIndex
CREATE INDEX "ProjectFeatureSelection_featureOptionId_idx" ON "ProjectFeatureSelection"("featureOptionId");

-- CreateIndex
CREATE INDEX "ProjectFeatureSelection_featureOptionValueId_idx" ON "ProjectFeatureSelection"("featureOptionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFeatureSelection_projectFeatureId_featureOptionId_fe_key" ON "ProjectFeatureSelection"("projectFeatureId", "featureOptionId", "featureOptionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectDesign_projectId_key" ON "ProjectDesign"("projectId");

-- CreateIndex
CREATE INDEX "ProjectDesign_designId_idx" ON "ProjectDesign"("designId");

-- CreateIndex
CREATE INDEX "ProjectHosting_projectId_idx" ON "ProjectHosting"("projectId");

-- CreateIndex
CREATE INDEX "ProjectHosting_hostingPlanId_idx" ON "ProjectHosting"("hostingPlanId");

-- CreateIndex
CREATE INDEX "ProjectMaintenance_projectId_idx" ON "ProjectMaintenance"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMaintenance_maintenancePlanId_idx" ON "ProjectMaintenance"("maintenancePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMaintenance_projectId_maintenancePlanId_key" ON "ProjectMaintenance"("projectId", "maintenancePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_projectId_status_idx" ON "Quotation"("projectId", "status");

-- CreateIndex
CREATE INDEX "Quotation_createdAt_idx" ON "Quotation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_projectId_version_key" ON "Quotation"("projectId", "version");

-- CreateIndex
CREATE INDEX "QuotationFeature_quotationId_idx" ON "QuotationFeature"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationFeatureSelection_quotationFeatureId_idx" ON "QuotationFeatureSelection"("quotationFeatureId");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationDesign_quotationId_key" ON "QuotationDesign"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationHosting_quotationId_idx" ON "QuotationHosting"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationMaintenance_quotationId_idx" ON "QuotationMaintenance"("quotationId");

-- AddForeignKey
ALTER TABLE "DeveloperSettings" ADD CONSTRAINT "DeveloperSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureOption" ADD CONSTRAINT "FeatureOption_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureOptionValue" ADD CONSTRAINT "FeatureOptionValue_featureOptionId_fkey" FOREIGN KEY ("featureOptionId") REFERENCES "FeatureOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostingPlan" ADD CONSTRAINT "HostingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeature" ADD CONSTRAINT "ProjectFeature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeature" ADD CONSTRAINT "ProjectFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeatureSelection" ADD CONSTRAINT "ProjectFeatureSelection_projectFeatureId_fkey" FOREIGN KEY ("projectFeatureId") REFERENCES "ProjectFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeatureSelection" ADD CONSTRAINT "ProjectFeatureSelection_featureOptionId_fkey" FOREIGN KEY ("featureOptionId") REFERENCES "FeatureOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeatureSelection" ADD CONSTRAINT "ProjectFeatureSelection_featureOptionValueId_fkey" FOREIGN KEY ("featureOptionValueId") REFERENCES "FeatureOptionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDesign" ADD CONSTRAINT "ProjectDesign_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDesign" ADD CONSTRAINT "ProjectDesign_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectHosting" ADD CONSTRAINT "ProjectHosting_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectHosting" ADD CONSTRAINT "ProjectHosting_hostingPlanId_fkey" FOREIGN KEY ("hostingPlanId") REFERENCES "HostingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaintenance" ADD CONSTRAINT "ProjectMaintenance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaintenance" ADD CONSTRAINT "ProjectMaintenance_maintenancePlanId_fkey" FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationFeature" ADD CONSTRAINT "QuotationFeature_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationFeatureSelection" ADD CONSTRAINT "QuotationFeatureSelection_quotationFeatureId_fkey" FOREIGN KEY ("quotationFeatureId") REFERENCES "QuotationFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationDesign" ADD CONSTRAINT "QuotationDesign_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationHosting" ADD CONSTRAINT "QuotationHosting_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationMaintenance" ADD CONSTRAINT "QuotationMaintenance_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraints for non-negative money and hours, positive workday hours,
-- and percentages constrained to 0..100.
ALTER TABLE "DeveloperSettings"
  ADD CONSTRAINT "DeveloperSettings_developerRate_nonnegative" CHECK ("developerRate" >= 0),
  ADD CONSTRAINT "DeveloperSettings_workingHoursPerDay_positive" CHECK ("workingHoursPerDay" > 0),
  ADD CONSTRAINT "DeveloperSettings_bufferPercentage_range" CHECK ("bufferPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "DeveloperSettings_defaultMarginPercentage_range" CHECK ("defaultMarginPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "DeveloperSettings_defaultRushPercentage_range" CHECK ("defaultRushPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "DeveloperSettings_freeRevisionCount_nonnegative" CHECK ("freeRevisionCount" >= 0),
  ADD CONSTRAINT "DeveloperSettings_additionalRevisionPrice_nonnegative" CHECK ("additionalRevisionPrice" >= 0);

ALTER TABLE "Feature"
  ADD CONSTRAINT "Feature_baseEstimatedHours_nonnegative" CHECK ("baseEstimatedHours" >= 0);

ALTER TABLE "FeatureOptionValue"
  ADD CONSTRAINT "FeatureOptionValue_estimatedHours_nonnegative" CHECK ("estimatedHours" >= 0);

ALTER TABLE "Design"
  ADD CONSTRAINT "Design_price_nonnegative" CHECK ("price" >= 0);

ALTER TABLE "HostingPlan"
  ADD CONSTRAINT "HostingPlan_internalCost_nonnegative" CHECK ("internalCost" >= 0),
  ADD CONSTRAINT "HostingPlan_clientPrice_nonnegative" CHECK ("clientPrice" >= 0);

ALTER TABLE "MaintenancePlan"
  ADD CONSTRAINT "MaintenancePlan_price_nonnegative" CHECK ("price" >= 0);

ALTER TABLE "ProjectFeature"
  ADD CONSTRAINT "ProjectFeature_overrideHours_nonnegative" CHECK ("overrideHours" IS NULL OR "overrideHours" >= 0);

ALTER TABLE "Quotation"
  ADD CONSTRAINT "Quotation_developerRateSnapshot_nonnegative" CHECK ("developerRateSnapshot" >= 0),
  ADD CONSTRAINT "Quotation_workingHoursPerDaySnapshot_positive" CHECK ("workingHoursPerDaySnapshot" > 0),
  ADD CONSTRAINT "Quotation_developmentHours_nonnegative" CHECK ("developmentHours" >= 0),
  ADD CONSTRAINT "Quotation_bufferPercentage_range" CHECK ("bufferPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Quotation_bufferedHours_nonnegative" CHECK ("bufferedHours" >= 0),
  ADD CONSTRAINT "Quotation_workingDays_nonnegative" CHECK ("workingDays" >= 0),
  ADD CONSTRAINT "Quotation_developmentCost_nonnegative" CHECK ("developmentCost" >= 0),
  ADD CONSTRAINT "Quotation_designCost_nonnegative" CHECK ("designCost" >= 0),
  ADD CONSTRAINT "Quotation_hostingCost_nonnegative" CHECK ("hostingCost" >= 0),
  ADD CONSTRAINT "Quotation_maintenanceCost_nonnegative" CHECK ("maintenanceCost" >= 0),
  ADD CONSTRAINT "Quotation_subtotal_nonnegative" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "Quotation_marginPercentage_range" CHECK ("marginPercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Quotation_marginAmount_nonnegative" CHECK ("marginAmount" >= 0),
  ADD CONSTRAINT "Quotation_rushFeePercentage_range" CHECK ("rushFeePercentage" BETWEEN 0 AND 100),
  ADD CONSTRAINT "Quotation_rushFeeAmount_nonnegative" CHECK ("rushFeeAmount" >= 0),
  ADD CONSTRAINT "Quotation_freeRevisionCount_nonnegative" CHECK ("freeRevisionCount" >= 0),
  ADD CONSTRAINT "Quotation_additionalRevisionPrice_nonnegative" CHECK ("additionalRevisionPrice" >= 0),
  ADD CONSTRAINT "Quotation_finalPrice_nonnegative" CHECK ("finalPrice" >= 0);

ALTER TABLE "QuotationFeature"
  ADD CONSTRAINT "QuotationFeature_baseHoursSnapshot_nonnegative" CHECK ("baseHoursSnapshot" >= 0),
  ADD CONSTRAINT "QuotationFeature_estimatedHours_nonnegative" CHECK ("estimatedHours" >= 0),
  ADD CONSTRAINT "QuotationFeature_developerRateSnapshot_nonnegative" CHECK ("developerRateSnapshot" >= 0),
  ADD CONSTRAINT "QuotationFeature_developmentCost_nonnegative" CHECK ("developmentCost" >= 0);

ALTER TABLE "QuotationFeatureSelection"
  ADD CONSTRAINT "QuotationFeatureSelection_hoursSnapshot_nonnegative" CHECK ("hoursSnapshot" >= 0);

ALTER TABLE "QuotationDesign"
  ADD CONSTRAINT "QuotationDesign_priceSnapshot_nonnegative" CHECK ("priceSnapshot" >= 0);

ALTER TABLE "QuotationHosting"
  ADD CONSTRAINT "QuotationHosting_internalCostSnapshot_nonnegative" CHECK ("internalCostSnapshot" IS NULL OR "internalCostSnapshot" >= 0),
  ADD CONSTRAINT "QuotationHosting_clientPriceSnapshot_nonnegative" CHECK ("clientPriceSnapshot" >= 0);

ALTER TABLE "QuotationMaintenance"
  ADD CONSTRAINT "QuotationMaintenance_priceSnapshot_nonnegative" CHECK ("priceSnapshot" >= 0);
