import { describe, expect, it } from "vitest";
import {
  DEFAULT_VALIDATION_STRATEGY,
  VALIDATION_STRATEGIES,
  commandsForPhase,
  computeValidationTarget,
  resolvePhaseForStage,
  resolveValidationPolicy,
  targetsMatch,
} from "./validationPolicy.js";
import { DEFAULT_VALIDATION_COMMANDS } from "./agentWorkflow.js";

describe("resolveValidationPolicy: strategy resolution", () => {
  it("defaults to full-every-cycle when nothing is configured", () => {
    const policy = resolveValidationPolicy({}, {});
    expect(policy.strategy).toBe(DEFAULT_VALIDATION_STRATEGY);
    expect(policy.strategy).toBe("full-every-cycle");
  });

  it("resolves focused-final-full from CLI options", () => {
    const policy = resolveValidationPolicy({}, { validationStrategy: "focused-final-full" });
    expect(policy.strategy).toBe(VALIDATION_STRATEGIES.FOCUSED_FINAL_FULL);
  });

  it("resolves focused-final-full from state", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full" } }, {});
    expect(policy.strategy).toBe("focused-final-full");
  });

  it("CLI strategy takes precedence over state strategy", () => {
    const policy = resolveValidationPolicy(
      { validationPolicy: { strategy: "focused-final-full" } },
      { validationStrategy: "full-every-cycle" },
    );
    expect(policy.strategy).toBe("full-every-cycle");
  });

  it("falls back to the default for an unrecognized strategy value, never throwing", () => {
    const policy = resolveValidationPolicy({}, { validationStrategy: "yolo-mode" });
    expect(policy.strategy).toBe("full-every-cycle");
  });
});

describe("resolveValidationPolicy: full command resolution", () => {
  it("uses DEFAULT_VALIDATION_COMMANDS when nothing else is configured", () => {
    const policy = resolveValidationPolicy({}, {});
    expect(policy.fullCommands).toEqual(DEFAULT_VALIDATION_COMMANDS);
  });

  it("resolves fullCommands from state.validationCommands (legacy field)", () => {
    const policy = resolveValidationPolicy({ validationCommands: ["legacy full"] }, {});
    expect(policy.fullCommands).toEqual(["legacy full"]);
  });

  it("resolves fullCommands from state.validationPolicy.fullCommands", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { fullCommands: ["policy full"] } }, {});
    expect(policy.fullCommands).toEqual(["policy full"]);
  });

  it("resolves fullCommands from legacy --validation-command CLI override", () => {
    const policy = resolveValidationPolicy({}, { validationCommands: ["cli legacy full"] });
    expect(policy.fullCommands).toEqual(["cli legacy full"]);
  });

  it("resolves fullCommands from the new --full-validation-command CLI override, taking precedence over everything else", () => {
    const policy = resolveValidationPolicy(
      { validationCommands: ["legacy"], validationPolicy: { fullCommands: ["policy"] } },
      { validationCommands: ["cli legacy"], fullValidationCommands: ["cli full"] },
    );
    expect(policy.fullCommands).toEqual(["cli full"]);
  });

  it("never returns an empty fullCommands array", () => {
    const policy = resolveValidationPolicy({ validationCommands: [] }, {});
    expect(policy.fullCommands.length).toBeGreaterThan(0);
  });
});

describe("resolveValidationPolicy: focused command resolution", () => {
  it("is absent (undefined) and unconfigured when nothing is provided", () => {
    const policy = resolveValidationPolicy({}, {});
    expect(policy.focusedCommands).toBeUndefined();
    expect(policy.focusedCommandsConfigured).toBe(false);
  });

  it("resolves focusedCommands from state.validationPolicy.focusedCommands", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { focusedCommands: ["focused test"] } }, {});
    expect(policy.focusedCommands).toEqual(["focused test"]);
    expect(policy.focusedCommandsConfigured).toBe(true);
  });

  it("resolves focusedCommands from CLI --focused-validation-command, taking precedence over state", () => {
    const policy = resolveValidationPolicy(
      { validationPolicy: { focusedCommands: ["state focused"] } },
      { focusedValidationCommands: ["cli focused"] },
    );
    expect(policy.focusedCommands).toEqual(["cli focused"]);
  });
});

describe("resolveValidationPolicy: CLI overrides do not rewrite state", () => {
  it("returns a resolved policy without mutating the input state object", () => {
    const state = { validationPolicy: { strategy: "full-every-cycle" } };
    resolveValidationPolicy(state, { validationStrategy: "focused-final-full", focusedValidationCommands: ["x"] });
    expect(state.validationPolicy.strategy).toBe("full-every-cycle");
    expect((state.validationPolicy as Record<string, unknown>).focusedCommands).toBeUndefined();
  });
});

