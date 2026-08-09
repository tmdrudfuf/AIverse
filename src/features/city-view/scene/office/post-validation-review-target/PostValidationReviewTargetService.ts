import { ReviewDecisionService } from "../review-decision/ReviewDecisionService";
import { getActorBlockReason } from "../review-decision/ReviewRuntimeChainIntegrityService";
import { findCurrentReviewFixPlan, ReviewFixPlanService } from "../review-fix-plans/ReviewFixPlanService";
import type { ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import { findCurrentReviewFixRequest } from "../review-fix-requests/ReviewFixRequestService";
import { findCurrentReviewFixRuntime, findCurrentReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeService";
import {
  createReviewFixRuntimeId,
  createReviewFixRuntimeResultId,
  type ReviewFixRuntime,
  type ReviewFixRuntimeResult,
} from "../review-fix-runtime/ReviewFixRuntimeTypes";
import {
  REVIEW_TARGET_BASE_BRANCH,
  REVIEW_TARGET_RULES_VERSION,
  createPostValidationReviewTargetId,
  computeReviewTargetBaseSha,
  copyReviewTarget,
  type ReviewTarget,
} from "../reviewer-runtime/ReviewTarget";
import {
  VALIDATION_RUNTIME_RULES_VERSION,
  type ValidationRuntime,
  type ValidationRuntimeResult,
} from "../validation-runtime/ValidationRuntimeTypes";
import { findCurrentValidationRuntime } from "../validation-runtime/ValidationRuntimeService";
import {
  POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
  createPostValidationReviewTargetCollection,
  createPostValidationReviewTargetResultCollection,
  createPostValidationReviewTargetResultId,
  type PostValidationReviewTargetCommand,
  type PostValidationReviewTargetInput,
  type PostValidationReviewTargetOutcome,
  type PostValidationReviewTargetReasonCode,
  type PostValidationReviewTargetResult,
  type PostValidationReviewTargetStatus,
} from "./PostValidationReviewTargetTypes";
import {
  UnavailablePostValidationReviewTargetProvider,
  type PostValidationReviewTargetInspection,
  type PostValidationReviewTargetProvider,
} from "./PostValidationReviewTargetProvider";

export class PostValidationReviewTargetService {
  private readonly reviewDecisionService = new ReviewDecisionService();
  private readonly reviewFixPlanService = new ReviewFixPlanService();

  constructor(
    private readonly provider: PostValidationReviewTargetProvider = new UnavailablePostValidationReviewTargetProvider(),
  ) {}

  prepareTarget(input: PostValidationReviewTargetInput, command: PostValidationReviewTargetCommand): PostValidationReviewTargetOutcome {
    if (!command.projectId || !command.validationRuntimeId || !command.actor || !command.requestedAt) {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_MALFORMED", "Failed");
    }
    if (getActorBlockReason(command.actor)) {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_INVALID_ACTOR");
    }

    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification)
      ?? input.existingFixRequests?.requests.find((request) => request.projectId === command.projectId);
    const currentPlan = findCurrentReviewFixPlan(input, currentRequest)
      ?? input.existingFixPlans?.plans.find((plan) => plan.projectId === command.projectId && plan.reviewFixRequestId === currentRequest?.reviewFixRequestId);
    const currentFixRuntime = findCurrentReviewFixRuntime(input, currentPlan)
      ?? input.existingFixRuntimes?.runtimes.find((runtime) => runtime.projectId === command.projectId && runtime.reviewFixPlanId === currentPlan?.reviewFixPlanId);
    const currentFixRuntimeResult = findCurrentReviewFixRuntimeResult(command.projectId, currentPlan, input.existingFixRuntimeResults)
      ?? input.existingFixRuntimeResults?.results.find((result) => result.reviewFixRuntimeId === currentFixRuntime?.reviewFixRuntimeId);
    const currentValidationRuntime = findCurrentValidationRuntime(input, currentFixRuntime)
      ?? input.existingValidationRuntimes?.runtimes.find((runtime) => runtime.validationRuntimeId === command.validationRuntimeId);
    const currentValidationResult = findCurrentValidationRuntimeResult(input, currentValidationRuntime);

    if (!currentRequest || !currentPlan || !currentFixRuntime || !currentFixRuntimeResult || !currentValidationRuntime || !currentValidationResult) {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_VALIDATION_MISSING");
    }
    if (currentValidationRuntime.validationRuntimeId !== command.validationRuntimeId) {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_CONTEXT_MISMATCH");
    }

    const validationReason = validateCompletedValidation(
      currentPlan,
      currentFixRuntime,
      currentFixRuntimeResult,
      currentValidationRuntime,
      currentValidationResult,
    );
    if (validationReason) return this.blockedOutcome(command, validationReason);

    const revalidatedPlan = this.reviewFixPlanService.planFix(input, {
      projectId: command.projectId,
      reviewFixRequestId: currentPlan.reviewFixRequestId,
      actor: currentPlan.plannedBy,
      plannedAt: currentPlan.plannedAt,
    });
    if (
      (revalidatedPlan.result.status !== "Planned" && revalidatedPlan.result.status !== "AlreadyPlanned") ||
      !revalidatedPlan.plan ||
      !planStillMatches(currentPlan, revalidatedPlan.plan)
    ) {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_VALIDATION_STALE");
    }

    const inspection = this.provider.inspect({
      repositoryId: currentPlan.repositoryId,
      worktreePath: currentPlan.worktreePath,
      branch: currentPlan.branch,
      expectedHead: currentValidationRuntime.expectedHead,
    });
    if (!inspection.available || !inspection.clean || !inspection.exactHeadMatch || inspection.workingTreeState !== "Clean") {
      return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_HEAD_CHANGED");
    }

    const reviewTarget = createTarget(
      currentPlan,
      currentFixRuntime,
      currentFixRuntimeResult,
      currentValidationRuntime,
      currentValidationResult,
      inspection,
      command.requestedAt,
    );
    const existingTarget = input.existingPostValidationReviewTargets?.targets.find((target) =>
      target.reviewTargetId === reviewTarget.reviewTargetId
    );
    if (existingTarget) {
      if (!targetsMatch(existingTarget, reviewTarget)) {
        return this.blockedOutcome(command, "POST_VALIDATION_REVIEW_TARGET_EXISTING_TARGET_MISMATCH");
      }
      const result = createResult(command, existingTarget, "AlreadyReady", ["POST_VALIDATION_REVIEW_TARGET_ALREADY_READY"]);
      return {
        result,
        reviewTarget: copyReviewTarget(existingTarget),
        targetCollection: this.upsertTarget(input.existingPostValidationReviewTargets, existingTarget),
        resultCollection: this.upsertResult(input.existingPostValidationReviewTargetResults, result),
      };
    }

    const result = createResult(command, reviewTarget, "Ready", ["POST_VALIDATION_REVIEW_TARGET_READY"]);
    return {
      result,
      reviewTarget,
      targetCollection: this.upsertTarget(input.existingPostValidationReviewTargets, reviewTarget),
      resultCollection: this.upsertResult(input.existingPostValidationReviewTargetResults, result),
    };
  }

  upsertTarget(collection: PostValidationReviewTargetInput["existingPostValidationReviewTargets"], target: ReviewTarget) {
    const existing = collection?.targets ?? [];
    const nextTargets = existing.some((item) => item.reviewTargetId === target.reviewTargetId)
      ? existing.map((item) => (item.reviewTargetId === target.reviewTargetId ? target : item))
      : [...existing, target];
    return createPostValidationReviewTargetCollection({
      projectId: collection?.projectId ?? target.projectId,
      targets: nextTargets,
      generatedAt: target.resolvedAt,
      rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
    });
  }

  upsertResult(
    collection: PostValidationReviewTargetInput["existingPostValidationReviewTargetResults"],
    result: PostValidationReviewTargetResult,
  ) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createPostValidationReviewTargetResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
    });
  }

  private blockedOutcome(
    command: PostValidationReviewTargetCommand,
    reason: PostValidationReviewTargetReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): PostValidationReviewTargetOutcome {
    const result = createResult(command, undefined, status, [reason]);
    return { result, resultCollection: this.upsertResult(undefined, result) };
  }
}

