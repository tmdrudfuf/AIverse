import { describe, expect, it } from "vitest";

import {
  createExecutionReadinessCollection,
  createExecutionReadinessId,
  createExecutionReadinessResultCollection,
  createExecutionReadinessResultId,
  type ExecutionReadiness,
  type ExecutionReadinessResult,
} from "./ExecutionReadinessTypes";

describe("ExecutionReadinessTypes", () => {
  it("creates deterministic readiness and result identities", () => {
    expect(createExecutionReadinessId("daily-proof", "plan-1")).toBe(
      "daily-proof:execution-readiness:plan-1:readiness-v1",
    );
    expect(createExecutionReadinessResultId("daily-proof", "plan-1")).toBe(
      "daily-proof:execution-readiness-result:plan-1:readiness-v1",
    );
  });

  it("defensively copies readiness checks and result reasons", () => {
    const readiness = createReadiness();
    const result = createResult();
    const readinessCollection = createExecutionReadinessCollection({
      projectId: "daily-proof",
      readiness: [readiness],
      rulesVersion: "readiness-v1",
    });
    const resultCollection = createExecutionReadinessResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesVersion: "readiness-v1",
    });

    readiness.checks[0]!.message = "mutated";
    result.reasonCodes.push("TASK_MISSING");
    readinessCollection.readiness[0]!.checks[0]!.message = "mutated again";
    resultCollection.results[0]!.reasonCodes.push("TASK_MISSING");

    const freshReadiness = createExecutionReadinessCollection({
      projectId: "daily-proof",
      readiness: [createReadiness()],
      rulesVersion: "readiness-v1",
    });
    const freshResult = createExecutionReadinessResultCollection({
      projectId: "daily-proof",
      results: [createResult()],
      rulesVersion: "readiness-v1",
    });

    expect(freshReadiness.readiness[0]?.checks[0]?.message).toBe("Execution plan is current.");
    expect(freshResult.results[0]?.reasonCodes).toEqual(["READY"]);
  });
});

function createReadiness(): ExecutionReadiness {
  return {
    readinessId: createExecutionReadinessId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "github:ai-verse/daily-proof",
    status: "Ready",
    checks: [{
      checkId: "check-1",
      category: "ExecutionPlan",
      status: "Passed",
      reason: "READY",
      message: "Execution plan is current.",
    }],
    evaluatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}

function createResult(): ExecutionReadinessResult {
  return {
    id: createExecutionReadinessResultId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: createExecutionReadinessId("daily-proof", "plan-1"),
    status: "Ready",
    reasonCodes: ["READY"],
    primaryReason: "READY",
    passedCheckCount: 1,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "readiness-v1",
  };
}
