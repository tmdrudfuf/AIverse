import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadinessCollection, ExecutionReadinessResultCollection } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApprovalCollection } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import type { ImplementerRuntimeCollection, ImplementerRuntimeResultCollection } from "../implementer-runtime/ImplementerRuntimeTypes";
import type { ReviewTarget } from "../reviewer-runtime/ReviewTarget";
import type { ReviewerRuntimeCollection, ReviewerRuntimeResultCollection } from "../reviewer-runtime/ReviewerRuntimeTypes";
import { RUNTIME_PREFLIGHT_RULES_VERSION, createRuntimePreflightId } from "../runtime-preflight/RuntimePreflightTypes";
import type { RuntimePreflightCollection, RuntimePreflightResultCollection } from "../runtime-preflight/RuntimePreflightTypes";
import { RUNTIME_START_RULES_VERSION, createRuntimeStartId } from "../runtime-start/RuntimeStartTypes";
import type { RuntimeStartCollection, RuntimeStartResultCollection } from "../runtime-start/RuntimeStartTypes";
import {
  type ReviewPromotionCollection,
  type ReviewPromotionResultCollection,
  REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT,
  REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT,
  REVIEW_PROMOTION_RULES_VERSION,
  copyReviewPromotion,
  copyReviewPromotionResult,
  createReviewPromotionCollection,
  createReviewPromotionId,
  createReviewPromotionResultCollection,
  createReviewPromotionResultId,
  type ReviewDecisionClassification,
  type ReviewDecisionInput,
  type ReviewPromotion,
  type ReviewPromotionOutcome,
  type ReviewPromotionReasonCode,
  type ReviewPromotionRequest,
  type ReviewPromotionResult,
} from "./ReviewDecisionTypes";

