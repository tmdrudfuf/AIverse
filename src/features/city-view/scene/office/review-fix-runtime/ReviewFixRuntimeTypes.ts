import type { ReviewFixPlanInput, ReviewFixPlanResult } from "../review-fix-plans/ReviewFixPlanTypes";

export const REVIEW_FIX_RUNTIME_RULES_VERSION = "review-fix-runtime-v1";

export const REVIEW_FIX_RUNTIME_APPROVED_IMPLEMENTER_AGENT = "claude";
export const REVIEW_FIX_RUNTIME_APPROVED_REVIEWER_AGENT = "codex";

export type ReviewFixRuntimeStatus = "Completed" | "TimedOut" | "Blocked" | "Failed";

export type ReviewFixRuntimeReasonCode =
  | "REVIEW_FIX_RUNTIME_STARTED"
  | "REVIEW_FIX_RUNTIME_ALREADY_COMPLETED"
  | "REVIEW_FIX_RUNTIME_ALREADY_ACTIVE"
  | "REVIEW_FIX_RUNTIME_MALFORMED"
  | "REVIEW_FIX_RUNTIME_PLAN_MISSING"
  | "REVIEW_FIX_RUNTIME_PLAN_STALE"
  | "REVIEW_FIX_RUNTIME_PLAN_BLOCKED"
  | "REVIEW_FIX_RUNTIME_TARGET_MISMATCH"
  | "REVIEW_FIX_RUNTIME_INVALID_ACTOR"
  | "REVIEW_FIX_RUNTIME_ROLE_MISMATCH"
  | "REVIEW_FIX_RUNTIME_COMMAND_UNSAFE"
  | "REVIEW_FIX_RUNTIME_PROVIDER_UNAVAILABLE"
  | "REVIEW_FIX_RUNTIME_SPAWN_FAILED"
  | "REVIEW_FIX_RUNTIME_TIMED_OUT"
  | "REVIEW_FIX_RUNTIME_EXISTING_RUNTIME_MISMATCH"
  | "REVIEW_FIX_RUNTIME_INTERNAL_FAILURE";

export type ReviewFixRuntimeEvidence = {
  providerId: string;
  agentId: string;
  role: "ReviewFixRuntime";
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

export type ReviewFixRuntimeCommand = {
  projectId: string;
  reviewFixPlanId: string;
  actor: string;
  startedAt: string;
};

export type ReviewFixRuntime = {
  reviewFixRuntimeId: string;
  projectId: string;
  reviewFixPlanId: string;
  reviewFixRequestId: string;
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
  specificationPath: string;
  implementer: string;
  reviewer: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  validationCommands: string[];
  mutationScope: string[];
  decision: "ChangesRequested";
  blockingFindingCount: number;
  nonBlockingFindingCount: number;
  promptId: string;
  status: ReviewFixRuntimeStatus;
  startedBy: string;
  startedAt: string;
  fixExecutionStarted: true;
  agentStarted: boolean;
  implementerStarted: boolean;
  reviewerStarted: false;
  validationRuntimeStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  pushStarted: false;
  prStarted: false;
  readyForReviewStarted: false;
  mergeStarted: false;
  deployStarted: false;
  branchDeletionStarted: false;
  evidence: ReviewFixRuntimeEvidence;
  rulesVersion: string;
};

export type ReviewFixRuntimeResult = {
  id: string;
  projectId: string;
  reviewFixPlanId?: string;
  reviewFixRuntimeId?: string;
  status: ReviewFixRuntimeStatus;
  reasonCodes: ReviewFixRuntimeReasonCode[];
  started: boolean;
  alreadyCompleted: boolean;
  duplicateActiveAttempt: boolean;
  agentStarted: boolean;
  implementerStarted: boolean;
  reviewerStarted: false;
  validationRuntimeStarted: false;
  validationStarted: false;
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

export type ReviewFixRuntimeCollection = {
  projectId: string;
  runtimes: ReviewFixRuntime[];
  runtimeCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixRuntimeResultCollection = {
  projectId: string;
  results: ReviewFixRuntimeResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixRuntimeInput = ReviewFixPlanInput & {
  latestFixPlanResult?: ReviewFixPlanResult;
  existingFixRuntimes?: ReviewFixRuntimeCollection;
  existingFixRuntimeResults?: ReviewFixRuntimeResultCollection;
};

export type ReviewFixRuntimeOutcome = {
  result: ReviewFixRuntimeResult;
  runtime?: ReviewFixRuntime;
  runtimeCollection?: ReviewFixRuntimeCollection;
  resultCollection?: ReviewFixRuntimeResultCollection;
};

export function createReviewFixRuntimeId(
  projectId: string,
  reviewFixPlanId: string,
  rulesVersion = REVIEW_FIX_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:review-fix-runtime:${reviewFixPlanId}:${rulesVersion}`;
}

export function createReviewFixRuntimeResultId(
  projectId: string,
  reviewFixRuntimeId: string,
  rulesVersion = REVIEW_FIX_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:review-fix-runtime-result:${reviewFixRuntimeId}:${rulesVersion}`;
}

export function createReviewFixRuntimePromptId(
  projectId: string,
  reviewFixPlanId: string,
  rulesVersion = REVIEW_FIX_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:review-fix-runtime-prompt:${reviewFixPlanId}:${rulesVersion}`;
}

export function createReviewFixRuntimeCollection(input: Omit<
  ReviewFixRuntimeCollection,
  "runtimes" | "runtimeCount"
> & {
  runtimes: ReadonlyArray<ReviewFixRuntime>;
}): ReviewFixRuntimeCollection {
  const runtimes = input.runtimes.map(copyReviewFixRuntime);
  return { ...input, runtimes, runtimeCount: runtimes.length };
}

export function createReviewFixRuntimeResultCollection(input: Omit<
  ReviewFixRuntimeResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ReviewFixRuntimeResult>;
}): ReviewFixRuntimeResultCollection {
  const results = input.results.map(copyReviewFixRuntimeResult);
  return { ...input, results, resultCount: results.length };
}

export function copyReviewFixRuntime(runtime: ReviewFixRuntime): ReviewFixRuntime {
  return {
    ...runtime,
    validationCommands: [...runtime.validationCommands],
    mutationScope: [...runtime.mutationScope],
    evidence: { ...runtime.evidence },
  };
}

export function copyReviewFixRuntimeResult(result: ReviewFixRuntimeResult): ReviewFixRuntimeResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}
