import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { RuntimePreflight, RuntimePreflightResult } from "../runtime-preflight/RuntimePreflightTypes";
import type {
  RuntimeStart,
  RuntimeStartResult,
  RuntimeStartCollection,
  RuntimeStartResultCollection,
} from "../runtime-start/RuntimeStartTypes";

export const IMPLEMENTER_RUNTIME_RULES_VERSION = "claude-implementer-v1";

export const IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT = "claude";
export const IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT = "codex";

export type ImplementerRuntimeStatus = "Completed" | "TimedOut" | "Cancelled" | "Blocked" | "Failed";

export type ImplementerRuntimeReasonCode =
  | "IMPLEMENTER_RUNTIME_STARTED"
  | "IMPLEMENTER_RUNTIME_ALREADY_ACTIVE"
  | "IMPLEMENTER_RUNTIME_MALFORMED"
  | "IMPLEMENTER_RUNTIME_PLAN_INVALID"
  | "IMPLEMENTER_RUNTIME_READINESS_NOT_READY"
  | "IMPLEMENTER_RUNTIME_APPROVAL_MISSING"
  | "IMPLEMENTER_RUNTIME_APPROVAL_STALE"
  | "IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY"
  | "IMPLEMENTER_RUNTIME_START_MISSING"
  | "IMPLEMENTER_RUNTIME_START_STALE"
  | "IMPLEMENTER_RUNTIME_INVALID_ACTOR"
  | "IMPLEMENTER_RUNTIME_ROLE_MISMATCH"
  | "IMPLEMENTER_RUNTIME_CLAUDE_NOT_IMPLEMENTER"
  | "IMPLEMENTER_RUNTIME_CODEX_REVIEWER_MISMATCH"
  | "IMPLEMENTER_RUNTIME_COMMAND_UNSAFE"
  | "IMPLEMENTER_RUNTIME_WORKTREE_MISMATCH"
  | "IMPLEMENTER_RUNTIME_BRANCH_MISMATCH"
  | "IMPLEMENTER_RUNTIME_SPEC_MISMATCH"
  | "IMPLEMENTER_RUNTIME_MUTATION_SCOPE_MISMATCH"
  | "IMPLEMENTER_RUNTIME_PROJECT_MISMATCH"
  | "IMPLEMENTER_RUNTIME_ALREADY_COMPLETED"
  | "IMPLEMENTER_RUNTIME_PROVIDER_UNAVAILABLE"
  | "IMPLEMENTER_RUNTIME_SPAWN_FAILED"
  | "IMPLEMENTER_RUNTIME_TIMED_OUT"
  | "IMPLEMENTER_RUNTIME_CANCELLED"
  | "IMPLEMENTER_RUNTIME_NONZERO_EXIT"
  | "IMPLEMENTER_RUNTIME_OUTPUT_INVALID"
  | "IMPLEMENTER_RUNTIME_INTERNAL_FAILURE";

export type ImplementerRuntimeEvidence = {
  providerId: string;
  agentId: string;
  role: "Implementer";
  commandDisplay: string;
  workingDirectory: string;
  started: boolean;
  completed: boolean;
  timedOut: boolean;
  cancelled: boolean;
  exitCode?: number;
  signal?: string;
  durationMs: number;
  stdoutSummary: string;
  stderrSummary: string;
  outputTruncated: boolean;
};

export type ImplementerRuntime = {
  implementerRuntimeId: string;
  projectId: string;
  runtimeStartId: string;
  executionPlanId: string;
  humanExecutionApprovalId: string;
  runtimePreflightId: string;
  taskId: string;
  confirmedAssignmentId: string;
  preparedSessionId: string;
  activeSessionId: string;
  employeeId: string;
  repositoryId: string;
  worktreePath: string;
  branch: string;
  specificationPath: string;
  implementer: string;
  reviewer: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  promptId: string;
  status: ImplementerRuntimeStatus;
  startedBy: string;
  startedAt: string;
  executionStarted: true;
  agentStarted: boolean;
  implementerStarted: boolean;
  reviewerStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  evidence: ImplementerRuntimeEvidence;
  rulesVersion: string;
};

export type ImplementerRuntimeResult = {
  id: string;
  projectId: string;
  runtimeStartId?: string;
  executionPlanId?: string;
  implementerRuntimeId?: string;
  status: ImplementerRuntimeStatus;
  reasonCodes: ImplementerRuntimeReasonCode[];
  started: boolean;
  duplicateActiveAttempt: boolean;
  agentStarted: boolean;
  implementerStarted: boolean;
  reviewerStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ImplementerRuntimeCollection = {
  projectId: string;
  runtimes: ImplementerRuntime[];
  runtimeCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ImplementerRuntimeResultCollection = {
  projectId: string;
  results: ImplementerRuntimeResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ImplementerRuntimeCommand = {
  projectId: string;
  runtimeStartId: string;
  executionPlanId: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  startedBy: string;
  requestedAt: string;
};

export type ImplementerRuntimeInput = {
  command: ImplementerRuntimeCommand;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  preflight?: RuntimePreflight;
  preflightResult?: RuntimePreflightResult;
  runtimeStart?: RuntimeStart;
  runtimeStartResult?: RuntimeStartResult;
  existingRuntimeStarts?: RuntimeStartCollection;
  existingRuntimeStartResults?: RuntimeStartResultCollection;
  existingRuntimes?: ImplementerRuntimeCollection;
  existingResults?: ImplementerRuntimeResultCollection;
};

export type ImplementerRuntimeOutcome = {
  result: ImplementerRuntimeResult;
  runtime?: ImplementerRuntime;
  runtimeCollection?: ImplementerRuntimeCollection;
  resultCollection?: ImplementerRuntimeResultCollection;
};

export function createImplementerRuntimeId(
  projectId: string,
  runtimeStartId: string,
  rulesVersion = IMPLEMENTER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:implementer-runtime:${runtimeStartId}:${rulesVersion}`;
}

export function createImplementerRuntimeResultId(
  projectId: string,
  runtimeStartId: string,
  rulesVersion = IMPLEMENTER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:implementer-runtime-result:${runtimeStartId}:${rulesVersion}`;
}

export function createImplementerPromptId(
  projectId: string,
  runtimeStartId: string,
  rulesVersion = IMPLEMENTER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:implementer-prompt:${runtimeStartId}:${rulesVersion}`;
}

export function createImplementerRuntimeCollection(input: Omit<
  ImplementerRuntimeCollection,
  "runtimes" | "runtimeCount"
> & {
  runtimes: ReadonlyArray<ImplementerRuntime>;
}): ImplementerRuntimeCollection {
  const runtimes = input.runtimes.map(copyImplementerRuntime);
  return {
    ...input,
    runtimes,
    runtimeCount: runtimes.length,
  };
}

export function createImplementerRuntimeResultCollection(input: Omit<
  ImplementerRuntimeResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ImplementerRuntimeResult>;
}): ImplementerRuntimeResultCollection {
  const results = input.results.map(copyImplementerRuntimeResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyImplementerRuntime(runtime: ImplementerRuntime): ImplementerRuntime {
  return {
    ...runtime,
    evidence: { ...runtime.evidence },
  };
}

export function copyImplementerRuntimeResult(result: ImplementerRuntimeResult): ImplementerRuntimeResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
