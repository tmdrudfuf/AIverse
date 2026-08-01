import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { ImplementerRuntime, ImplementerRuntimeResult } from "../implementer-runtime/ImplementerRuntimeTypes";
import type { RuntimePreflight, RuntimePreflightResult } from "../runtime-preflight/RuntimePreflightTypes";
import type { RuntimeStart, RuntimeStartResult } from "../runtime-start/RuntimeStartTypes";
import type { ReviewTarget } from "./ReviewTarget";

export const REVIEWER_RUNTIME_RULES_VERSION = "codex-reviewer-v1";

export const REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT = "claude";
export const REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT = "codex";

// Truthful process-lifecycle status. Deliberately excludes a fabricated
// "Running" state: the provider boundary is a single bounded invocation with
// no mechanism to truthfully report an in-progress remote process.
export type ReviewerRuntimeStatus = "Completed" | "TimedOut" | "Blocked" | "Failed";

// Normalized review decision, kept strictly separate from ReviewerRuntimeStatus.
// `runtimeStatus: "Completed"` and `decision: "ChangesRequested"` are both
// true at once whenever Codex ran to completion and asked for changes.
export type ReviewerRuntimeDecision = "Approved" | "ChangesRequested" | "Unknown";

export type ReviewerRuntimeReasonCode =
  | "REVIEWER_RUNTIME_STARTED"
  | "REVIEWER_RUNTIME_MALFORMED"
  | "REVIEWER_RUNTIME_PLAN_INVALID"
  | "REVIEWER_RUNTIME_READINESS_NOT_READY"
  | "REVIEWER_RUNTIME_APPROVAL_STALE"
  | "REVIEWER_RUNTIME_PREFLIGHT_NOT_READY"
  | "REVIEWER_RUNTIME_START_STALE"
  | "REVIEWER_RUNTIME_IMPLEMENTER_MISSING"
  | "REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED"
  | "REVIEWER_RUNTIME_TARGET_MISSING"
  | "REVIEWER_RUNTIME_TARGET_UNCOMMITTED"
  | "REVIEWER_RUNTIME_TARGET_MISMATCH"
  | "REVIEWER_RUNTIME_INVALID_ACTOR"
  | "REVIEWER_RUNTIME_ROLE_MISMATCH"
  | "REVIEWER_RUNTIME_CODEX_NOT_REVIEWER"
  | "REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH"
  | "REVIEWER_RUNTIME_COMMAND_UNSAFE"
  | "REVIEWER_RUNTIME_WORKTREE_MISMATCH"
  | "REVIEWER_RUNTIME_BRANCH_MISMATCH"
  | "REVIEWER_RUNTIME_SPEC_MISMATCH"
  | "REVIEWER_RUNTIME_PROJECT_MISMATCH"
  | "REVIEWER_RUNTIME_ALREADY_ACTIVE"
  | "REVIEWER_RUNTIME_ALREADY_COMPLETED"
  | "REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE"
  | "REVIEWER_RUNTIME_SPAWN_FAILED"
  | "REVIEWER_RUNTIME_TIMED_OUT"
  | "REVIEWER_RUNTIME_NONZERO_EXIT"
  | "REVIEWER_RUNTIME_OUTPUT_INVALID"
  | "REVIEWER_RUNTIME_DECISION_UNKNOWN"
  | "REVIEWER_RUNTIME_INTERNAL_FAILURE";

export type ReviewerFindingSeverity = "P1" | "P2" | "P3";

// Deliberately minimal -- not a general-purpose issue tracker. Bounded
// count/message/path/line enforced by the parser that constructs these, not
// by this type.
export type ReviewerRuntimeFinding = {
  findingId: string;
  severity: ReviewerFindingSeverity;
  blocking: boolean;
  category: string;
  filePath?: string;
  line?: number;
  message: string;
  suggestion?: string;
};