export function findCurrentPostValidationReviewTarget(
  collection: PostValidationReviewTargetInput["existingPostValidationReviewTargets"],
  validationRuntime: ValidationRuntime | undefined,
): ReviewTarget | undefined {
  if (!validationRuntime) return undefined;
  const target = collection?.targets.find((item) =>
    item.source === "PostValidation" &&
    item.validationRuntimeId === validationRuntime.validationRuntimeId &&
    item.reviewTargetSha === validationRuntime.expectedHead
  );
  return target ? copyReviewTarget(target) : undefined;
}

function createTarget(
  plan: ReviewFixPlan,
  fixRuntime: ReviewFixRuntime,
  fixRuntimeResult: ReviewFixRuntimeResult,
  validationRuntime: ValidationRuntime,
  validationResult: ValidationRuntimeResult,
  inspection: PostValidationReviewTargetInspection,
  resolvedAt: string,
): ReviewTarget {
  const reviewTargetSha = validationRuntime.expectedHead;
  const baseSha = computeReviewTargetBaseSha(plan.projectId, plan.planId);
  return copyReviewTarget({
    reviewTargetId: createPostValidationReviewTargetId(plan.projectId, validationRuntime.validationRuntimeId, reviewTargetSha),
    projectId: plan.projectId,
    source: "PostValidation",
    runtimeStartId: plan.runtimeStartId,
    implementerRuntimeId: plan.implementerRuntimeId,
    reviewFixRequestId: plan.reviewFixRequestId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: fixRuntime.reviewFixRuntimeId,
    reviewFixRuntimeResultId: fixRuntimeResult.id,
    validationRuntimeId: validationRuntime.validationRuntimeId,
    validationRuntimeResultId: validationResult.id,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    baseBranch: REVIEW_TARGET_BASE_BRANCH,
    baseSha,
    featureBranch: plan.branch,
    reviewTargetSha,
    mergeBaseSha: baseSha,
    workingTreeState: inspection.workingTreeState,
    changedFiles: [],
    validationCommands: [...validationRuntime.validationCommands],
    validationEvidenceCommandCount: validationRuntime.evidence.commandCount,
    validationEvidenceCompletedCommandCount: validationRuntime.evidence.completedCommandCount,
    validationEvidenceExpectedHead: validationRuntime.evidence.expectedHead,
    validationRuntimeRulesVersion: validationRuntime.rulesVersion,
    specificationPath: plan.specificationPath,
    resolvedAt,
    rulesVersion: REVIEW_TARGET_RULES_VERSION,
  });
}

