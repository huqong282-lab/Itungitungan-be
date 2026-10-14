import { describe, expect, it, vi } from "vitest";
import { createCalculationService } from "../src/modules/calculations/service.js";
import type { CalculationProjectData, CalculationRepositoryPort, CalculationSettingsData } from "../src/modules/calculations/repository.js";

const project = {
  id: "project-a",
  userId: "user-a",
  clientName: "Client A",
  projectName: "Project A",
  logoUrl: null,
  deadline: new Date("2026-10-22T00:00:00.000Z"),
  features: [{
    featureId: "feature-a",
    overrideHours: null,
    feature: { id: "feature-a", userId: "user-a", name: "Authentication", baseEstimatedHours: 40 },
    selections: [{
      featureOptionId: "option-a",
      featureOption: { id: "option-a", featureId: "feature-a", name: "Provider", selectionType: "SINGLE" as const },
      featureOptionValue: { id: "value-a", featureOptionId: "option-a", label: "Custom", estimatedHours: 4 },
    }],
  }],
  design: { design: { userId: "user-a", name: "Premium UI", price: 1_000_000 } },
  hostings: [{ label: "Production", clientProvided: false, hostingPlan: { userId: "user-a", provider: "Cloud", name: "VPS", internalCost: 150_000, clientPrice: 200_000, billingPeriod: "MONTHLY" as const } }],
  maintenances: [{ maintenancePlan: { userId: "user-a", name: "Monthly maintenance", price: 500_000, billingPeriod: "MONTHLY" as const } }],
} satisfies CalculationProjectData;

const settings = {
  developerRate: 100_000,
  workingHoursPerDay: 8,
  bufferPercentage: 20,
  defaultMarginPercentage: 30,
  defaultRushPercentage: 30,
  freeRevisionCount: 2,
  additionalRevisionPrice: 200_000,
} satisfies CalculationSettingsData;

function createRepository(overrides: {
  project?: CalculationProjectData | null;
  settings?: CalculationSettingsData | null;
} = {}): CalculationRepositoryPort {
  return {
    findOwnedProjectForCalculation: vi.fn(async () => overrides.project === undefined ? project : overrides.project),
    findSettingsForUser: vi.fn(async () => overrides.settings === undefined ? settings : overrides.settings),
  };
}

