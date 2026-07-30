import { describe, expect, it } from "vitest";

import {
  createRuntimePreflightCollection,
  createRuntimePreflightId,
  createRuntimePreflightResultId,
  type RuntimePreflight,
  type RuntimePreflightResult,
} from "./RuntimePreflightTypes";
import { createRuntimePreflightDisplayRows } from "./RuntimePreflightView";

describe("RuntimePreflightView", () => {
  it("shows required preflight wording before a result exists", () => {
    const rows = createRuntimePreflightDisplayRows(undefined, undefined);

    expect(rows.statusText).toContain("Runtime Preflight Required");
    expect(rows.statusText).toContain("Run Local Safety Checks");
    expect(rows.statusText).toContain("Execution Not Started");
    expect(rows.statusText).not.toMatch(/Running|Executing|Coding|Reviewing|Codex Started|Claude Started/);
  });

  it("shows Ready wording without claiming runtime start", () => {
    const rows = createRuntimePreflightDisplayRows(createCollection("Ready"), createResultCollection("Ready"));

    expect(rows.resultText).toContain("Runtime Preflight Passed");
    expect(rows.resultText).toContain("Ready for Runtime Start Decision");
    expect(rows.resultText).toContain("Execution Not Started");
    expect(rows.resultText).toContain("Agents Not Started");
    expect(rows.resultText).toContain("14 passed / 0 blocked / 0 failed");
    expect(rows.resultText).not.toMatch(/Running|Executing|Commands Running|Repository Changing/);
  });

  it("shows Blocked and Failed wording with bounded primary reasons", () => {
    const blocked = createRuntimePreflightDisplayRows(
      createCollection("Blocked", "WORKING_TREE_DIRTY"),
      createResultCollection("Blocked", "WORKING_TREE_DIRTY"),
    );
    const failed = createRuntimePreflightDisplayRows(
      createCollection("Failed", "RUNTIME_PROVIDER_FAILED"),
      createResultCollection("Failed", "RUNTIME_PROVIDER_FAILED"),
    );

    expect(blocked.resultText).toContain("Runtime Preflight Blocked");
    expect(blocked.resultText).toContain("Resolve Local Runtime Requirements");
    expect(blocked.resultText).toContain("WORKING_TREE_DIRTY");
    expect(failed.resultText).toContain("Runtime Preflight Failed");
    expect(failed.resultText).toContain("Local Safety Checks Could Not Complete");
    expect(failed.resultText).toContain("RUNTIME_PROVIDER_FAILED");
  });

  it("summarizes checks without flooding every low-level row", () => {
    const rows = createRuntimePreflightDisplayRows(createCollection("Blocked", "BRANCH_MISMATCH"), undefined);

    expect(rows.checkText).toContain("Approval:Passed");
    expect(rows.checkText).toContain("Repository:Passed");
    expect(rows.checkText).toContain("Branch:Blocked");
    expect(rows.checkText).toContain("primary BRANCH_MISMATCH");
  });

  it("shows +N more for multiple results", () => {
    const result = createResult("Ready");
    const rows = createRuntimePreflightDisplayRows(undefined, {
      projectId: "daily-proof",
      results: [result, { ...result, evaluatedAt: "2026-01-08T00:01:00.000Z" }],
      resultCount: 2,
      rulesVersion: "preflight-v1",
    });

    expect(rows.resultText).toContain("+1 more");
  });
});

function createCollection(status: RuntimePreflight["status"], primaryReason = "READY") {
  return createRuntimePreflightCollection({
    projectId: "daily-proof",
    preflights: [createPreflight(status, primaryReason)],
    rulesVersion: "preflight-v1",
  });
}

function createResultCollection(status: RuntimePreflightResult["status"], primaryReason = "READY") {
  const result = createResult(status, primaryReason);
  return {
    projectId: "daily-proof",
    results: [result],
    resultCount: 1,
    rulesVersion: "preflight-v1",
  };
}

function createPreflight(status: RuntimePreflight["status"], primaryReason: string): RuntimePreflight {
  const preflightId = createRuntimePreflightId("daily-proof", "plan-1");
  return {
    preflightId,
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: "readiness-1",
    approvalId: "approval-1",
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    status,
    checks: [
      { checkId: `${preflightId}:check:Approval:READY`, category: "Approval", status: "Passed", reason: "READY", message: "Approval current." },
      { checkId: `${preflightId}:check:Repository:READY`, category: "Repository", status: "Passed", reason: "READY", message: "Repository current." },
      {
        checkId: `${preflightId}:check:Branch:${primaryReason}`,
        category: "Branch",
        status: status === "Ready" ? "Passed" : status,
        reason: primaryReason as RuntimePreflight["checks"][number]["reason"],
        message: "Primary reason.",
      },
    ],
    evaluatedAt: "2026-01-08T00:00:00.000Z",
    rulesVersion: "preflight-v1",
    executionApproved: true,
    runtimePreflightPassed: status === "Ready",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}

function createResult(status: RuntimePreflightResult["status"], primaryReason = "READY"): RuntimePreflightResult {
  return {
    id: createRuntimePreflightResultId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    preflightId: createRuntimePreflightId("daily-proof", "plan-1"),
    approvalId: "approval-1",
    readinessId: "readiness-1",
    status,
    reasonCodes: status === "Ready" ? ["READY"] : [primaryReason as RuntimePreflightResult["reasonCodes"][number]],
    primaryReason: primaryReason as RuntimePreflightResult["primaryReason"],
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
  };
}