function validateCompletedValidation(
  plan: ReviewFixPlan,
  fixRuntime: ReviewFixRuntime,
  fixRuntimeResult: ReviewFixRuntimeResult,
  validationRuntime: ValidationRuntime,
  validationResult: ValidationRuntimeResult,
): PostValidationReviewTargetReasonCode | undefined {
  if (validationRuntime.status !== "Completed" || validationResult.status !== "Completed") {
    return "POST_VALIDATION_REVIEW_TARGET_VALIDATION_NOT_COMPLETED";
  }
  if (validationRuntime.rulesVersion !== VALIDATION_RUNTIME_RULES_VERSION) {
    return "POST_VALIDATION_REVIEW_TARGET_VALIDATION_STALE";
  }
  if (
    fixRuntime.reviewFixRuntimeId !== createReviewFixRuntimeId(plan.projectId, plan.reviewFixPlanId) ||
    fixRuntimeResult.id !== createReviewFixRuntimeResultId(plan.projectId, fixRuntime.reviewFixRuntimeId)
  ) {
    return "POST_VALIDATION_REVIEW_TARGET_CONTEXT_MISMATCH";
  }
  if (
    validationResult.validationRuntimeId !== validationRuntime.validationRuntimeId ||
    validationResult.reviewFixRuntimeId !== fixRuntime.reviewFixRuntimeId ||
    validationRuntime.reviewFixRuntimeId !== fixRuntime.reviewFixRuntimeId ||
    validationRuntime.reviewFixRuntimeResultId !== fixRuntimeResult.id
  ) {
    return "POST_VALIDATION_REVIEW_TARGET_CONTEXT_MISMATCH";
  }
  if (
    validationRuntime.projectId !== plan.projectId ||
    validationRuntime.repositoryId !== plan.repositoryId ||
    validationRuntime.worktreePath !== plan.worktreePath ||
    validationRuntime.branch !== plan.branch ||
    validationRuntime.reviewFixPlanId !== plan.reviewFixPlanId ||
    validationRuntime.reviewFixRequestId !== plan.reviewFixRequestId
  ) {
    return "POST_VALIDATION_REVIEW_TARGET_CONTEXT_MISMATCH";
  }
  if (
    validationRuntime.expectedHead !== validationRuntime.evidence.expectedHead ||
    validationRuntime.evidence.commandCount !== validationRuntime.validationCommands.length ||
    validationRuntime.evidence.completedCommandCount !== validationRuntime.validationCommands.length ||
    validationRuntime.evidence.failedCommandCount !== 0 ||
    validationRuntime.evidence.timedOutCommandCount !== 0 ||
    validationResult.commandCount !== validationRuntime.evidence.commandCount ||
    validationResult.completedCommandCount !== validationRuntime.evidence.completedCommandCount ||
    validationResult.failedCommandCount !== 0 ||
    validationResult.timedOutCommandCount !== 0
  ) {
    return "POST_VALIDATION_REVIEW_TARGET_HEAD_CHANGED";
  }
  if (
    validationRuntime.reviewerStarted ||
    validationRuntime.reviewTargetCreated ||
    validationRuntime.promotionStarted ||
    validationRuntime.repositoryMutationStarted ||
    validationRuntime.githubMutationStarted
  ) {
    return "POST_VALIDATION_REVIEW_TARGET_VALIDATION_STALE";
  }
  return undefined;
}

