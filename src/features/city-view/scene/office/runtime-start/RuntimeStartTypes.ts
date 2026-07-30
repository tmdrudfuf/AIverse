import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { RuntimePreflight, RuntimePreflightResult } from "../runtime-preflight/RuntimePreflightTypes";

export const RUNTIME_START_RULES_VERSION = "start-v1";

export type RuntimeStartStatus = "Started" | "AlreadyStarted" | "Blocked" | "Failed";

export type RuntimeStartReasonCode =
  | "STARTED"
  | "ALREADY_STARTED"
  | "RUNTIME_START_MALFORMED"
  | "RUNTIME_START_PLAN_INVALID"
  | "RUNTIME_START_READINESS_NOT_READY"
  | "RUNTIME_START_APPROVAL_MISSING"
  | "RUNTIME_START_APPROVAL_STALE"
  | "RUNTIME_START_PREFLIGHT_MISSING"
  | "RUNTIME_START_PREFLIGHT_BLOCKED"
  | "RUNTIME_START_PREFLIGHT_FAILED"
  | "RUNTIME_START_PREFLIGHT_STALE"
  | "RUNTIME_START_CONTEXT_MISMATCH"
  | "RUNTIME_START_ROLE_CONTEXT_MISMATCH"
  | "RUNTIME_START_VALIDATION_COMMANDS_MISMATCH"
  | "RUNTIME_START_MUTATION_SCOPE_MISMATCH"
  | "RUNTIME_START_PROJECT_MISMATCH"
  | "RUNTIME_START_ALREADY_STARTED"
  | "RUNTIME_START_EXISTING_RECORD_MISMATCH"
  | "RUNTIME_START_INVALID_ACTOR"
  | "RUNTIME_START_AGENT_ALREADY_STARTED"
  | "RUNTIME_START_REPOSITORY_MUTATION_STARTED"
  | "RUNTIME_START_GITHUB_MUTATION_STARTED"
  | "RUNTIME_START_INTERNAL_FAILURE";

export type RuntimeStart = {
  runtimeStartId: string;
  projectId: string;
  executionPlanId: string;
  executionReadinessResultId: string;
  humanExecutionApprovalId: string;
  runtimePreflightId: string;
  taskId: string;
  confirmedAssignmentId: string;
  preparedSessionId: string;
  activeSessionId: string;
  employeeId: string;
  repositoryId: string;
  repositoryRoot: string;
  worktreePath: string;
  branch: string;
  specificationPath: string;
  implementer: string;
  reviewer: string;
  validationCommands: string[];
  mutationScope: string[];
  startedBy: string;
  startedAt: string;
  executionApproved: true;
  runtimePreflightPassed: true;
  executionStarted: true;
  agentStarted: false;
  implementerStarted: false;
  reviewerStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  rulesVersion: string;
};

export type RuntimeStartResult = {
  id: string;
  projectId: string;
  executionPlanId: string;
  runtimeStartId?: string;
  runtimePreflightId?: string;
  approvalId?: string;
  status: RuntimeStartStatus;
  reasonCodes: RuntimeStartReasonCode[];
  started: boolean;
  duplicateExistingStart: boolean;
  executionApproved: boolean;
  runtimePreflightPassed: boolean;
  executionStarted: boolean;
  agentStarted: false;
  implementerStarted: false;
  reviewerStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type RuntimeStartCollection = {
  projectId: string;
  starts: RuntimeStart[];
  startCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type RuntimeStartResultCollection = {
  projectId: string;
  results: RuntimeStartResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type RuntimeStartCommand = {
  projectId: string;
  executionPlanId: string;
  runtimePreflightId: string;
  startedBy: string;
  requestedAt: string;
};

export type RuntimeStartInput = {
  command: RuntimeStartCommand;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  preflight?: RuntimePreflight;
  preflightResult?: RuntimePreflightResult;
  existingStarts?: RuntimeStartCollection;
  existingResults?: RuntimeStartResultCollection;
};

export type RuntimeStartOutcome = {
  result: RuntimeStartResult;
  runtimeStart?: RuntimeStart;
  startCollection?: RuntimeStartCollection;
  resultCollection?: RuntimeStartResultCollection;
};

export function createRuntimeStartId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = RUNTIME_START_RULES_VERSION,
) {
  return `${projectId}:runtime-start:${executionPlanId}:${rulesVersion}`;
}

export function createRuntimeStartResultId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = RUNTIME_START_RULES_VERSION,
) {
  return `${projectId}:runtime-start-result:${executionPlanId}:${rulesVersion}`;
}

export function createRuntimeStartCollection(input: Omit<RuntimeStartCollection, "starts" | "startCount"> & {
  starts: ReadonlyArray<RuntimeStart>;
}): RuntimeStartCollection {
  const starts = input.starts.map(copyRuntimeStart);
  return {
    ...input,
    starts,
    startCount: starts.length,
  };
}

export function createRuntimeStartResultCollection(input: Omit<RuntimeStartResultCollection, "results" | "resultCount"> & {
  results: ReadonlyArray<RuntimeStartResult>;
}): RuntimeStartResultCollection {
  const results = input.results.map(copyRuntimeStartResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyRuntimeStart(start: RuntimeStart): RuntimeStart {
  return {
    ...start,
    validationCommands: [...start.validationCommands],
    mutationScope: [...start.mutationScope],
  };
}

export function copyRuntimeStartResult(result: RuntimeStartResult): RuntimeStartResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
