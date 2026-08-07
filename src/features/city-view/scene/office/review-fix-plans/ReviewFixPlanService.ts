import { ReviewDecisionService } from "../review-decision/ReviewDecisionService";
import { getActorBlockReason } from "../review-decision/ReviewRuntimeChainIntegrityService";
import {
  ReviewFixRequestService,
  findCurrentReviewFixRequest,
} from "../review-fix-requests/ReviewFixRequestService";
import type { ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import {
  REVIEW_FIX_PLAN_RULES_VERSION,
  copyReviewFixPlan,
  createReviewFixPlanCollection,
  createReviewFixPlanId,
  createReviewFixPlanResultCollection,
  createReviewFixPlanResultId,
  type ReviewFixPlan,
  type ReviewFixPlanCollection,
  type ReviewFixPlanCommand,
  type ReviewFixPlanInput,
  type ReviewFixPlanOutcome,
  type ReviewFixPlanReasonCode,
  type ReviewFixPlanResult,
} from "./ReviewFixPlanTypes";

export class ReviewFixPlanService {
  private readonly reviewDecisionService = new ReviewDecisionService();
  private readonly reviewFixRequestService = new ReviewFixRequestService();

  planFix(input: ReviewFixPlanInput, command: ReviewFixPlanCommand): ReviewFixPlanOutcome {
    const existingPlans = input.existingFixPlans;
    const existingResults = input.existingFixPlanResults;

    if (getActorBlockReason(command.actor)) {
      return this.blockedOutcome(command, existingResults, "REVIEW_FIX_PLAN_INVALID_ACTOR");
    }

    const classification = this.reviewDecisionService.classify(input);
    const currentRequest = findCurrentReviewFixRequest(input, classification);
    if (!currentRequest) {
      return this.blockedOutcome(command, existingResults, "REVIEW_FIX_PLAN_REQUEST_MISSING");
    }

    if (currentRequest.reviewFixRequestId !== command.reviewFixRequestId) {
      return this.blockedOutcome(command, existingResults, "REVIEW_FIX_PLAN_TARGET_MISMATCH", currentRequest.reviewerRuntimeId);
    }

    const revalidated = this.reviewFixRequestService.requestFix(input, {
      projectId: command.projectId,
      reviewerRuntimeId: currentRequest.reviewerRuntimeId,
      actor: currentRequest.requestedBy,
      requestedAt: currentRequest.requestedAt,
    });
    if (revalidated.result.status !== "Requested" && revalidated.result.status !== "AlreadyRequested") {
      return this.blockedOutcome(
        command,
        existingResults,
        revalidated.result.status === "Blocked" ? "REVIEW_FIX_PLAN_REQUEST_STALE" : "REVIEW_FIX_PLAN_REQUEST_BLOCKED",
        currentRequest.reviewerRuntimeId,
      );
    }

    const reviewFixPlanId = createReviewFixPlanId(command.projectId, command.reviewFixRequestId);
    const currentSnapshot = createPlanSnapshot(currentRequest, command, reviewFixPlanId);
    const existingPlan = existingPlans?.plans.find((plan) => plan.reviewFixPlanId === reviewFixPlanId);
    if (existingPlan) {
      if (!planMatchesSnapshot(existingPlan, currentSnapshot)) {
        return this.blockedOutcome(
          command,
          existingResults,
          "REVIEW_FIX_PLAN_EXISTING_PLAN_MISMATCH",
          currentRequest.reviewerRuntimeId,
        );
      }

      const result = createResult(command, existingPlan, "AlreadyPlanned", ["REVIEW_FIX_PLAN_ALREADY_PLANNED"]);
      return {
        result,
        plan: copyReviewFixPlan(existingPlan),
        planCollection: this.upsertPlan(existingPlans, existingPlan),
        resultCollection: this.upsertResult(existingResults, result),
      };
    }

    const result = createResult(command, currentSnapshot, "Planned", ["REVIEW_FIX_PLAN_PLANNED"]);
    return {
      result,
      plan: copyReviewFixPlan(currentSnapshot),
      planCollection: this.upsertPlan(existingPlans, currentSnapshot),
      resultCollection: this.upsertResult(existingResults, result),
    };
  }

  upsertPlan(collection: ReviewFixPlanCollection | undefined, plan: ReviewFixPlan): ReviewFixPlanCollection {
    const existing = collection?.plans ?? [];
    const nextPlans = existing.some((item) => item.reviewFixPlanId === plan.reviewFixPlanId)
      ? existing.map((item) => (item.reviewFixPlanId === plan.reviewFixPlanId ? plan : item))
      : [...existing, plan];
    return createReviewFixPlanCollection({
      projectId: collection?.projectId ?? plan.projectId,
      plans: nextPlans,
      generatedAt: plan.plannedAt,
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });
  }

  upsertResult(collection: ReviewFixPlanInput["existingFixPlanResults"], result: ReviewFixPlanResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createReviewFixPlanResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });
  }

  private blockedOutcome(
    command: ReviewFixPlanCommand,
    existingResults: ReviewFixPlanInput["existingFixPlanResults"],
    reason: ReviewFixPlanReasonCode,
    reviewerRuntimeId?: string,
  ): ReviewFixPlanOutcome {
    const result = createResult(command, undefined, "Blocked", [reason], reviewerRuntimeId);
    return { result, resultCollection: this.upsertResult(existingResults, result) };
  }
}

