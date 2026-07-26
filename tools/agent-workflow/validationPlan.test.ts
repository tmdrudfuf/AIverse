import { describe, expect, it } from "vitest";
import { buildValidationPlanPreview, isFinalValidationSatisfied } from "./validationPlan.js";

describe("buildValidationPlanPreview", () => {
  it("previews the focused phase at validate under focused-final-full", () => {
    const state = { validationPolicy: { strategy: "focused-final-full", focusedCommands: ["focused cmd"], fullCommands: ["full cmd"] } };
    const preview = buildValidationPlanPreview(state, "validate", {});
    expect(preview.strategy).toBe("focused-final-full");
    expect(preview.phase).toBe("focused");
    expect(preview.commands).toEqual(["focused cmd"]);
    expect(preview.focusedCommands).toEqual(["focused cmd"]);
    expect(preview.fullCommands).toEqual(["full cmd"]);
  });

  it("previews the full phase at final-verification regardless of strategy", () => {
    const state = { validationPolicy: { strategy: "focused-final-full", focusedCommands: ["focused cmd"], fullCommands: ["full cmd"] } };
    const preview = buildValidationPlanPreview(state, "final-verification", {});
    expect(preview.phase).toBe("full");
    expect(preview.commands).toEqual(["full cmd"]);
    expect(preview.reason).toMatch(/final-verification/);
  });

  it("previews the full phase at validate under full-every-cycle (default)", () => {
    const preview = buildValidationPlanPreview({}, "validate", {});
    expect(preview.strategy).toBe("full-every-cycle");
    expect(preview.phase).toBe("full");
  });

  it("reports manual-request as the reason when --force-full-validation is set", () => {
    const state = { validationPolicy: { strategy: "focused-final-full", focusedCommands: ["focused cmd"] } };
    const preview = buildValidationPlanPreview(state, "validate", { forceFullValidation: true });
    expect(preview.phase).toBe("full");
    expect(preview.reason).toMatch(/manual-request/);
  });

  it("never mutates state and never executes anything (pure preview)", () => {
    const state = { validationPolicy: { strategy: "focused-final-full", focusedCommands: ["x"] } };
    const before = JSON.stringify(state);
    buildValidationPlanPreview(state, "validate", {});
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe("isFinalValidationSatisfied", () => {
  it("is not satisfied when no validationRuns exist", () => {
    expect(isFinalValidationSatisfied({}).satisfied).toBe(false);
  });

  it("is not satisfied when the latest full-phase attempt did not pass", () => {
    const state = {
      validationRuns: [{ phase: "full", status: "failed", target: { commit: "a", dirty: false, dirtyHash: null } }],
      reviewRuns: [{ outcome: "Approved", target: { commit: "a", dirty: false, dirtyHash: null } }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: false, reason: "no-passed-full-validation" });
  });

  it("is not satisfied when the latest review is not Approved", () => {
    const state = {
      validationRuns: [{ phase: "full", status: "passed", target: { commit: "a", dirty: false, dirtyHash: null } }],
      reviewRuns: [{ outcome: "Changes Requested", target: { commit: "a", dirty: false, dirtyHash: null } }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: false, reason: "no-approved-review" });
  });

  it("is not satisfied when the full-validation target and reviewed target differ", () => {
    const state = {
      validationRuns: [{ phase: "full", status: "passed", target: { commit: "b", dirty: false, dirtyHash: null } }],
      reviewRuns: [{ outcome: "Approved", target: { commit: "a", dirty: false, dirtyHash: null } }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: false, reason: "target-mismatch" });
  });

  it("is not satisfied when neither record has target evidence at all (exact-match evidence is required, never assumed)", () => {
    const state = {
      validationRuns: [{ phase: "full", status: "passed" }],
      reviewRuns: [{ outcome: "Approved" }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: false, reason: "target-evidence-missing" });
  });

  it("is not satisfied when only one side has target evidence", () => {
    const state = {
      validationRuns: [{ phase: "full", status: "passed", target: { commit: "a", dirty: false, dirtyHash: null } }],
      reviewRuns: [{ outcome: "Approved" }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: false, reason: "target-evidence-missing" });
  });

  it("is satisfied when the latest full validation passed and matches the latest Approved review's target", () => {
    const target = { commit: "abc123", dirty: false, dirtyHash: null };
    const state = {
      validationRuns: [{ phase: "full", status: "passed", target }],
      reviewRuns: [{ outcome: "Approved", target }],
    };
    expect(isFinalValidationSatisfied(state)).toEqual({ satisfied: true, reason: null });
  });

  it("only considers the latest full-phase record, ignoring earlier focused records", () => {
    const target = { commit: "abc123", dirty: false, dirtyHash: null };
    const state = {
      validationRuns: [
        { phase: "focused", status: "failed", target: { commit: "old", dirty: false, dirtyHash: null } },
        { phase: "full", status: "passed", target },
      ],
      reviewRuns: [{ outcome: "Approved", target }],
    };
    expect(isFinalValidationSatisfied(state).satisfied).toBe(true);
  });

  it("treats legacy records with no phase field as full", () => {
    const target = { commit: "abc123", dirty: false, dirtyHash: null };
    const state = {
      validationRuns: [{ status: "passed", target }],
      reviewRuns: [{ outcome: "Approved", target }],
    };
    expect(isFinalValidationSatisfied(state).satisfied).toBe(true);
  });
});
