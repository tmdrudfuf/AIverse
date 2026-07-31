import { describe, expect, it } from "vitest";

import {
  IMPLEMENTER_RUNTIME_RULES_VERSION,
  copyImplementerRuntime,
  copyImplementerRuntimeResult,
  createImplementerPromptId,
  createImplementerRuntimeCollection,
  createImplementerRuntimeId,
  createImplementerRuntimeResultCollection,
  createImplementerRuntimeResultId,
  type ImplementerRuntime,
  type ImplementerRuntimeResult,
} from "./ImplementerRuntimeTypes";

function createRuntimeFixture(overrides: Partial<ImplementerRuntime> = {}): ImplementerRuntime {
  return {
    implementerRuntimeId: createImplementerRuntimeId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1"),
    projectId: "daily-proof",
    runtimeStartId: "daily-proof:runtime-start:plan-1:start-v1",
    executionPlanId: "plan-1",
    humanExecutionApprovalId: "approval-1",
    runtimePreflightId: "preflight-1",
    taskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: "session-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    worktreePath: "C:/worktree",
    branch: "codex/075",
    specificationPath: "specs/075-claude-implementer-runtime-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    promptId: createImplementerPromptId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1"),
    status: "Completed",
    startedBy: "Local Human",
    startedAt: "2026-07-30T00:00:00.000Z",
    executionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: {
      providerId: "claude",
      agentId: "Claude",
      role: "Implementer",
      commandDisplay: "claude --dangerously-skip-permissions -p ...",
      workingDirectory: "C:/worktree",
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      exitCode: 0,
      durationMs: 42,
      stdoutSummary: "ok",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    ...overrides,
  };
}

function createResultFixture(overrides: Partial<ImplementerRuntimeResult> = {}): ImplementerRuntimeResult {
  return {
    id: createImplementerRuntimeResultId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1"),
    projectId: "daily-proof",
    runtimeStartId: "daily-proof:runtime-start:plan-1:start-v1",
    executionPlanId: "plan-1",
    implementerRuntimeId: createImplementerRuntimeId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1"),
    status: "Completed",
    reasonCodes: ["IMPLEMENTER_RUNTIME_STARTED"],
    started: true,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-07-30T00:00:01.000Z",
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    ...overrides,
  };
}

describe("ImplementerRuntimeTypes", () => {
  it("produces a deterministic runtime ID keyed by project and Runtime Start identity", () => {
    const first = createImplementerRuntimeId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1");
    const second = createImplementerRuntimeId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1");
    expect(first).toBe(second);
    expect(first).toBe(`daily-proof:implementer-runtime:daily-proof:runtime-start:plan-1:start-v1:${IMPLEMENTER_RUNTIME_RULES_VERSION}`);
  });

  it("produces a deterministic runtime ID that does not depend on timestamps, random values, or output text", () => {
    const idA = createImplementerRuntimeId("daily-proof", "rts-1");
    const idB = createImplementerRuntimeId("daily-proof", "rts-1");
    expect(idA).toBe(idB);
  });

  it("produces a deterministic prompt ID matching the documented format", () => {
    const promptId = createImplementerPromptId("daily-proof", "daily-proof:runtime-start:plan-1:start-v1");
    expect(promptId).toBe(
      `daily-proof:implementer-prompt:daily-proof:runtime-start:plan-1:start-v1:${IMPLEMENTER_RUNTIME_RULES_VERSION}`,
    );
  });

  it("produces different IDs for different projects even with the same Runtime Start suffix", () => {
    const idA = createImplementerRuntimeId("daily-proof", "shared-runtime-start");
    const idB = createImplementerRuntimeId("portfolio", "shared-runtime-start");
    expect(idA).not.toBe(idB);
  });

  it("copyImplementerRuntime returns a defensively-copied evidence object", () => {
    const runtime = createRuntimeFixture();
    const copy = copyImplementerRuntime(runtime);
    expect(copy).toEqual(runtime);
    expect(copy.evidence).not.toBe(runtime.evidence);
    copy.evidence.stdoutSummary = "mutated";
    expect(runtime.evidence.stdoutSummary).toBe("ok");
  });

  it("copyImplementerRuntimeResult returns a defensively-copied reasonCodes array", () => {
    const result = createResultFixture();
    const copy = copyImplementerRuntimeResult(result);
    expect(copy).toEqual(result);
    expect(copy.reasonCodes).not.toBe(result.reasonCodes);
    copy.reasonCodes.push("IMPLEMENTER_RUNTIME_INTERNAL_FAILURE");
    expect(result.reasonCodes).toEqual(["IMPLEMENTER_RUNTIME_STARTED"]);
  });

  it("createImplementerRuntimeCollection copies every runtime and computes runtimeCount", () => {
    const runtime = createRuntimeFixture();
    const collection = createImplementerRuntimeCollection({
      projectId: "daily-proof",
      runtimes: [runtime],
      rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    });
    expect(collection.runtimeCount).toBe(1);
    expect(collection.runtimes[0]).not.toBe(runtime);
    expect(collection.runtimes[0]).toEqual(runtime);
  });

  it("createImplementerRuntimeResultCollection copies every result and computes resultCount", () => {
    const result = createResultFixture();
    const collection = createImplementerRuntimeResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    });
    expect(collection.resultCount).toBe(1);
    expect(collection.results[0]).not.toBe(result);
    expect(collection.results[0]).toEqual(result);
  });

  it("mutating a caller-supplied runtimes array after collection creation does not affect the stored collection", () => {
    const runtime = createRuntimeFixture();
    const sourceRuntimes = [runtime];
    const collection = createImplementerRuntimeCollection({
      projectId: "daily-proof",
      runtimes: sourceRuntimes,
      rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    });
    sourceRuntimes.push(createRuntimeFixture({ implementerRuntimeId: "injected" }));
    expect(collection.runtimeCount).toBe(1);
    expect(collection.runtimes).toHaveLength(1);
  });

  it("keeps reviewerStarted, validationStarted, and githubMutationStarted literally false on every result regardless of status", () => {
    const blocked = createResultFixture({ status: "Blocked", agentStarted: false, implementerStarted: false, started: false });
    expect(blocked.reviewerStarted).toBe(false);
    expect(blocked.validationStarted).toBe(false);
    expect(blocked.githubMutationStarted).toBe(false);
  });
});