describe("resolvePhaseForStage", () => {
  it("final-verification is always full, regardless of strategy", () => {
    const focusedPolicy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full", focusedCommands: ["f"] } }, {});
    expect(resolvePhaseForStage(focusedPolicy, "final-verification")).toBe("full");
    const fullPolicy = resolveValidationPolicy({}, {});
    expect(resolvePhaseForStage(fullPolicy, "final-verification")).toBe("full");
  });

  it("validate/revalidate are full under full-every-cycle", () => {
    const policy = resolveValidationPolicy({}, {});
    expect(resolvePhaseForStage(policy, "validate")).toBe("full");
    expect(resolvePhaseForStage(policy, "revalidate")).toBe("full");
  });

  it("validate/revalidate are focused under focused-final-full when focused commands are configured", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full", focusedCommands: ["f"] } }, {});
    expect(resolvePhaseForStage(policy, "validate")).toBe("focused");
    expect(resolvePhaseForStage(policy, "revalidate")).toBe("focused");
  });

  it("falls back to full when focused-final-full is selected but no focused commands are configured", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full" } }, {});
    expect(policy.focusedCommandsConfigured).toBe(false);
    expect(resolvePhaseForStage(policy, "validate")).toBe("full");
  });

  it("--force-full-validation elevates validate/revalidate to full even under focused-final-full", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full", focusedCommands: ["f"] } }, {});
    expect(resolvePhaseForStage(policy, "validate", { forceFullValidation: true })).toBe("full");
  });

  it("requiresFullValidation forces full at validate/revalidate even under focused-final-full", () => {
    const policy = resolveValidationPolicy(
      { validationPolicy: { strategy: "focused-final-full", focusedCommands: ["f"], requiresFullValidation: true } },
      {},
    );
    expect(resolvePhaseForStage(policy, "validate")).toBe("full");
    expect(resolvePhaseForStage(policy, "revalidate")).toBe("full");
  });
});

describe("commandsForPhase", () => {
  it("returns focusedCommands for the focused phase", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { strategy: "focused-final-full", focusedCommands: ["focused cmd"] } }, {});
    expect(commandsForPhase(policy, "focused")).toEqual(["focused cmd"]);
  });

  it("returns fullCommands for the full phase", () => {
    const policy = resolveValidationPolicy({ validationPolicy: { fullCommands: ["full cmd"] } }, {});
    expect(commandsForPhase(policy, "full")).toEqual(["full cmd"]);
  });
});

describe("computeValidationTarget", () => {
  it("reports a clean tree with a commit and no dirty hash", () => {
    const target = computeValidationTarget({ headCommit: "abc123", hasStagedChanges: false, hasUnstagedChanges: false });
    expect(target).toEqual({ commit: "abc123", dirty: false, dirtyHash: null });
  });

  it("reports a dirty tree with a deterministic hash", () => {
    const gitContext = { headCommit: "abc123", hasUnstagedChanges: true, statusPorcelain: " M file.js", unstagedDiff: "diff content" };
    const target1 = computeValidationTarget(gitContext);
    const target2 = computeValidationTarget({ ...gitContext });
    expect(target1.dirty).toBe(true);
    expect(target1.dirtyHash).toMatch(/^[a-f0-9]{12}$/);
    expect(target1.dirtyHash).toBe(target2.dirtyHash);
  });

  it("produces different hashes for different dirty content", () => {
    const targetA = computeValidationTarget({ headCommit: "abc", hasUnstagedChanges: true, unstagedDiff: "diff A" });
    const targetB = computeValidationTarget({ headCommit: "abc", hasUnstagedChanges: true, unstagedDiff: "diff B" });
    expect(targetA.dirtyHash).not.toBe(targetB.dirtyHash);
  });

  it("never fabricates a commit for a missing headCommit", () => {
    const target = computeValidationTarget({});
    expect(target.commit).toBeNull();
  });
});

describe("targetsMatch", () => {
  it("matches two identical clean targets", () => {
    expect(targetsMatch({ commit: "abc", dirty: false, dirtyHash: null }, { commit: "abc", dirty: false, dirtyHash: null })).toBe(true);
  });

  it("does not match different commits", () => {
    expect(targetsMatch({ commit: "abc", dirty: false, dirtyHash: null }, { commit: "def", dirty: false, dirtyHash: null })).toBe(false);
  });

  it("does not match clean vs dirty even with the same commit", () => {
    expect(targetsMatch({ commit: "abc", dirty: false, dirtyHash: null }, { commit: "abc", dirty: true, dirtyHash: "x" })).toBe(false);
  });

  it("does not match two dirty targets with different hashes", () => {
    expect(targetsMatch({ commit: "abc", dirty: true, dirtyHash: "x" }, { commit: "abc", dirty: true, dirtyHash: "y" })).toBe(false);
  });

  it("matches two dirty targets with the same commit and hash", () => {
    expect(targetsMatch({ commit: "abc", dirty: true, dirtyHash: "x" }, { commit: "abc", dirty: true, dirtyHash: "x" })).toBe(true);
  });

  it("never throws on null/undefined input", () => {
    expect(targetsMatch(null, { commit: "abc", dirty: false, dirtyHash: null })).toBe(false);
    expect(targetsMatch(undefined, undefined)).toBe(false);
  });
});
