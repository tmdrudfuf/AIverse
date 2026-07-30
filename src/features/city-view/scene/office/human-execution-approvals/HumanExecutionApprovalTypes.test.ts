import { describe, expect, it } from "vitest";

import {
  createHumanExecutionApprovalCollection,
  createHumanExecutionApprovalId,
  createHumanExecutionApprovalResultCollection,
  createHumanExecutionApprovalResultId,
  type HumanExecutionApproval,
  type HumanExecutionApprovalResult,
} from "./HumanExecutionApprovalTypes";

describe("HumanExecutionApprovalTypes", () => {
  it("creates deterministic approval and result identities", () => {
    expect(createHumanExecutionApprovalId("daily-proof", "plan-1")).toBe(
      "daily-proof:human-execution-approval:plan-1:approval-v1",
    );
    expect(createHumanExecutionApprovalResultId("daily-proof", "plan-1")).toBe(
      "daily-proof:human-execution-approval-result:plan-1:approval-v1",
    );
  });

  it("defensively copies approval and result collections", () => {
    const approval = createApproval();
    const result = createResult();
    const approvals = createHumanExecutionApprovalCollection({
      projectId: "daily-proof",
      approvals: [approval],
      rulesVersion: "approval-v1",
    });
    const results = createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesVersion: "approval-v1",
    });

    approval.approvedBy = "mutated";
    approval.validationCommands.push("mutated");
    result.reasonCodes.push("READINESS_NOT_READY");
    results.results[0]!.reasonCodes.push("READINESS_NOT_READY");

    const freshApprovals = createHumanExecutionApprovalCollection({
      projectId: "daily-proof",
      approvals: [createApproval()],
      rulesVersion: "approval-v1",
    });
    const freshResults = createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [createResult()],
      rulesVersion: "approval-v1",
    });

    expect(approvals.approvals[0]?.approvedBy).toBe("Local Human");
    expect(approvals.approvals[0]?.validationCommands).toEqual(["npm test"]);
    expect(freshApprovals.approvals[0]?.approvedBy).toBe("Local Human");
    expect(freshResults.results[0]?.reasonCodes).toEqual(["APPROVED"]);
  });

  it("keeps execution and mutation flags false on approvals", () => {
    expect(createApproval()).toMatchObject({
      executionApproved: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      approvedBy: "Local Human",
    });
  });
});

export function createApproval(overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
  return {
    approvalId: createHumanExecutionApprovalId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: "readiness-1",
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test"],
    allowedMutationScope: ["local-files"],
    decision: "Approved",
    executionApproved: true,
    approvedAt: "2026-01-07T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: "approval-v1",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

export function createResult(overrides: Partial<HumanExecutionApprovalResult> = {}): HumanExecutionApprovalResult {
  return {
    id: createHumanExecutionApprovalResultId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: "readiness-1",
    approvalId: createHumanExecutionApprovalId("daily-proof", "plan-1"),
    status: "Approved",
    reasonCodes: ["APPROVED"],
    approved: true,
    duplicateExistingApproval: false,
    executionApproved: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "approval-v1",
    ...overrides,
  };
}
