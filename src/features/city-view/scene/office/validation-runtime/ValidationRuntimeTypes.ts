import type { ReviewFixRuntimeInput, ReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeTypes";

export const VALIDATION_RUNTIME_RULES_VERSION = "validation-runtime-v1";

export type ValidationRuntimeStatus = "Completed" | "TimedOut" | "Blocked" | "Failed";

export type ValidationRuntimeReasonCode =
  | "VALIDATION_RUNTIME_STARTED"
  | "VALIDATION_RUNTIME_ALREADY_COMPLETED"
  | "VALIDATION_RUNTIME_MALFORMED"
  | "VALIDATION_RUNTIME_INVALID_ACTOR"
  | "VALIDATION_RUNTIME_CONTEXT_MISSING"
  | "VALIDATION_RUNTIME_CONTEXT_STALE"
  | "VALIDATION_RUNTIME_TARGET_MISMATCH"
  | "VALIDATION_RUNTIME_REVIEW_FIX_NOT_COMPLETED"
  | "VALIDATION_RUNTIME_COMMANDS_MISSING"
  | "VALIDATION_RUNTIME_COMMAND_UNSAFE"
  | "VALIDATION_RUNTIME_PROVIDER_UNAVAILABLE"
  | "VALIDATION_RUNTIME_COMMAND_FAILED"
  | "VALIDATION_RUNTIME_TIMED_OUT"
  | "VALIDATION_RUNTIME_EXISTING_RUNTIME_MISMATCH"
  | "VALIDATION_RUNTIME_INTERNAL_FAILURE";

export type ValidationCommandEvidence = {
  commandDisplay: string;
  started: boolean;
  completed: boolean;
  timedOut: boolean;
  exitCode?: number;
  signal?: string;
  durationMs: number;
  stdoutSummary: string;
  stderrSummary: string;
  outputTruncated: boolean;
};

export type ValidationRuntimeEvidence = {
  providerId: string;
  role: "ValidationRuntime";
  workingDirectory: string;
  expectedHead: string;
  commandCount: number;
  completedCommandCount: number;
  failedCommandCount: number;
  timedOutCommandCount: number;
  commands: ValidationCommandEvidence[];
};

export type ValidationRuntimeCommand = {
  projectId: string;
  reviewFixRuntimeId: string;
  actor: string;
  startedAt: string;
};

export type ValidationRuntime = {
  validationRuntimeId: string;
  projectId: string;
  reviewFixRequestId: string;
  reviewFixPlanId: string;
  reviewFixRuntimeId: string;
  reviewFixRuntimeResultId: string;
  planId: string;
  readinessId: string;
  readinessResultId: string;
  approvalId: string;
  preflightId: string;
  preflightResultId: string;
  runtimeStartId: string;
  runtimeStartResultId: string;
  implementerRuntimeId: string;
  implementerRuntimeResultId: string;
  reviewerRuntimeId: string;
  reviewerRuntimeResultId: string;
  reviewTargetId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  employeeId: string;
  repositoryId: string;
  worktreePath: string;
  branch: string;
  expectedHead: string;
  specificationPath: string;
  implementer: string;
  reviewer: string;
  validationCommands: string[];
  mutationScope: string[];
  reviewFixRuntimeRulesVersion: string;
  status: ValidationRuntimeStatus;
  startedBy: string;
  startedAt: string;
  validationRuntimeStarted: true;
  validationStarted: boolean;
  commandExecutionStarted: boolean;
  reviewerStarted: false;
  reviewTargetCreated: false;
  promotionStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  pushStarted: false;
  prStarted: false;
  readyForReviewStarted: false;
  mergeStarted: false;
  deployStarted: false;
  branchDeletionStarted: false;
  evidence: ValidationRuntimeEvidence;
  rulesVersion: string;
};

export type ValidationRuntimeResult = {
  id: string;
  projectId: string;
  reviewFixRuntimeId?: string;
  validationRuntimeId?: string;
  status: ValidationRuntimeStatus;
  reasonCodes: ValidationRuntimeReasonCode[];
  started: boolean;
  alreadyCompleted: boolean;
  commandCount: number;
  completedCommandCount: number;
  failedCommandCount: number;
  timedOutCommandCount: number;
  validationRuntimeStarted: boolean;
  validationStarted: boolean;
  commandExecutionStarted: boolean;
  reviewerStarted: false;
  reviewTargetCreated: false;
  promotionStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  pushStarted: false;
  prStarted: false;
  readyForReviewStarted: false;
  mergeStarted: false;
  deployStarted: false;
  branchDeletionStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ValidationRuntimeCollection = {
  projectId: string;
  runtimes: ValidationRuntime[];
  runtimeCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ValidationRuntimeResultCollection = {
  projectId: string;
  results: ValidationRuntimeResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ValidationRuntimeInput = ReviewFixRuntimeInput & {
  latestFixRuntimeResult?: ReviewFixRuntimeResult;
  existingValidationRuntimes?: ValidationRuntimeCollection;
  existingValidationRuntimeResults?: ValidationRuntimeResultCollection;
};

export type ValidationRuntimeOutcome = {
  result: ValidationRuntimeResult;
  runtime?: ValidationRuntime;
  runtimeCollection?: ValidationRuntimeCollection;
  resultCollection?: ValidationRuntimeResultCollection;
};

export function createValidationRuntimeId(
  projectId: string,
  reviewFixRuntimeId: string,
  rulesVersion = VALIDATION_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:validation-runtime:${reviewFixRuntimeId}:${rulesVersion}`;
}

export function createValidationRuntimeResultId(
  projectId: string,
  validationRuntimeId: string,
  rulesVersion = VALIDATION_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:validation-runtime-result:${validationRuntimeId}:${rulesVersion}`;
}

export function createValidationRuntimeCollection(input: Omit<
  ValidationRuntimeCollection,
  "runtimes" | "runtimeCount"
> & { runtimes: ReadonlyArray<ValidationRuntime> }): ValidationRuntimeCollection {
  const runtimes = input.runtimes.map(copyValidationRuntime);
  return { ...input, runtimes, runtimeCount: runtimes.length };
}

export function createValidationRuntimeResultCollection(input: Omit<
  ValidationRuntimeResultCollection,
  "results" | "resultCount"
> & { results: ReadonlyArray<ValidationRuntimeResult> }): ValidationRuntimeResultCollection {
  const results = input.results.map(copyValidationRuntimeResult);
  return { ...input, results, resultCount: results.length };
}

export function copyValidationRuntime(runtime: ValidationRuntime): ValidationRuntime {
  return {
    ...runtime,
    validationCommands: [...runtime.validationCommands],
    mutationScope: [...runtime.mutationScope],
    evidence: {
      ...runtime.evidence,
      commands: runtime.evidence.commands.map((command) => ({ ...command })),
    },
  };
}

export function copyValidationRuntimeResult(result: ValidationRuntimeResult): ValidationRuntimeResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}
