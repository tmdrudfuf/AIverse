import { ReviewDecisionService } from "../review-decision/ReviewDecisionService";
import type { ReviewDecisionClassification } from "../review-decision/ReviewDecisionTypes";
import { getActorBlockReason } from "../review-decision/ReviewRuntimeChainIntegrityService";
import {
  REVIEW_FIX_REQUEST_RULES_VERSION,
  copyReviewFixRequest,
  createReviewFixRequestCollection,
  createReviewFixRequestId,
  createReviewFixRequestResultCollection,
  createReviewFixRequestResultId,
  type ReviewFixRequest,
  type ReviewFixRequestCollection,
  type ReviewFixRequestCommand,
  type ReviewFixRequestInput,
  type ReviewFixRequestOutcome,
  type ReviewFixRequestReasonCode,
  type ReviewFixRequestResult,
} from "./ReviewFixRequestTypes";

export class ReviewFixRequestService {
  private readonly reviewDecisionService = new ReviewDecisionService();

  requestFix(input: ReviewFixRequestInput, command: ReviewFixRequestCommand): ReviewFixRequestOutcome {
    const existingRequests = input.existingFixRequests;
    const existingResults = input.existingFixRequestResults;

    const classification = this.reviewDecisionService.classify(input);
    const blockedReason = getRequestBlockReason(classification, command);
    if (blockedReason) return this.blockedOutcome(command, existingResults, blockedReason);

    if (getActorBlockReason(command.actor)) {
      return this.blockedOutcome(command, existingResults, "REVIEW_FIX_REQUEST_INVALID_ACTOR");
    }

    const requestId = createReviewFixRequestId(command.projectId, command.reviewerRuntimeId);
    const currentSnapshot = createRequestSnapshot(input, command, requestId);
    if (!currentSnapshot) return this.blockedOutcome(command, existingResults, "REVIEW_FIX_REQUEST_INTERNAL_FAILURE");

    const existingRequest = existingRequests?.requests.find((request) => request.reviewFixRequestId === requestId);
    if (existingRequest) {
      if (!requestMatchesSnapshot(existingRequest, currentSnapshot)) {
        return this.blockedOutcome(command, existingResults, "REVIEW_FIX_REQUEST_EXISTING_REQUEST_MISMATCH");
      }

      const result = createResult(command, existingRequest, "AlreadyRequested", ["REVIEW_FIX_REQUEST_ALREADY_REQUESTED"]);
      return {
        result,
        request: copyReviewFixRequest(existingRequest),
        requestCollection: this.upsertRequest(existingRequests, existingRequest),
        resultCollection: this.upsertResult(existingResults, result),
      };
    }

    const result = createResult(command, currentSnapshot, "Requested", ["REVIEW_FIX_REQUEST_REQUESTED"]);
    return {
      result,
      request: copyReviewFixRequest(currentSnapshot),
      requestCollection: this.upsertRequest(existingRequests, currentSnapshot),
      resultCollection: this.upsertResult(existingResults, result),
    };
  }

  upsertRequest(collection: ReviewFixRequestCollection | undefined, request: ReviewFixRequest): ReviewFixRequestCollection {
    const existing = collection?.requests ?? [];
    const nextRequests = existing.some((item) => item.reviewFixRequestId === request.reviewFixRequestId)
      ? existing.map((item) => (item.reviewFixRequestId === request.reviewFixRequestId ? request : item))
      : [...existing, request];
    return createReviewFixRequestCollection({
      projectId: collection?.projectId ?? request.projectId,
      requests: nextRequests,
      generatedAt: request.requestedAt,
      rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    });
  }

  upsertResult(collection: ReviewFixRequestInput["existingFixRequestResults"], result: ReviewFixRequestResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createReviewFixRequestResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    });
  }

  private blockedOutcome(
    command: ReviewFixRequestCommand,
    existingResults: ReviewFixRequestInput["existingFixRequestResults"],
    reason: ReviewFixRequestReasonCode,
  ): ReviewFixRequestOutcome {
    const result = createResult(command, undefined, "Blocked", [reason]);
    return { result, resultCollection: this.upsertResult(existingResults, result) };
  }
}

export function findCurrentReviewFixRequest(
  input: ReviewFixRequestInput | undefined,
  classification?: ReviewDecisionClassification,
): ReviewFixRequest | undefined {
  if (!input || classification?.state !== "ChangesRequested" || classification.decision !== "ChangesRequested") {
    return undefined;
  }
  const reviewerRuntimeId = classification.reviewerRuntimeId;
  if (!reviewerRuntimeId) return undefined;
  const requestId = createReviewFixRequestId(input.projectId, reviewerRuntimeId);
  const existingRequest = input.existingFixRequests?.requests.find((request) => request.reviewFixRequestId === requestId);
  if (!existingRequest) return undefined;
  const snapshot = createRequestSnapshot(input, {
    projectId: input.projectId,
    reviewerRuntimeId,
    actor: existingRequest.requestedBy,
    requestedAt: existingRequest.requestedAt,
  }, requestId);
  return snapshot && requestMatchesSnapshot(existingRequest, snapshot) ? copyReviewFixRequest(existingRequest) : undefined;
}

