import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";

export const HUMAN_EXECUTION_APPROVAL_RULES_VERSION = "approval-v1";

export type HumanExecutionApprovalDecision = "Approved";

export type HumanExecutionApprovalResultStatus = "Approved" | "AlreadyApproved" | "Blocked" | "Failed";

export type HumanExecutionApprovalReasonCode =
  | "APPROVED"
  | "ALREADY_APPROVED"
  | "APPROVAL_MALFORMED"
  | "APPROVER_MISSING"
  | "APPROVER_NOT_HUMAN"
  | "EXECUTION_PLAN_MISSING"
  | "EXECUTION_PLAN_PROJECT_MISMATCH"
  | "EXECUTION_PLAN_ALREADY_STARTED"
  | "READINESS_MISSING"
  | "READINESS_NOT_READY"
  | "READINESS_PROJECT_MISMATCH"
  | "READINESS_PLAN_MISMATCH"
  | "READINESS_ALREADY_APPROVED"
  | "READINESS_ALREADY_STARTED"
  | "APPROVAL_CONTEXT_MISMATCH"
  | "APPROVAL_STORE_UNAVAILABLE"
  | "PROJECT_MISMATCH";

export type HumanExecutionApproval = {
  approvalId: string;
  projectId: string;
  executionPlanId: string;
  readinessId: string;
  activeSessionId: string;
  projectTaskId: string;
  confirmedAssignmentId: string;
  preparedSessionId: string;
  employeeId: string;
  repositoryId: string;
  implementerAgent: string;
  reviewerAgent: string;
  validationCommands: string[];
  allowedMutationScope: string[];
  decision: HumanExecutionApprovalDecision;
  executionApproved: true;
  approvedAt: string;
  approvedBy: string;
  rulesVersion: string;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type HumanExecutionApprovalResult = {
  id: string;
  projectId: string;
  executionPlanId: string;
  readinessId?: string;
  approvalId?: string;
  status: HumanExecutionApprovalResultStatus;
  reasonCodes: HumanExecutionApprovalReasonCode[];
  approved: boolean;
  duplicateExistingApproval: boolean;
  executionApproved: boolean;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type HumanExecutionApprovalCollection = {
  projectId: string;
  approvals: HumanExecutionApproval[];
  approvalCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type HumanExecutionApprovalResultCollection = {
  projectId: string;
  results: HumanExecutionApprovalResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type HumanExecutionApprovalCommand = {
  projectId: string;
  executionPlanId: string;
  readinessId: string;
  approvedBy: string;
  requestedAt: string;
};

export type HumanExecutionApprovalInput = {
  command: HumanExecutionApprovalCommand;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  existingApprovals?: HumanExecutionApprovalCollection;
};

export type HumanExecutionApprovalOutcome = {
  result: HumanExecutionApprovalResult;
  approval?: HumanExecutionApproval;
  approvalCollection?: HumanExecutionApprovalCollection;
  resultCollection?: HumanExecutionApprovalResultCollection;
};

export function createHumanExecutionApprovalId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
) {
  return `${projectId}:human-execution-approval:${executionPlanId}:${rulesVersion}`;
}

export function createHumanExecutionApprovalResultId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
) {
  return `${projectId}:human-execution-approval-result:${executionPlanId}:${rulesVersion}`;
}

export function createHumanExecutionApprovalCollection(input: Omit<
  HumanExecutionApprovalCollection,
  "approvals" | "approvalCount"
> & {
  approvals: ReadonlyArray<HumanExecutionApproval>;
}): HumanExecutionApprovalCollection {
  const approvals = input.approvals.map(copyHumanExecutionApproval);
  return {
    ...input,
    approvals,
    approvalCount: approvals.length,
  };
}

export function createHumanExecutionApprovalResultCollection(input: Omit<
  HumanExecutionApprovalResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<HumanExecutionApprovalResult>;
}): HumanExecutionApprovalResultCollection {
  const results = input.results.map(copyHumanExecutionApprovalResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyHumanExecutionApproval(approval: HumanExecutionApproval): HumanExecutionApproval {
  return {
    ...approval,
    validationCommands: [...approval.validationCommands],
    allowedMutationScope: [...approval.allowedMutationScope],
  };
}

export function copyHumanExecutionApprovalResult(result: HumanExecutionApprovalResult): HumanExecutionApprovalResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