function findCurrentValidationRuntimeResult(
  input: PostValidationReviewTargetInput,
  validationRuntime: ValidationRuntime | undefined,
): ValidationRuntimeResult | undefined {
  if (!validationRuntime) return undefined;
  return input.existingValidationRuntimeResults?.results.find((result) =>
    result.validationRuntimeId === validationRuntime.validationRuntimeId ||
    (result.reviewFixRuntimeId === validationRuntime.reviewFixRuntimeId && result.status === validationRuntime.status)
  );
}

function createResult(
  command: PostValidationReviewTargetCommand,
  target: ReviewTarget | undefined,
  status: PostValidationReviewTargetStatus,
  reasonCodes: PostValidationReviewTargetReasonCode[],
): PostValidationReviewTargetResult {
  return {
    id: createPostValidationReviewTargetResultId(command.projectId || "unknown-project", command.validationRuntimeId || "unknown-validation-runtime"),
    projectId: command.projectId || "unknown-project",
    validationRuntimeId: command.validationRuntimeId || undefined,
    reviewTargetId: target?.reviewTargetId,
    status,
    reasonCodes,
    targetReady: Boolean(target),
    alreadyReady: reasonCodes.includes("POST_VALIDATION_REVIEW_TARGET_ALREADY_READY"),
    reviewerStarted: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    resultAt: command.requestedAt || new Date(0).toISOString(),
    rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
  };
}

function planStillMatches(left: ReviewFixPlan, right: ReviewFixPlan) {
  return (
    left.reviewFixPlanId === right.reviewFixPlanId &&
    left.reviewFixRequestId === right.reviewFixRequestId &&
    left.planId === right.planId &&
    left.worktreePath === right.worktreePath &&
    left.branch === right.branch &&
    left.repositoryId === right.repositoryId &&
    left.validationCommands.length === right.validationCommands.length &&
    left.validationCommands.every((command, index) => command === right.validationCommands[index]) &&
    left.rulesVersion === right.rulesVersion
  );
}

function targetsMatch(left: ReviewTarget, right: ReviewTarget) {
  return (
    left.reviewTargetId === right.reviewTargetId &&
    left.source === "PostValidation" &&
    right.source === "PostValidation" &&
    left.validationRuntimeId === right.validationRuntimeId &&
    left.validationRuntimeResultId === right.validationRuntimeResultId &&
    left.reviewTargetSha === right.reviewTargetSha &&
    left.validationEvidenceExpectedHead === right.validationEvidenceExpectedHead &&
    left.repositoryId === right.repositoryId &&
    left.worktreePath === right.worktreePath &&
    left.featureBranch === right.featureBranch
  );
}