export function findCurrentReviewFixPlan(
  input: ReviewFixPlanInput | undefined,
  currentRequest: ReviewFixRequest | undefined,
): ReviewFixPlan | undefined {
  if (!input || !currentRequest) return undefined;
  const planId = createReviewFixPlanId(input.projectId, currentRequest.reviewFixRequestId);
  const existingPlan = input.existingFixPlans?.plans.find((plan) => plan.reviewFixPlanId === planId);
  if (!existingPlan) return undefined;
  const snapshot = createPlanSnapshot(currentRequest, {
    projectId: input.projectId,
    reviewFixRequestId: currentRequest.reviewFixRequestId,
    actor: existingPlan.plannedBy,
    plannedAt: existingPlan.plannedAt,
  }, planId);
  return planMatchesSnapshot(existingPlan, snapshot) ? copyReviewFixPlan(existingPlan) : undefined;
}

export function findCurrentReviewFixPlanResult(
  projectId: string | undefined,
  currentRequest: ReviewFixRequest | undefined,
  resultCollection: ReviewFixPlanInput["existingFixPlanResults"],
): ReviewFixPlanResult | undefined {
  if (!projectId || !currentRequest) return undefined;
  const resultId = createReviewFixPlanResultId(projectId, currentRequest.reviewFixRequestId);
  const result = resultCollection?.results.find((item) => item.id === resultId);
  return result ? { ...result, reasonCodes: [...result.reasonCodes] } : undefined;
}

function createPlanSnapshot(
  request: ReviewFixRequest,
  command: ReviewFixPlanCommand,
  reviewFixPlanId: string,
): ReviewFixPlan {
  return {
    reviewFixPlanId,
    projectId: command.projectId,
    reviewFixRequestId: request.reviewFixRequestId,
    planId: request.planId,
    readinessId: request.readinessId,
    readinessResultId: request.readinessResultId,
    approvalId: request.approvalId,
    preflightId: request.preflightId,
    preflightResultId: request.preflightResultId,
    runtimeStartId: request.runtimeStartId,
    runtimeStartResultId: request.runtimeStartResultId,
    implementerRuntimeId: request.implementerRuntimeId,
    implementerRuntimeResultId: request.implementerRuntimeResultId,
    reviewerRuntimeId: request.reviewerRuntimeId,
    reviewerRuntimeResultId: request.reviewerRuntimeResultId,
    reviewTargetId: request.reviewTargetId,
    projectTaskId: request.projectTaskId,
    candidateTaskId: request.candidateTaskId,
    employeeId: request.employeeId,
    repositoryId: request.repositoryId,
    worktreePath: request.worktreePath,
    branch: request.branch,
    specificationPath: request.specificationPath,
    implementer: request.implementer,
    reviewer: request.reviewer,
    approvedImplementerAgent: request.approvedImplementerAgent,
    approvedReviewerAgent: request.approvedReviewerAgent,
    validationCommands: [...request.validationCommands],
    mutationScope: [...request.mutationScope],
    decision: request.decision,
    blockingFindingCount: request.blockingFindingCount,
    nonBlockingFindingCount: request.nonBlockingFindingCount,
    plannedBy: command.actor,
    plannedAt: command.plannedAt,
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
  };
}

