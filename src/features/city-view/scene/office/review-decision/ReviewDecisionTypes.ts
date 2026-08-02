import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { ImplementerRuntime, ImplementerRuntimeResult } from "../implementer-runtime/ImplementerRuntimeTypes";
import type { ReviewTarget } from "../reviewer-runtime/ReviewTarget";
import type { ReviewerRuntime, ReviewerRuntimeDecision, ReviewerRuntimeResult } from "../reviewer-runtime/ReviewerRuntimeTypes";
import type { RuntimePreflight, RuntimePreflightResult } from "../runtime-preflight/RuntimePreflightTypes";
import type { RuntimeStart, RuntimeStartResult } from "../runtime-start/RuntimeStartTypes";

export const REVIEW_PROMOTION_RULES_VERSION = "review-promotion-v1";

export const REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT = "claude";
export const REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT = "codex";

// Derived-only, never persisted (see plan.md, Architecture Decision 1). One
// state -> one truthful meaning; "Stale" always wins over the Reviewer
// Runtime's own status/decision whenever the upstream chain no longer
// revalidates identically to what that Reviewer Runtime was built from.
export type ReviewDecisionState =
  | "Unavailable"
  | "Blocked"
  | "TimedOut"
  | "Failed"
  | "ChangesRequested"
  | "Approved"
  | "Stale";

export type ReviewDecisionClassification = {
  state: ReviewDecisionState;
  reviewerRuntimeId?: string;
  // Raw ReviewerRuntimeDecision behind a "ChangesRequested" state, carried
  // through only when it is truthfully known (see review.md, Round 8
  // P2-001). Lets reasonForNonApproved distinguish an actual reviewer
  // ChangesRequested decision from a Completed run whose decision came back
  // "Unknown" without adding a second ReviewDecisionState value for what is
  // still, for every promotion/display purpose, the same non-promotable
  // bucket.
  decision?: ReviewerRuntimeDecision;
};

export type ReviewPromotionReasonCode =
  | "REVIEW_PROMOTION_GRANTED"
  | "REVIEW_PROMOTION_ALREADY_PROMOTED"
  | "REVIEW_PROMOTION_PLAN_INVALID"
  | "REVIEW_PROMOTION_READINESS_NOT_READY"
  | "REVIEW_PROMOTION_APPROVAL_STALE"
  | "REVIEW_PROMOTION_PREFLIGHT_NOT_READY"
  | "REVIEW_PROMOTION_START_STALE"
  | "REVIEW_PROMOTION_IMPLEMENTER_MISSING"
  | "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED"
  | "REVIEW_PROMOTION_REVIEWER_MISSING"
  | "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED"
  | "REVIEW_PROMOTION_REVIEWER_BLOCKED"
  | "REVIEW_PROMOTION_REVIEWER_TIMED_OUT"
  | "REVIEW_PROMOTION_REVIEWER_FAILED"
  | "REVIEW_PROMOTION_REVIEWER_DECISION_UNKNOWN"
  | "REVIEW_PROMOTION_DECISION_NOT_APPROVED"
  | "REVIEW_PROMOTION_REVIEWER_STALE"
  | "REVIEW_PROMOTION_ROLE_MISMATCH"
  | "REVIEW_PROMOTION_TARGET_MISMATCH"
  | "REVIEW_PROMOTION_INVALID_ACTOR"
  | "REVIEW_PROMOTION_INTERNAL_FAILURE";

// Explicit human request. Never derived from a dashboard render -- a caller
// must name the exact Reviewer Runtime being promoted (see
// contracts/human-promotion-contract.md, "Input Boundary").
export type ReviewPromotionRequest = {
  projectId: string;
  reviewerRuntimeId: string;
  actor: string;
  requestedAt: string;
};

export type ReviewPromotion = {
  reviewPromotionId: string;
  projectId: string;
  planId: string;
  runtimeStartId: string;
  implementerRuntimeId: string;
  reviewerRuntimeId: string;
  reviewTargetId: string;
  worktreePath: string;
  branch: string;
  repositoryId: string;
  implementer: string;
  reviewer: string;
  approvedImplementerAgent: string;
  approvedReviewerAgent: string;
  decision: "Approved";
  promotedBy: string;
  promotedAt: string;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  rulesVersion: string;
};

export type ReviewPromotionResult = {
  id: string;
  projectId: string;
  reviewerRuntimeId?: string;
  reviewPromotionId?: string;
  granted: boolean;
  reasonCodes: ReviewPromotionReasonCode[];
  alreadyPromoted: boolean;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ReviewPromotionCollection = {
  projectId: string;
  promotions: ReviewPromotion[];
  promotionCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewPromotionResultCollection = {
  projectId: string;
  results: ReviewPromotionResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

// Bundled read context for both classify() and promote(), mirroring
// ReviewerRuntimeInput's shape one stage later: the Reviewer Runtime and its
// result are now upstream, already-produced facts to revalidate rather than
// something this feature creates.
export type ReviewDecisionInput = {
  projectId: string;
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
  reviewerRuntime?: ReviewerRuntime;
  reviewerRuntimeResult?: ReviewerRuntimeResult;
  existingPromotions?: ReviewPromotionCollection;
  existingPromotionResults?: ReviewPromotionResultCollection;
};

export type ReviewPromotionOutcome = {
  result: ReviewPromotionResult;
  promotion?: ReviewPromotion;
  promotionCollection?: ReviewPromotionCollection;
  resultCollection?: ReviewPromotionResultCollection;
};

export function createReviewPromotionId(
  projectId: string,
  reviewerRuntimeId: string,
  rulesVersion = REVIEW_PROMOTION_RULES_VERSION,
) {
  return `${projectId}:review-promotion:${reviewerRuntimeId}:${rulesVersion}`;
}

export function createReviewPromotionResultId(
  projectId: string,
  reviewerRuntimeId: string,
  rulesVersion = REVIEW_PROMOTION_RULES_VERSION,
) {
  return `${projectId}:review-promotion-result:${reviewerRuntimeId}:${rulesVersion}`;
}

export function createReviewPromotionCollection(input: Omit<
  ReviewPromotionCollection,
  "promotions" | "promotionCount"
> & {
  promotions: ReadonlyArray<ReviewPromotion>;
}): ReviewPromotionCollection {
  const promotions = input.promotions.map(copyReviewPromotion);
  return { ...input, promotions, promotionCount: promotions.length };
}

export function createReviewPromotionResultCollection(input: Omit<
  ReviewPromotionResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ReviewPromotionResult>;
}): ReviewPromotionResultCollection {
  const results = input.results.map(copyReviewPromotionResult);
  return { ...input, results, resultCount: results.length };
}

export function copyReviewPromotion(promotion: ReviewPromotion): ReviewPromotion {
  return { ...promotion };
}

export function copyReviewPromotionResult(result: ReviewPromotionResult): ReviewPromotionResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}
