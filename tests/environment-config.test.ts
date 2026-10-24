import { describe, expect, it } from "vitest";
import { parseEnvironment } from "../src/config/env.js";

const valid = {
  NODE_ENV: "production",
  PORT: "3000",
  DATABASE_URL: "postgresql://user:password@db:5432/itungitungan",
  SESSION_SECRET: "0123456789abcdef0123456789abcdef",
  CORS_ORIGINS: "https://app.example.com",
};

describe("environment configuration", () => {
  it("parses valid production values", () => {
    expect(parseEnvironment(valid)).toMatchObject({
      NODE_ENV: "production",
      PORT: 3000,
      DATABASE_URL: valid.DATABASE_URL,
      SESSION_SECRET: valid.SESSION_SECRET,
      CORS_ORIGINS: ["https://app.example.com"],
    });
  });

  it("requires database and production session secrets without exposing values", () => {
    for (const input of [
      { ...valid, DATABASE_URL: "" },
      { ...valid, SESSION_SECRET: "" },
      { ...valid, SESSION_SECRET: "sensitive-short-secret" },
      { ...valid, SESSION_SECRET: "REPLACE_WITH_A_STRONG_RANDOM_SECRET" },
    ]) {
      expect(() => parseEnvironment(input)).toThrow(/DATABASE_URL|SESSION_SECRET/);
      try { parseEnvironment(input); } catch (error) {
        if (input.SESSION_SECRET) expect(String(error)).not.toContain(input.SESSION_SECRET);
      }
    }
  });

  it("rejects malformed origins, unsafe production origins, and invalid ports", () => {
    expect(() => parseEnvironment({ ...valid, CORS_ORIGINS: "https://app.example.com/path" })).toThrow(/CORS_ORIGINS/);
    expect(() => parseEnvironment({ ...valid, CORS_ORIGINS: "http://localhost:5173" })).toThrow(/Production CORS/);
    expect(() => parseEnvironment({ ...valid, PORT: "65536" })).toThrow(/PORT/);
    expect(() => parseEnvironment({ ...valid, PORT: "abc" })).toThrow(/PORT/);
  });

  it("keeps development defaults and accepts comma-separated origins", () => {
    expect(parseEnvironment({ DATABASE_URL: "postgresql://user:password@localhost:5432/app" })).toMatchObject({
      NODE_ENV: "development",
      PORT: 3000,
      CORS_ORIGINS: ["http://localhost:5173"],
    });
    expect(parseEnvironment({ ...valid, CORS_ORIGINS: "https://one.example,https://two.example" }).CORS_ORIGINS)
      .toEqual(["https://one.example", "https://two.example"]);
  });
});