function createResult(
  command: ReviewFixPlanCommand,
  plan: ReviewFixPlan | undefined,
  status: ReviewFixPlanResult["status"],
  reasonCodes: ReviewFixPlanReasonCode[],
  reviewerRuntimeId = plan?.reviewerRuntimeId,
): ReviewFixPlanResult {
  return {
    id: createReviewFixPlanResultId(command.projectId, command.reviewFixRequestId || "unknown-request"),
    projectId: command.projectId,
    reviewFixRequestId: command.reviewFixRequestId,
    reviewerRuntimeId,
    reviewFixPlanId: plan?.reviewFixPlanId,
    status,
    planned: Boolean(plan),
    alreadyPlanned: status === "AlreadyPlanned",
    reasonCodes,
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: command.plannedAt,
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
  };
}

function planMatchesSnapshot(existing: ReviewFixPlan, snapshot: ReviewFixPlan): boolean {
  return (
    existing.reviewFixPlanId === snapshot.reviewFixPlanId &&
    existing.projectId === snapshot.projectId &&
    existing.reviewFixRequestId === snapshot.reviewFixRequestId &&
    existing.planId === snapshot.planId &&
    existing.readinessId === snapshot.readinessId &&
    existing.readinessResultId === snapshot.readinessResultId &&
    existing.approvalId === snapshot.approvalId &&
    existing.preflightId === snapshot.preflightId &&
    existing.preflightResultId === snapshot.preflightResultId &&
    existing.runtimeStartId === snapshot.runtimeStartId &&
    existing.runtimeStartResultId === snapshot.runtimeStartResultId &&
    existing.implementerRuntimeId === snapshot.implementerRuntimeId &&
    existing.implementerRuntimeResultId === snapshot.implementerRuntimeResultId &&
    existing.reviewerRuntimeId === snapshot.reviewerRuntimeId &&
    existing.reviewerRuntimeResultId === snapshot.reviewerRuntimeResultId &&
    existing.reviewTargetId === snapshot.reviewTargetId &&
    existing.projectTaskId === snapshot.projectTaskId &&
    existing.candidateTaskId === snapshot.candidateTaskId &&
    existing.employeeId === snapshot.employeeId &&
    existing.repositoryId === snapshot.repositoryId &&
    existing.worktreePath === snapshot.worktreePath &&
    existing.branch === snapshot.branch &&
    existing.specificationPath === snapshot.specificationPath &&
    existing.implementer === snapshot.implementer &&
    existing.reviewer === snapshot.reviewer &&
    existing.approvedImplementerAgent === snapshot.approvedImplementerAgent &&
    existing.approvedReviewerAgent === snapshot.approvedReviewerAgent &&
    arraysEqual(existing.validationCommands, snapshot.validationCommands) &&
    arraysEqual(existing.mutationScope, snapshot.mutationScope) &&
    existing.decision === snapshot.decision &&
    existing.blockingFindingCount === snapshot.blockingFindingCount &&
    existing.nonBlockingFindingCount === snapshot.nonBlockingFindingCount &&
    existing.plannedBy === snapshot.plannedBy &&
    existing.fixExecutionStarted === false &&
    existing.validationRuntimeStarted === false &&
    existing.codexStarted === false &&
    existing.claudeStarted === false &&
    existing.subprocessStarted === false &&
    existing.validationStarted === false &&
    existing.repositoryMutationStarted === false &&
    existing.githubMutationStarted === false &&
    existing.rulesVersion === REVIEW_FIX_PLAN_RULES_VERSION
  );
}

function arraysEqual(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