export type ReviewerRuntimeEvidence = {
  providerId: string;
  agentId: string;
  role: "Reviewer";
  commandDisplay: string;
  workingDirectory: string;
  reviewTargetSha: string;
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

export type ReviewerRuntime = {
  reviewerRuntimeId: string;
  projectId: string;
  runtimeStartId: string;
  implementerRuntimeId: string;
  reviewTargetId: string;
  reviewPromptId: string;
  worktreePath: string;
  branch: string;
  specificationPath: string;
  implementer: string;
  reviewer: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  status: ReviewerRuntimeStatus;
  decision: ReviewerRuntimeDecision;
  findings: ReadonlyArray<ReviewerRuntimeFinding>;
  startedBy: string;
  startedAt: string;
  executionStarted: true;
  agentStarted: boolean;
  implementerStarted: true;
  reviewerStarted: boolean;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  evidence: ReviewerRuntimeEvidence;
  rulesVersion: string;
};

export type ReviewerRuntimeResult = {
  id: string;
  projectId: string;
  runtimeStartId?: string;
  implementerRuntimeId?: string;
  reviewerRuntimeId?: string;
  status: ReviewerRuntimeStatus;
  decision: ReviewerRuntimeDecision;
  blockingFindingCount: number;
  nonBlockingFindingCount: number;
  reasonCodes: ReviewerRuntimeReasonCode[];
  started: boolean;
  duplicateActiveAttempt: boolean;
  agentStarted: boolean;
  implementerStarted: true;
  reviewerStarted: boolean;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ReviewerRuntimeCollection = {
  projectId: string;
  runtimes: ReviewerRuntime[];
  runtimeCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewerRuntimeResultCollection = {
  projectId: string;
  results: ReviewerRuntimeResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewerRuntimeCommand = {
  projectId: string;
  runtimeStartId: string;
  executionPlanId: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  startedBy: string;
  requestedAt: string;
};

export type ReviewerRuntimeInput = {
  command: ReviewerRuntimeCommand;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  preflight?: RuntimePreflight;
  preflightResult?: RuntimePreflightResult;
  runtimeStart?: RuntimeStart;
  runtimeStartResult?: RuntimeStartResult;
  implementerRuntime?: ImplementerRuntime;
  implementerRuntimeResult?: ImplementerRuntimeResult;
  reviewTarget?: ReviewTarget;
  existingRuntimes?: ReviewerRuntimeCollection;
  existingResults?: ReviewerRuntimeResultCollection;
};

export type ReviewerRuntimeOutcome = {
  result: ReviewerRuntimeResult;
  runtime?: ReviewerRuntime;
  runtimeCollection?: ReviewerRuntimeCollection;
  resultCollection?: ReviewerRuntimeResultCollection;
};

export function createReviewerRuntimeId(
  projectId: string,
  reviewTargetId: string,
  rulesVersion = REVIEWER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:reviewer-runtime:${reviewTargetId}:${rulesVersion}`;
}

export function createReviewerRuntimeResultId(
  projectId: string,
  reviewTargetId: string,
  rulesVersion = REVIEWER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:reviewer-runtime-result:${reviewTargetId}:${rulesVersion}`;
}

export function createReviewerPromptId(
  projectId: string,
  reviewTargetId: string,
  rulesVersion = REVIEWER_RUNTIME_RULES_VERSION,
) {
  return `${projectId}:reviewer-prompt:${reviewTargetId}:${rulesVersion}`;
}

export function createReviewerRuntimeCollection(input: Omit<
  ReviewerRuntimeCollection,
  "runtimes" | "runtimeCount"
> & {
  runtimes: ReadonlyArray<ReviewerRuntime>;
}): ReviewerRuntimeCollection {
  const runtimes = input.runtimes.map(copyReviewerRuntime);
  return { ...input, runtimes, runtimeCount: runtimes.length };
}

export function createReviewerRuntimeResultCollection(input: Omit<
  ReviewerRuntimeResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ReviewerRuntimeResult>;
}): ReviewerRuntimeResultCollection {
  const results = input.results.map(copyReviewerRuntimeResult);
  return { ...input, results, resultCount: results.length };
}

export function copyReviewerRuntime(runtime: ReviewerRuntime): ReviewerRuntime {
  return {
    ...runtime,
    findings: runtime.findings.map(copyReviewerFinding),
    evidence: { ...runtime.evidence },
  };
}

export function copyReviewerRuntimeResult(result: ReviewerRuntimeResult): ReviewerRuntimeResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}

export function copyReviewerFinding(finding: ReviewerRuntimeFinding): ReviewerRuntimeFinding {
  return { ...finding };
}