describe("project calculation service", () => {
  it("integrates the estimation, buffer, timeline, rush, and pricing engines from owned project data", async () => {
    const repository = createRepository();
    const service = createCalculationService(repository, () => new Date("2026-10-13T17:35:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toEqual({
      estimatedHours: 44,
      bufferPercentage: 20,
      bufferedHours: 53,
      workingHoursPerDay: 8,
      workingDays: 7,
      deadline: "2026-10-22T00:00:00.000Z",
      deadlineStatus: "NORMAL",
      developmentCost: 4_400_000,
      designCost: 1_000_000,
      hostingCost: 200_000,
      maintenanceCost: 500_000,
      subtotal: 6_100_000,
      marginPercentage: 30,
      marginAmount: 1_830_000,
      rushFeePercentage: 0,
      rushFeeAmount: 0,
      finalPrice: 7_930_000,
      revisionPolicy: { freeRevisionCount: 2, additionalRevisionPrice: 200_000 },
    });
    expect(repository.findOwnedProjectForCalculation).toHaveBeenCalledWith("project-a", "user-a");
    expect(repository.findSettingsForUser).toHaveBeenCalledWith("user-a");
  });

  it("returns a snapshot breakdown from the same validated data and calculation", async () => {
    const service = createCalculationService(createRepository(), () => new Date("2026-10-13T00:00:00.000Z"));
    const result = await service.calculateProjectSnapshot("user-a", "project-a");

    expect(result.calculation.estimatedHours).toBe(44);
    expect(result.snapshot).toMatchObject({
      clientName: "Client A",
      projectName: "Project A",
      developerRate: 100_000,
      features: [{
        name: "Authentication",
        baseHours: 40,
        estimatedHours: 44,
        developmentCost: 4_400_000,
        selections: [{ optionName: "Provider", valueLabel: "Custom", hours: 4 }],
      }],
      design: { name: "Premium UI", price: 1_000_000 },
      hostings: [{ label: "Production", provider: "Cloud", plan: "VPS", internalCost: 150_000, clientPrice: 200_000, clientProvided: false, billingPeriod: "MONTHLY" }],
      maintenances: [{ name: "Monthly maintenance", price: 500_000, billingPeriod: "MONTHLY" }],
    });
  });

  it("uses the requested marginPercentage while deriving all other inputs from the repository", async () => {
    const service = createCalculationService(createRepository(), () => new Date("2026-10-13T00:00:00.000Z"));
    const result = await service.calculateProject("user-a", "project-a", { marginPercentage: 0 });

    expect(result.marginPercentage).toBe(0);
    expect(result.marginAmount).toBe(0);
    expect(result.finalPrice).toBe(result.subtotal);
  });

  it("uses zero-cost hosting provided by the client", async () => {
    const clientHostingProject = { ...project, hostings: [{ label: "Production", clientProvided: true, hostingPlan: null }] } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: clientHostingProject }), () => new Date("2026-10-13T00:00:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({ hostingCost: 0 });
  });

  it("uses base feature hours when no option values are selected", async () => {
    const simpleFeatureProject = {
      ...project,
      features: [{ ...project.features[0], feature: { ...project.features[0].feature, baseEstimatedHours: 5 }, selections: [] }],
    } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: simpleFeatureProject }), () => new Date("2026-10-13T00:00:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({ estimatedHours: 5, bufferedHours: 6 });
  });

  it("keeps a zero project feature override as a valid estimate", async () => {
    const zeroOverrideProject = {
      ...project,
      features: [{ ...project.features[0], overrideHours: 0 }],
      design: null,
      hostings: [],
      maintenances: [],
      deadline: null,
    } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: zeroOverrideProject }));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({
      estimatedHours: 0,
      bufferedHours: 0,
      workingDays: 0,
      developmentCost: 0,
      subtotal: 0,
      finalPrice: 0,
    });
  });

  it("rejects a calculated development cost above the Prisma Int limit", async () => {
    const expensiveSettings = { ...settings, developerRate: 100_000_000 } satisfies CalculationSettingsData;
    const service = createCalculationService(createRepository({ settings: expensiveSettings }));

    await expect(service.calculateProject("user-a", "project-a")).rejects.toThrow("CALCULATION_OUT_OF_RANGE");
  });

  it("applies the configured rush fee once when completion falls after the deadline", async () => {
    const rushProject = { ...project, deadline: new Date("2026-10-20T00:00:00.000Z") } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: rushProject }), () => new Date("2026-10-13T00:00:00.000Z"));
    const result = await service.calculateProject("user-a", "project-a");

    expect(result.deadlineStatus).toBe("RUSH");
    expect(result.rushFeePercentage).toBe(30);
    expect(result.rushFeeAmount).toBe(2_379_000);
    expect(result.finalPrice).toBe(result.subtotal + result.marginAmount + result.rushFeeAmount);
  });

  it("treats the deadline on estimated completion day as NORMAL", async () => {
    const equalityProject = { ...project, deadline: new Date("2026-10-21T00:00:00.000Z") } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: equalityProject }), () => new Date("2026-10-13T00:00:00.000Z"));
    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({ deadlineStatus: "NORMAL", rushFeeAmount: 0 });
  });

  it("counts today as the first workday when the calculation starts on a weekday", async () => {
    const oneDayProject = {
      ...project,
      features: [{ ...project.features[0], overrideHours: 8, feature: { ...project.features[0].feature, baseEstimatedHours: 8 }, selections: [] }],
      deadline: new Date("2026-10-13T00:00:00.000Z"),
    } satisfies CalculationProjectData;
    const noBufferSettings = { ...settings, bufferPercentage: 0 } satisfies CalculationSettingsData;
    const service = createCalculationService(createRepository({ project: oneDayProject, settings: noBufferSettings }), () => new Date("2026-10-13T18:00:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({
      workingDays: 1,
      deadlineStatus: "NORMAL",
    });
  });

  it("returns NORMAL and zero rush fee when the project has no deadline", async () => {
    const noDeadlineProject = { ...project, deadline: null } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: noDeadlineProject }), () => new Date("2026-10-13T00:00:00.000Z"));
    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({ deadlineStatus: "NORMAL", rushFeePercentage: 0, rushFeeAmount: 0 });
  });

  it("rejects projects that are not owned by the session user", async () => {
    const service = createCalculationService(createRepository({ project: null }));
    await expect(service.calculateProject("user-b", "project-a")).rejects.toThrow("Project not found");
  });

  it("rejects calculations when developer settings are missing", async () => {
    const service = createCalculationService(createRepository({ settings: null }));
    await expect(service.calculateProject("user-a", "project-a")).rejects.toThrow("Developer settings not found");
  });

  it("rejects invalid selected option relations", async () => {
    const invalidProject = {
      ...project,
      features: [{ ...project.features[0], selections: [{
        ...project.features[0].selections[0],
        featureOptionValue: { id: "foreign-value", featureOptionId: "foreign-option", estimatedHours: 4 },
      }] }],
    } satisfies CalculationProjectData;
    const service = createCalculationService(createRepository({ project: invalidProject }));
    await expect(service.calculateProject("user-a", "project-a")).rejects.toThrow("Project calculation data is invalid");
  });

  it("skips weekends when deriving the normal estimated completion date", async () => {
    const fridayProject = {
      ...project,
      features: [{ ...project.features[0], overrideHours: 16, feature: { ...project.features[0].feature, baseEstimatedHours: 16 }, selections: [] }],
      deadline: new Date("2026-10-19T00:00:00.000Z"),
    } satisfies CalculationProjectData;
    const settingsWithNoBuffer = { ...settings, bufferPercentage: 0 } satisfies CalculationSettingsData;
    const service = createCalculationService(createRepository({ project: fridayProject, settings: settingsWithNoBuffer }), () => new Date("2026-10-16T15:00:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({
      workingDays: 2,
      deadline: "2026-10-19T00:00:00.000Z",
      deadlineStatus: "NORMAL",
    });
  });

  it("starts a schedule on Monday when calculation begins during the weekend", async () => {
    const weekendProject = {
      ...project,
      features: [{ ...project.features[0], overrideHours: 40, feature: { ...project.features[0].feature, baseEstimatedHours: 40 }, selections: [] }],
      deadline: new Date("2026-10-23T00:00:00.000Z"),
    } satisfies CalculationProjectData;
    const noBufferSettings = { ...settings, bufferPercentage: 0 } satisfies CalculationSettingsData;
    const service = createCalculationService(createRepository({ project: weekendProject, settings: noBufferSettings }), () => new Date("2026-10-17T13:00:00.000Z"));

    await expect(service.calculateProject("user-a", "project-a")).resolves.toMatchObject({
      workingDays: 5,
      deadlineStatus: "NORMAL",
    });
  });
});
