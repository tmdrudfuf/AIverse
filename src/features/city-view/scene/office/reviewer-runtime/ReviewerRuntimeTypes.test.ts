import { describe, expect, it } from "vitest";

import {
  copyReviewerFinding,
  copyReviewerRuntime,
  copyReviewerRuntimeResult,
  createReviewerPromptId,
  createReviewerRuntimeId,
  createReviewerRuntimeResultId,
  type ReviewerRuntime,
  type ReviewerRuntimeFinding,
  type ReviewerRuntimeResult,
} from "./ReviewerRuntimeTypes";

function createFinding(overrides: Partial<ReviewerRuntimeFinding> = {}): ReviewerRuntimeFinding {
  return {
    findingId: "finding-1",
    severity: "P1",
    blocking: true,
    category: "safety",
    message: "example",
    ...overrides,
  };
}

function createRuntime(overrides: Partial<ReviewerRuntime> = {}): ReviewerRuntime {
  return {
    reviewerRuntimeId: "runtime-1",
    projectId: "project-1",
    runtimeStartId: "runtime-start-1",
    implementerRuntimeId: "implementer-runtime-1",
    reviewTargetId: "review-target-1",
    reviewPromptId: "review-prompt-1",
    worktreePath: "C:/worktrees/076",
    branch: "codex/076-codex-reviewer-runtime-foundation",
    specificationPath: "specs/076-codex-reviewer-runtime-foundation/spec.md",
    implementer: "claude",
    reviewer: "codex",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    status: "Completed",
    decision: "Approved",
    findings: [createFinding()],
    startedBy: "human",
    startedAt: "2026-08-01T00:00:00.000Z",
    executionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: true,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: {
      providerId: "codex",
      agentId: "codex",
      role: "Reviewer",
      commandDisplay: "codex exec",
      workingDirectory: "C:/worktrees/076",
      reviewTargetSha: "def456",
      started: true,
      completed: true,
      timedOut: false,
      durationMs: 10,
      stdoutSummary: "Decision: Approved",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "codex-reviewer-v1",
    ...overrides,
  };
}

describe("id generators", () => {
  it("createReviewerRuntimeId is deterministic and includes projectId/reviewTargetId", () => {
    const id = createReviewerRuntimeId("project-1", "review-target-1");
    expect(id).toBe(createReviewerRuntimeId("project-1", "review-target-1"));
    expect(id).toContain("project-1");
    expect(id).toContain("review-target-1");
  });

  it("createReviewerRuntimeResultId and createReviewerPromptId are distinct from each other and from the runtime id", () => {
    const runtimeId = createReviewerRuntimeId("project-1", "review-target-1");
    const resultId = createReviewerRuntimeResultId("project-1", "review-target-1");
    const promptId = createReviewerPromptId("project-1", "review-target-1");
    expect(new Set([runtimeId, resultId, promptId]).size).toBe(3);
  });
});

describe("copy helpers", () => {
  it("copyReviewerRuntime deep-copies findings and evidence so mutating the copy never mutates the source", () => {
    const runtime = createRuntime();
    const copy = copyReviewerRuntime(runtime);

    copy.findings[0].message = "mutated";
    copy.evidence.stdoutSummary = "mutated";

    expect(runtime.findings[0].message).toBe("example");
    expect(runtime.evidence.stdoutSummary).toBe("Decision: Approved");
  });

  it("copyReviewerRuntimeResult copies reasonCodes so mutating the copy never mutates the source", () => {
    const result: ReviewerRuntimeResult = {
      id: "result-1",
      projectId: "project-1",
      status: "Completed",
      decision: "Approved",
      blockingFindingCount: 0,
      nonBlockingFindingCount: 0,
      reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
      started: true,
      duplicateActiveAttempt: false,
      agentStarted: true,
      implementerStarted: true,
      reviewerStarted: true,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-08-01T00:00:00.000Z",
      rulesVersion: "codex-reviewer-v1",
    };

    const copy = copyReviewerRuntimeResult(result);
    copy.reasonCodes.push("REVIEWER_RUNTIME_DECISION_UNKNOWN");

    expect(result.reasonCodes).toEqual(["REVIEWER_RUNTIME_STARTED"]);
  });

  it("copyReviewerFinding returns a shallow copy independent of the source object", () => {
    const finding = createFinding();
    const copy = copyReviewerFinding(finding);
    copy.message = "mutated";
    expect(finding.message).toBe("example");
  });
});