export class ReviewDecisionService {
  classify(input: ReviewDecisionInput): ReviewDecisionClassification {
    const reviewerRuntime = input.reviewerRuntime;
    if (!reviewerRuntime) return { state: "Unavailable" };

    // "Stale" wins over the Reviewer Runtime's own status/decision whenever
    // the upstream chain no longer revalidates identically to what that
    // Reviewer Runtime was built from (see data-model.md, ReviewDecisionState
    // mapping).
    if (validateChain(input)) {
      return { state: "Stale", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
    }

    switch (reviewerRuntime.status) {
      case "Blocked":
        return { state: "Blocked", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
      case "TimedOut":
        return { state: "TimedOut", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
      case "Failed":
        return { state: "Failed", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
      case "Completed":
        return reviewerRuntime.decision === "Approved"
          ? { state: "Approved", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId }
          : { state: "ChangesRequested", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
      default:
        return { state: "ChangesRequested", reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId };
    }
  }

  promote(input: ReviewDecisionInput, request: ReviewPromotionRequest): ReviewPromotionOutcome {
    const existingPromotions = input.existingPromotions;
    const existingResults = input.existingPromotionResults;

    // Precondition 1 (contracts/human-promotion-contract.md): classify fresh,
    // never trust a previously rendered value; a mismatched or absent
    // reviewerRuntimeId always blocks here.
    const classification = this.classify(input);
    if (classification.reviewerRuntimeId !== request.reviewerRuntimeId) {
      return this.blockedOutcome(request, existingResults, "REVIEW_PROMOTION_TARGET_MISMATCH");
    }

    // Precondition 2: the fresh classification must be exactly Approved.
    if (classification.state !== "Approved") {
      return this.blockedOutcome(request, existingResults, reasonForNonApproved(classification.state));
    }

    // Precondition 3: an existing Review Promotion for this exact
    // reviewerRuntimeId short-circuits to an idempotent read -- no new
    // record, no re-invocation of anything, no actor check.
    const reviewPromotionId = createReviewPromotionId(request.projectId, request.reviewerRuntimeId);
    const existingPromotion = existingPromotions?.promotions.find(
      (promotion) => promotion.reviewPromotionId === reviewPromotionId,
    );
    if (existingPromotion) {
      const result = createResult(request, existingPromotion, true, ["REVIEW_PROMOTION_ALREADY_PROMOTED"]);
      return {
        result,
        promotion: copyReviewPromotion(existingPromotion),
        promotionCollection: this.upsertPromotion(existingPromotions, existingPromotion),
        resultCollection: this.upsertResult(existingResults, result),
      };
    }

    // Precondition 4: the requesting actor must be a human label.
    if (getActorBlockReason(request.actor)) {
      return this.blockedOutcome(request, existingResults, "REVIEW_PROMOTION_INVALID_ACTOR");
    }

    const plan = input.executionPlan!;
    const runtimeStart = input.runtimeStart!;
    const implementerRuntime = input.implementerRuntime!;
    const reviewTarget = input.reviewTarget!;
    const reviewerRuntime = input.reviewerRuntime!;

    const promotion: ReviewPromotion = {
      reviewPromotionId,
      projectId: request.projectId,
      planId: plan.planId,
      runtimeStartId: runtimeStart.runtimeStartId,
      implementerRuntimeId: implementerRuntime.implementerRuntimeId,
      reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId,
      reviewTargetId: reviewTarget.reviewTargetId,
      worktreePath: plan.worktreePath,
      branch: plan.branchName,
      repositoryId: plan.repositoryId,
      implementer: plan.implementerAgent,
      reviewer: plan.reviewerAgent,
      approvedImplementerAgent: reviewerRuntime.approvedImplementerAgent,
      approvedReviewerAgent: reviewerRuntime.approvedReviewerAgent,
      decision: "Approved",
      promotedBy: request.actor,
      promotedAt: request.requestedAt,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    };

    const result = createResult(request, promotion, false, ["REVIEW_PROMOTION_GRANTED"]);
    return {
      result,
      promotion: copyReviewPromotion(promotion),
      promotionCollection: this.upsertPromotion(existingPromotions, promotion),
      resultCollection: this.upsertResult(existingResults, result),
    };
  }

  upsertPromotion(collection: ReviewDecisionInput["existingPromotions"], promotion: ReviewPromotion) {
    const existing = collection?.promotions ?? [];
    const nextPromotions = existing.some((item) => item.reviewPromotionId === promotion.reviewPromotionId)
      ? existing.map((item) => (item.reviewPromotionId === promotion.reviewPromotionId ? promotion : item))
      : [...existing, promotion];
    return createReviewPromotionCollection({
      projectId: collection?.projectId ?? promotion.projectId,
      promotions: nextPromotions,
      generatedAt: promotion.promotedAt,
      rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    });
  }

  upsertResult(collection: ReviewDecisionInput["existingPromotionResults"], result: ReviewPromotionResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createReviewPromotionResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    });
  }

  private blockedOutcome(
    request: ReviewPromotionRequest,
    existingResults: ReviewDecisionInput["existingPromotionResults"],
    reason: ReviewPromotionReasonCode,
  ): ReviewPromotionOutcome {
    const result = createResult(request, undefined, false, [reason]);
    return {
      result,
      resultCollection: this.upsertResult(existingResults, result),
    };
  }
}

function reasonForNonApproved(state: ReviewDecisionClassification["state"]): ReviewPromotionReasonCode {
  switch (state) {
    case "Unavailable":
      return "REVIEW_PROMOTION_REVIEWER_MISSING";
    case "Stale":
      return "REVIEW_PROMOTION_REVIEWER_STALE";
    case "ChangesRequested":
      return "REVIEW_PROMOTION_DECISION_NOT_APPROVED";
    case "Blocked":
    case "TimedOut":
    case "Failed":
    default:
      return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }
}

function createResult(
  request: ReviewPromotionRequest,
  promotion: ReviewPromotion | undefined,
  alreadyPromoted: boolean,
  reasonCodes: ReviewPromotionReasonCode[],
): ReviewPromotionResult {
  return {
    id: createReviewPromotionResultId(request.projectId, request.reviewerRuntimeId),
    projectId: request.projectId,
    reviewerRuntimeId: request.reviewerRuntimeId,
    reviewPromotionId: promotion?.reviewPromotionId,
    granted: Boolean(promotion),
    reasonCodes,
    alreadyPromoted,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: request.requestedAt,
    rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
  };
}

function getActorBlockReason(actor: string | undefined): ReviewPromotionReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation|workflow)/.test(normalized)) {
    return "REVIEW_PROMOTION_INVALID_ACTOR";
  }
  return undefined;
}

