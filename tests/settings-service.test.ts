import { describe, expect, it, vi } from "vitest";
import type { SettingsRepository } from "../src/modules/settings/repository.js";
import { createSettingsService } from "../src/modules/settings/service.js";
import { InvalidSettingsError } from "../src/modules/settings/types.js";

const record = {
  developerRate: 75_000,
  workingHoursPerDay: 8,
  bufferPercentage: { toNumber: () => 20 },
  defaultMarginPercentage: { toNumber: () => 30 },
  defaultRushPercentage: { toNumber: () => 10 },
  freeRevisionCount: 2,
  additionalRevisionPrice: 150_000,
};

const expected = {
  developerRate: 75_000,
  workingHoursPerDay: 8,
  buffer: 20,
  margin: 30,
  rush: 10,
  freeRevisionCount: 2,
  additionalRevisionPrice: 150_000,
};

describe("settings service", () => {
  it("gets settings for a user and maps stored percentages", async () => {
    const repository = { findByUserId: vi.fn(async () => record), updateByUserId: vi.fn() } as unknown as SettingsRepository;
    const service = createSettingsService(repository);

    await expect(service.getSettings("user-1")).resolves.toEqual(expected);
    expect(repository.findByUserId).toHaveBeenCalledWith("user-1");
  });

  it("updates settings and returns the updated record", async () => {
    const repository = { findByUserId: vi.fn(), updateByUserId: vi.fn(async () => ({ ...record, developerRate: 90_000 })) } as unknown as SettingsRepository;
    const service = createSettingsService(repository);

    await expect(service.updateSettings("user-1", { developerRate: 90_000 })).resolves.toEqual({ ...expected, developerRate: 90_000 });
    expect(repository.updateByUserId).toHaveBeenCalledWith("user-1", { developerRate: 90_000 });
  });

  it("accepts a partial update without requiring other fields", async () => {
    const repository = { findByUserId: vi.fn(), updateByUserId: vi.fn(async () => record) } as unknown as SettingsRepository;
    const service = createSettingsService(repository);

    await service.updateSettings("user-1", { buffer: 0 });
    expect(repository.updateByUserId).toHaveBeenCalledWith("user-1", { buffer: 0 });
  });

  it.each([
    { developerRate: -1 },
    { workingHoursPerDay: 0 },
    { buffer: 100.1 },
    { margin: -0.1 },
    { rush: 101 },
    { freeRevisionCount: -1 },
    { additionalRevisionPrice: -1 },
  ])("rejects invalid updates %#", async (input) => {
    const repository = { findByUserId: vi.fn(), updateByUserId: vi.fn() } as unknown as SettingsRepository;
    const service = createSettingsService(repository);

    await expect(service.updateSettings("user-1", input)).rejects.toBeInstanceOf(InvalidSettingsError);
    expect(repository.updateByUserId).not.toHaveBeenCalled();
  });
});