export function findCurrentReviewFixRequestResult(
  projectId: string | undefined,
  classification: ReviewDecisionClassification | undefined,
  resultCollection: ReviewFixRequestInput["existingFixRequestResults"],
): ReviewFixRequestResult | undefined {
  if (!projectId || !classification?.reviewerRuntimeId) return undefined;
  const resultId = createReviewFixRequestResultId(projectId, classification.reviewerRuntimeId);
  const result = resultCollection?.results.find((item) => item.id === resultId);
  return result ? { ...result, reasonCodes: [...result.reasonCodes] } : undefined;
}
function getRequestBlockReason(
  classification: ReviewDecisionClassification,
  command: ReviewFixRequestCommand,
): ReviewFixRequestReasonCode | undefined {
  if (classification.reviewerRuntimeId !== command.reviewerRuntimeId) return "REVIEW_FIX_REQUEST_TARGET_MISMATCH";
  switch (classification.state) {
    case "Unavailable":
      return "REVIEW_FIX_REQUEST_REVIEWER_MISSING";
    case "Stale":
      return "REVIEW_FIX_REQUEST_REVIEWER_STALE";
    case "Approved":
      return "REVIEW_FIX_REQUEST_DECISION_APPROVED";
    case "ChangesRequested":
      return classification.decision === "ChangesRequested"
        ? undefined
        : classification.decision === "Unknown"
          ? "REVIEW_FIX_REQUEST_DECISION_UNKNOWN"
          : "REVIEW_FIX_REQUEST_DECISION_NOT_CHANGES_REQUESTED";
    case "Blocked":
      return "REVIEW_FIX_REQUEST_REVIEWER_BLOCKED";
    case "TimedOut":
      return "REVIEW_FIX_REQUEST_REVIEWER_TIMED_OUT";
    case "Failed":
      return "REVIEW_FIX_REQUEST_REVIEWER_FAILED";
    default:
      return "REVIEW_FIX_REQUEST_DECISION_NOT_CHANGES_REQUESTED";
  }
}

function createRequestSnapshot(
  input: ReviewFixRequestInput,
  command: ReviewFixRequestCommand,
  reviewFixRequestId: string,
): ReviewFixRequest | undefined {
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
  const reviewerRuntime = input.reviewerRuntime;
  const reviewerRuntimeResult = input.reviewerRuntimeResult;
  const reviewTarget = input.reviewTarget;
  if (
    !plan || !readiness || !readinessResult || !approval || !preflight || !preflightResult || !runtimeStart ||
    !runtimeStartResult || !implementerRuntime || !implementerRuntimeResult || !reviewerRuntime ||
    !reviewerRuntimeResult || !reviewTarget || reviewerRuntime.decision !== "ChangesRequested" ||
    reviewerRuntimeResult.decision !== "ChangesRequested"
  ) {
    return undefined;
  }

  return {
    reviewFixRequestId,
    projectId: command.projectId,
    planId: plan.planId,
    readinessId: readiness.readinessId,
    readinessResultId: readinessResult.id,
    approvalId: approval.approvalId,
    preflightId: preflight.preflightId,
    preflightResultId: preflightResult.id,
    runtimeStartId: runtimeStart.runtimeStartId,
    runtimeStartResultId: runtimeStartResult.id,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    implementerRuntimeResultId: implementerRuntimeResult.id,
    reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId,
    reviewerRuntimeResultId: reviewerRuntimeResult.id,
    reviewTargetId: reviewTarget.reviewTargetId,
    projectTaskId: plan.projectTaskId,
    candidateTaskId: plan.candidateTaskId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    approvedImplementerAgent: reviewerRuntime.approvedImplementerAgent,
    approvedReviewerAgent: reviewerRuntime.approvedReviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.allowedMutationScope],
    decision: "ChangesRequested",
    blockingFindingCount: reviewerRuntimeResult.blockingFindingCount,
    nonBlockingFindingCount: reviewerRuntimeResult.nonBlockingFindingCount,
    requestedBy: command.actor,
    requestedAt: command.requestedAt,
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
  };
}

function createResult(
  command: ReviewFixRequestCommand,
  request: ReviewFixRequest | undefined,
  status: ReviewFixRequestResult["status"],
  reasonCodes: ReviewFixRequestReasonCode[],
): ReviewFixRequestResult {
  return {
    id: createReviewFixRequestResultId(command.projectId, command.reviewerRuntimeId),
    projectId: command.projectId,
    reviewerRuntimeId: command.reviewerRuntimeId,
    reviewFixRequestId: request?.reviewFixRequestId,
    status,
    requested: Boolean(request),
    alreadyRequested: status === "AlreadyRequested",
    reasonCodes,
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: command.requestedAt,
    rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
  };
}

function requestMatchesSnapshot(existing: ReviewFixRequest, snapshot: ReviewFixRequest): boolean {
  return (
    existing.reviewFixRequestId === snapshot.reviewFixRequestId &&
    existing.projectId === snapshot.projectId &&
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
    existing.requestedBy === snapshot.requestedBy &&
    existing.fixExecutionStarted === false &&
    existing.validationRuntimeStarted === false &&
    existing.codexStarted === false &&
    existing.claudeStarted === false &&
    existing.subprocessStarted === false &&
    existing.validationStarted === false &&
    existing.repositoryMutationStarted === false &&
    existing.githubMutationStarted === false &&
    existing.rulesVersion === REVIEW_FIX_REQUEST_RULES_VERSION
  );
}

function arraysEqual(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}