// Mirrors ReviewerRuntimeService's own validateContext/validateRoleBinding/
// validateReviewTarget field-by-field, extended one layer further to the
// Reviewer Runtime itself -- the same per-stage duplication convention
// ReviewerRuntimeService already used for Implementer Runtime's chain (see
// research.md, "Precedent-scope boundary"), not a shared/exported import.
function validateChain(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined {
  const plan = input.executionPlan;
  const readiness = input.readiness;
  const readinessResult = input.readinessResult;
  const approval = input.approval;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;
  const runtimeStart = input.runtimeStart;
  const runtimeStartResult = input.runtimeStartResult;
  const implementerRuntime = input.implementerRuntime;
  const implementerRuntimeResult = input.implementerRuntimeResult;
  const reviewTarget = input.reviewTarget;
  const reviewerRuntime = input.reviewerRuntime;
  const reviewerRuntimeResult = input.reviewerRuntimeResult;

  if (!plan || plan.projectId !== input.projectId) return "REVIEW_PROMOTION_PLAN_INVALID";
  if (
    plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) ||
    plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION
  ) {
    return "REVIEW_PROMOTION_PLAN_INVALID";
  }

  if (!readiness || !readinessResult || readiness.status !== "Ready" || readinessResult.status !== "Ready") {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (readiness.projectId !== plan.projectId || readinessResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }
  if (readiness.executionPlanId !== plan.planId || readinessResult.executionPlanId !== plan.planId) {
    return "REVIEW_PROMOTION_READINESS_NOT_READY";
  }

  if (!approval || approval.projectId !== plan.projectId || approval.executionPlanId !== plan.planId || !approval.executionApproved) {
    return "REVIEW_PROMOTION_APPROVAL_STALE";
  }
  if (getActorBlockReason(approval.approvedBy)) return "REVIEW_PROMOTION_INVALID_ACTOR";

  if (
    !preflight || !preflightResult ||
    preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId ||
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.status !== "Ready" || preflightResult.status !== "Ready" ||
    !preflight.runtimePreflightPassed || !preflightResult.runtimePreflightPassed
  ) {
    return "REVIEW_PROMOTION_PREFLIGHT_NOT_READY";
  }

  if (!runtimeStart || !runtimeStartResult) return "REVIEW_PROMOTION_START_STALE";
  if (runtimeStart.projectId !== plan.projectId || runtimeStartResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (
    runtimeStart.runtimeStartId !== createRuntimeStartId(plan.projectId, plan.planId) ||
    runtimeStart.rulesVersion !== RUNTIME_START_RULES_VERSION ||
    (runtimeStartResult.status !== "Started" && runtimeStartResult.status !== "AlreadyStarted")
  ) {
    return "REVIEW_PROMOTION_START_STALE";
  }
  if (runtimeStart.repositoryId !== plan.repositoryId) return "REVIEW_PROMOTION_START_STALE";

  if (!implementerRuntime || !implementerRuntimeResult) return "REVIEW_PROMOTION_IMPLEMENTER_MISSING";
  if (implementerRuntime.projectId !== plan.projectId || implementerRuntimeResult.projectId !== plan.projectId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_MISSING";
  }
  if (implementerRuntime.runtimeStartId !== runtimeStart.runtimeStartId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.status !== "Completed" || implementerRuntimeResult.status !== "Completed") {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (implementerRuntime.repositoryId !== plan.repositoryId) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }
  if (
    implementerRuntimeResult.executionPlanId !== plan.planId ||
    implementerRuntimeResult.runtimeStartId !== runtimeStart.runtimeStartId ||
    implementerRuntimeResult.implementerRuntimeId !== implementerRuntime.implementerRuntimeId
  ) {
    return "REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED";
  }

  if (
    plan.implementerAgent !== approval.implementerAgent ||
    plan.reviewerAgent !== approval.reviewerAgent ||
    plan.implementerAgent !== runtimeStart.implementer ||
    plan.reviewerAgent !== runtimeStart.reviewer ||
    plan.implementerAgent !== implementerRuntime.implementer ||
    plan.reviewerAgent !== implementerRuntime.reviewer
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  if (
    implementerRuntime.approvedImplementerAgent !== REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT ||
    implementerRuntime.approvedReviewerAgent !== REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }

  if (!reviewTarget) return "REVIEW_PROMOTION_TARGET_MISMATCH";
  if (
    reviewTarget.projectId !== plan.projectId ||
    reviewTarget.runtimeStartId !== runtimeStart.runtimeStartId ||
    reviewTarget.implementerRuntimeId !== implementerRuntime.implementerRuntimeId ||
    reviewTarget.repositoryId !== plan.repositoryId
  ) {
    return "REVIEW_PROMOTION_TARGET_MISMATCH";
  }

  if (!reviewerRuntime) return "REVIEW_PROMOTION_REVIEWER_MISSING";
  if (
    reviewerRuntime.projectId !== plan.projectId ||
    reviewerRuntime.runtimeStartId !== runtimeStart.runtimeStartId ||
    reviewerRuntime.implementerRuntimeId !== implementerRuntime.implementerRuntimeId ||
    reviewerRuntime.reviewTargetId !== reviewTarget.reviewTargetId ||
    reviewerRuntime.worktreePath !== plan.worktreePath ||
    reviewerRuntime.branch !== plan.branchName ||
    reviewerRuntime.specificationPath !== plan.specPath
  ) {
    return "REVIEW_PROMOTION_REVIEWER_STALE";
  }
  if (
    reviewerRuntime.implementer !== plan.implementerAgent ||
    reviewerRuntime.reviewer !== plan.reviewerAgent ||
    reviewerRuntime.approvedImplementerAgent !== REVIEW_PROMOTION_APPROVED_IMPLEMENTER_AGENT ||
    reviewerRuntime.approvedReviewerAgent !== REVIEW_PROMOTION_APPROVED_REVIEWER_AGENT
  ) {
    return "REVIEW_PROMOTION_ROLE_MISMATCH";
  }
  if (!reviewerRuntimeResult || reviewerRuntimeResult.reviewerRuntimeId !== reviewerRuntime.reviewerRuntimeId) {
    return "REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED";
  }

  return undefined;
}

// Single shared assembly of ReviewDecisionInput from raw per-project stage
// collections, keyed by the given plan. Used by both the Promote action
// (OfficeProjectPortalController.promoteReviewForPromotion) and the dashboard
// render (OfficeProjectPortalView.render) so both call classify() against an
// identically-assembled input rather than each maintaining their own
// find-by-planId lookups that could drift apart -- see
// contracts/review-decision-contract.md ("every caller reads the same single
// classification").
export function resolveReviewDecisionInput(params: {
  projectId: string;
  plan: ExecutionPlan;
  readinessCollection?: ExecutionReadinessCollection;
  readinessResultCollection?: ExecutionReadinessResultCollection;
  approvalCollection?: HumanExecutionApprovalCollection;
  preflightCollection?: RuntimePreflightCollection;
  preflightResultCollection?: RuntimePreflightResultCollection;
  runtimeStartCollection?: RuntimeStartCollection;
  runtimeStartResultCollection?: RuntimeStartResultCollection;
  implementerRuntimeCollection?: ImplementerRuntimeCollection;
  implementerRuntimeResultCollection?: ImplementerRuntimeResultCollection;
  reviewTarget?: ReviewTarget;
  reviewerRuntimeCollection?: ReviewerRuntimeCollection;
  reviewerRuntimeResultCollection?: ReviewerRuntimeResultCollection;
  existingPromotions?: ReviewPromotionCollection;
  existingPromotionResults?: ReviewPromotionResultCollection;
}): ReviewDecisionInput {
  const { projectId, plan } = params;

  const readiness = params.readinessCollection?.readiness.find((item) => item.executionPlanId === plan.planId);
  const readinessResult = readiness
    ? params.readinessResultCollection?.results.find((item) =>
      item.executionPlanId === plan.planId && item.readinessId === readiness.readinessId
    )
    : undefined;
  const approval = params.approvalCollection?.approvals.find((item) => item.executionPlanId === plan.planId);
  const preflight = params.preflightCollection?.preflights.find((item) => item.executionPlanId === plan.planId);
  const preflightResult = preflight
    ? params.preflightResultCollection?.results.find((item) =>
      item.executionPlanId === plan.planId && item.preflightId === preflight.preflightId
    )
    : undefined;
  const runtimeStart = params.runtimeStartCollection?.starts.find((item) => item.executionPlanId === plan.planId);
  const runtimeStartResult = runtimeStart
    ? params.runtimeStartResultCollection?.results.find((item) =>
      item.executionPlanId === plan.planId && item.runtimeStartId === runtimeStart.runtimeStartId
    )
    : undefined;
  const implementerRuntime = params.implementerRuntimeCollection?.runtimes.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const implementerRuntimeResult = implementerRuntime
    ? params.implementerRuntimeResultCollection?.results.find((item) =>
      item.executionPlanId === plan.planId && item.implementerRuntimeId === implementerRuntime.implementerRuntimeId
    )
    : undefined;
  const reviewerRuntime = implementerRuntime
    ? params.reviewerRuntimeCollection?.runtimes.find(
      (item) => item.implementerRuntimeId === implementerRuntime.implementerRuntimeId,
    )
    : undefined;
  const reviewerRuntimeResult = reviewerRuntime
    ? params.reviewerRuntimeResultCollection?.results.find(
      (item) => item.reviewerRuntimeId === reviewerRuntime.reviewerRuntimeId,
    )
    : undefined;

  return {
    projectId,
    executionPlan: plan,
    readiness,
    readinessResult,
    approval,
    preflight,
    preflightResult,
    runtimeStart,
    runtimeStartResult,
    implementerRuntime,
    implementerRuntimeResult,
    reviewTarget: params.reviewTarget,
    reviewerRuntime,
    reviewerRuntimeResult,
    existingPromotions: params.existingPromotions,
    existingPromotionResults: params.existingPromotionResults,
  };
}
