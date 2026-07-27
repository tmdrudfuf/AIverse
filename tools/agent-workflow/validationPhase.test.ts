import { describe, expect, it } from "vitest";
import { buildValidationRecordFields, isFocusedPhaseRecord, isFullPhaseRecord } from "./validationPhase.js";

describe("isFullPhaseRecord / isFocusedPhaseRecord", () => {
  it("treats a record with phase: 'full' as full", () => {
    expect(isFullPhaseRecord({ phase: "full" })).toBe(true);
    expect(isFocusedPhaseRecord({ phase: "full" })).toBe(false);
  });

  it("treats a record with phase: 'focused' as focused", () => {
    expect(isFullPhaseRecord({ phase: "focused" })).toBe(false);
    expect(isFocusedPhaseRecord({ phase: "focused" })).toBe(true);
  });

  it("treats a legacy record with no phase field as full, never focused", () => {
    expect(isFullPhaseRecord({ command: "npm test", status: "passed" })).toBe(true);
    expect(isFocusedPhaseRecord({ command: "npm test", status: "passed" })).toBe(false);
  });

  it("treats a null/undefined record as full (never throws, never fabricates focused)", () => {
    expect(isFullPhaseRecord(undefined)).toBe(true);
    expect(isFocusedPhaseRecord(undefined)).toBe(false);
  });
});

describe("buildValidationRecordFields", () => {
  it("builds the additive field set from phase/triggerReason/target", () => {
    const target = { commit: "abc", dirty: false, dirtyHash: null };
    expect(buildValidationRecordFields({ phase: "focused", triggerReason: "reviewer-fix", target })).toEqual({
      phase: "focused",
      triggerReason: "reviewer-fix",
      target,
    });
  });

  it("normalizes a missing triggerReason/target to null rather than undefined", () => {
    expect(buildValidationRecordFields({ phase: "full" })).toEqual({
      phase: "full",
      triggerReason: null,
      target: null,
    });
  });
});
