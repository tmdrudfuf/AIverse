import { describe, expect, it } from "vitest";

import {
  createHumanExecutionApprovalCollection,
  createHumanExecutionApprovalId,
  createHumanExecutionApprovalResultCollection,
  createHumanExecutionApprovalResultId,
  type HumanExecutionApproval,
  type HumanExecutionApprovalResult,
} from "./HumanExecutionApprovalTypes";
import { createHumanExecutionApprovalDisplayRows } from "./HumanExecutionApprovalView";

describe("HumanExecutionApprovalView", () => {
  it("renders pre-approval guidance without implying approval or execution", () => {
    const rows = createHumanExecutionApprovalDisplayRows(undefined, undefined);

    expect(rows.statusText).toContain("Human Approval Required");
    expect(rows.statusText).toContain("Execution Not Approved");
    expect(rows.statusText).toContain("Execution Not Started");
    expect(rows.statusText).toContain("Approve Execution");
    expect(rows.statusText).not.toContain("Execution Approved");
  });

  it("renders approved and already-approved records safely", () => {
    const approvals = createHumanExecutionApprovalCollection({
      projectId: "daily-proof",
      approvals: [createApproval()],
      rulesVersion: "approval-v1",
    });
    const approved = createHumanExecutionApprovalDisplayRows(approvals, createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [createResult()],
      rulesVersion: "approval-v1",
    }));
    const already = createHumanExecutionApprovalDisplayRows(approvals, createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [createResult({ status: "AlreadyApproved", approved: false, duplicateExistingApproval: true, reasonCodes: ["ALREADY_APPROVED"] })],
      rulesVersion: "approval-v1",
    }));

    expect(approved.resultText).toContain("Human Execution Approval Recorded");
    expect(approved.resultText).toContain("Execution Approved");
    expect(approved.resultText).toContain("Execution Not Started");
    expect(approved.approvalText).toContain("approved by Local Human");
    expect(already.resultText).toContain("Human Execution Approval Already Recorded");
    expect(already.resultText).toContain("Awaiting Runtime Preflight");
  });

  it("renders blocked and failed results as not started", () => {
    const blocked = createHumanExecutionApprovalDisplayRows(undefined, createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [createResult({ status: "Blocked", approved: false, executionApproved: false, reasonCodes: ["READINESS_NOT_READY"] })],
      rulesVersion: "approval-v1",
    }));
    const failed = createHumanExecutionApprovalDisplayRows(undefined, createHumanExecutionApprovalResultCollection({
      projectId: "daily-proof",
      results: [createResult({ status: "Failed", approved: false, executionApproved: false, reasonCodes: ["APPROVAL_MALFORMED"] })],
      rulesVersion: "approval-v1",
    }));

    expect(blocked.resultText).toContain("Approval Unavailable");
    expect(blocked.resultText).toContain("Execution Not Started");
    expect(failed.resultText).toContain("Approval Validation Failed");
    expect(failed.resultText).toContain("Execution Not Started");
  });
});

function createApproval(overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
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

function createResult(overrides: Partial<HumanExecutionApprovalResult> = {}): HumanExecutionApprovalResult {
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
