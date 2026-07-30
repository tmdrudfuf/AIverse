import { describe, expect, it } from "vitest";

import type { ExecutionReadiness, ExecutionReadinessResult } from "./ExecutionReadinessTypes";
import { createExecutionReadinessDisplayRows } from "./ExecutionReadinessView";

describe("ExecutionReadinessView", () => {
  it("renders Ready without implying approval or execution", () => {
    const rows = createExecutionReadinessDisplayRows(readinessCollection("Ready"), resultCollection("Ready"));

    expect(rows.resultText).toContain("Readiness Checks Passed");
    expect(rows.resultText).toContain("Ready for Human Execution Decision");
    expect(rows.resultText).toContain("Human Approval Not Granted");
    expect(rows.resultText).toContain("Execution Not Started");
    expect(rows.resultText).not.toMatch(/Approved to Execute|Execution Approved|Running|Executing|Coding|Reviewing|Codex Started|Claude Started|Repository Changing/i);
  });

  it("renders Blocked and Failed with check counts and primary reason", () => {
    expect(createExecutionReadinessDisplayRows(readinessCollection("Blocked"), resultCollection("Blocked")).resultText)
      .toContain("Execution Blocked");
    expect(createExecutionReadinessDisplayRows(readinessCollection("Blocked"), resultCollection("Blocked")).resultText)
      .toContain("TASK_STATE_INCOMPATIBLE");
    expect(createExecutionReadinessDisplayRows(readinessCollection("Failed"), resultCollection("Failed")).resultText)
      .toContain("Readiness Validation Failed");
  });

  it("summarizes check rows deterministically", () => {
    const rows = createExecutionReadinessDisplayRows(readinessCollection("Blocked"), resultCollection("Blocked"));

    expect(rows.checkText).toContain("ExecutionPlan:Passed");
    expect(rows.checkText).toContain("ProjectTask:Blocked");
    expect(rows.checkText).toContain("primary TASK_STATE_INCOMPATIBLE");
  });
});

function readinessCollection(status: ExecutionReadiness["status"]) {
  return {
    projectId: "daily-proof",
    readiness: [readiness(status)],
    readinessCount: 1,
    rulesVersion: "readiness-v1",
  };
}

function resultCollection(status: ExecutionReadinessResult["status"]) {
  return {
    projectId: "daily-proof",
    results: [result(status)],
    resultCount: 1,
    rulesVersion: "readiness-v1",
  };
}

function readiness(status: ExecutionReadiness["status"]): ExecutionReadiness {
  return {
    readinessId: "readiness-1",
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    status,
    checks: [
      {
        checkId: "check-plan",
        category: "ExecutionPlan",
        status: "Passed",
        reason: "READY",
        message: "Plan passed.",
      },
      {
        checkId: "check-task",
        category: "ProjectTask",
        status: status === "Ready" ? "Passed" : "Blocked",
        reason: status === "Ready" ? "READY" : "TASK_STATE_INCOMPATIBLE",
        message: "Task state checked.",
      },
    ],
    evaluatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}

function result(status: ExecutionReadinessResult["status"]): ExecutionReadinessResult {
  return {
    id: "result-1",
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: "readiness-1",
    status,
    reasonCodes: status === "Ready" ? ["READY"] : ["TASK_STATE_INCOMPATIBLE"],
    primaryReason: status === "Ready" ? "READY" : "TASK_STATE_INCOMPATIBLE",
    passedCheckCount: status === "Ready" ? 10 : 9,
    blockedCheckCount: status === "Blocked" ? 1 : 0,
    failedCheckCount: status === "Failed" ? 1 : 0,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
  };
}
