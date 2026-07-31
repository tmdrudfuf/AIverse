import { describe, expect, it } from "vitest";

import type { HumanExecutionApprovalCollection } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { RuntimePreflightResultCollection } from "../runtime-preflight/RuntimePreflightTypes";
import {
  createRuntimeStartCollection,
  createRuntimeStartId,
  createRuntimeStartResultId,
  type RuntimeStart,
  type RuntimeStartResult,
} from "./RuntimeStartTypes";
import { createRuntimeStartDisplayRows } from "./RuntimeStartView";

describe("RuntimeStartView", () => {
  it("shows unavailable wording before approval", () => {
    const rows = createRuntimeStartDisplayRows(undefined, undefined, undefined, undefined);

    expect(rows.statusText).toContain("Runtime Start Unavailable");
    expect(rows.statusText).toContain("Human Approval Required");
    expect(rows.statusText).toContain("Execution Not Started");
    expect(rows.statusText).toContain("Agents Not Started");
  });

  it("shows unavailable wording before preflight", () => {
    const rows = createRuntimeStartDisplayRows(undefined, undefined, undefined, createApprovals());

    expect(rows.statusText).toContain("Runtime Preflight Required");
    expect(rows.statusText).toContain("Execution Not Started");
  });

  it("shows available wording for Ready preflight without claiming started", () => {
    const rows = createRuntimeStartDisplayRows(undefined, undefined, createPreflightResults("Ready"), createApprovals());

    expect(rows.statusText).toContain("Runtime Start Available");
    expect(rows.statusText).toContain("Explicit Human Start Required");
    expect(rows.statusText).toContain("Execution Not Started");
    expect(rows.statusText).toContain("Agents Not Started");
    expect(rows.statusText).not.toMatch(/Codex Running|Claude Running|Coding|Reviewing|Commands Running/);
  });

  it("shows blocked wording for non-ready preflight", () => {
    const rows = createRuntimeStartDisplayRows(undefined, undefined, createPreflightResults("Blocked"), createApprovals());

    expect(rows.statusText).toContain("Runtime Start Blocked");
    expect(rows.statusText).toContain("Resolve Runtime Preflight");
    expect(rows.statusText).toContain("WORKING_TREE_DIRTY");
  });

  it("shows started wording paired with agents not started", () => {
    const rows = createRuntimeStartDisplayRows(
      createRuntimeStartCollection({ projectId: "daily-proof", starts: [createStart()], rulesVersion: "start-v1" }),
      createResultCollection("Started"),
      createPreflightResults("Ready"),
      createApprovals(),
    );

    expect(rows.resultText).toContain("Runtime Start Recorded");
    expect(rows.resultText).toContain("Execution Started");
    expect(rows.resultText).toContain("Agents Not Started");
    expect(rows.resultText).toContain("Awaiting Implementer Start");
    expect(rows.resultText).not.toMatch(/Codex Running|Claude Running|Repository Changing|Agent Process Active/);
  });

  it("shows +N more for multiple results", () => {
    const result = createResult("AlreadyStarted");
    const rows = createRuntimeStartDisplayRows(undefined, {
      projectId: "daily-proof",
      results: [result, { ...result, resultAt: "2026-01-09T00:01:00.000Z" }],
      resultCount: 2,
      rulesVersion: "start-v1",
    });

    expect(rows.resultText).toContain("+1 more");
  });
});

function createStart(): RuntimeStart {
  return {
    runtimeStartId: createRuntimeStartId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    executionReadinessResultId: "readiness-result-1",
    humanExecutionApprovalId: "approval-1",
    runtimePreflightId: "preflight-1",
    taskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: "active-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryRoot: "C:/repo",
    worktreePath: "C:/repo-spec",
    branch: "codex/feature",
    specificationPath: "specs/074-runtime-start-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    validationCommands: ["npm test"],
    mutationScope: ["local-worktree-only"],
    startedBy: "Local Human",
    startedAt: "2026-01-09T00:00:00.000Z",
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: "start-v1",
  };
}

function createResultCollection(status: RuntimeStartResult["status"]) {
  return {
    projectId: "daily-proof",
    results: [createResult(status)],
    resultCount: 1,
    rulesVersion: "start-v1",
  };
}

function createResult(status: RuntimeStartResult["status"]): RuntimeStartResult {
  return {
    id: createRuntimeStartResultId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    runtimeStartId: createRuntimeStartId("daily-proof", "plan-1"),
    runtimePreflightId: "preflight-1",
    approvalId: "approval-1",
    status,
    reasonCodes: [status === "Started" ? "STARTED" : status === "AlreadyStarted" ? "ALREADY_STARTED" : "RUNTIME_START_PREFLIGHT_BLOCKED"],
    started: status === "Started" || status === "AlreadyStarted",
    duplicateExistingStart: status === "AlreadyStarted",
    executionApproved: status === "Started" || status === "AlreadyStarted",
    runtimePreflightPassed: status === "Started" || status === "AlreadyStarted",
    executionStarted: status === "Started" || status === "AlreadyStarted",
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-09T00:00:00.000Z",
    rulesVersion: "start-v1",
  };
}

function createApprovals(): HumanExecutionApprovalCollection {
  return {
    projectId: "daily-proof",
    approvals: [],
    approvalCount: 1,
    rulesVersion: "approval-v1",
  };
}

function createPreflightResults(status: "Ready" | "Blocked" | "Failed"): RuntimePreflightResultCollection {
  return {
    projectId: "daily-proof",
    results: [{
      id: "preflight-result-1",
      projectId: "daily-proof",
      executionPlanId: "plan-1",
      preflightId: "preflight-1",
      approvalId: "approval-1",
      readinessId: "readiness-1",
      status,
      reasonCodes: status === "Ready" ? ["READY"] : ["WORKING_TREE_DIRTY"],
      primaryReason: status === "Ready" ? "READY" : "WORKING_TREE_DIRTY",
      passedCheckCount: status === "Ready" ? 14 : 13,
      blockedCheckCount: status === "Blocked" ? 1 : 0,
      failedCheckCount: status === "Failed" ? 1 : 0,
      runtimePreflightPassed: status === "Ready",
      executionApproved: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      evaluatedAt: "2026-01-08T00:00:00.000Z",
      rulesVersion: "preflight-v1",
    }],
    resultCount: 1,
    rulesVersion: "preflight-v1",
  };
}
