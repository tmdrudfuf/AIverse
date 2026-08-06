import type { ReviewDecisionInput } from "../review-decision/ReviewDecisionTypes";

export const REVIEW_FIX_REQUEST_RULES_VERSION = "review-fix-request-v1";

export type ReviewFixRequestStatus = "Requested" | "AlreadyRequested" | "Blocked" | "Failed";

export type ReviewFixRequestReasonCode =
  | "REVIEW_FIX_REQUEST_REQUESTED"
  | "REVIEW_FIX_REQUEST_ALREADY_REQUESTED"
  | "REVIEW_FIX_REQUEST_REVIEWER_MISSING"
  | "REVIEW_FIX_REQUEST_REVIEWER_STALE"
  | "REVIEW_FIX_REQUEST_DECISION_APPROVED"
  | "REVIEW_FIX_REQUEST_DECISION_UNKNOWN"
  | "REVIEW_FIX_REQUEST_DECISION_NOT_CHANGES_REQUESTED"
  | "REVIEW_FIX_REQUEST_REVIEWER_BLOCKED"
  | "REVIEW_FIX_REQUEST_REVIEWER_TIMED_OUT"
  | "REVIEW_FIX_REQUEST_REVIEWER_FAILED"
  | "REVIEW_FIX_REQUEST_TARGET_MISMATCH"
  | "REVIEW_FIX_REQUEST_INVALID_ACTOR"
  | "REVIEW_FIX_REQUEST_EXISTING_REQUEST_MISMATCH"
  | "REVIEW_FIX_REQUEST_INTERNAL_FAILURE";

export type ReviewFixRequestCommand = {
  projectId: string;
  reviewerRuntimeId: string;
  actor: string;
  requestedAt: string;
};

export type ReviewFixRequest = {
  reviewFixRequestId: string;
  projectId: string;
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
  requestedBy: string;
  requestedAt: string;
  fixExecutionStarted: false;
  validationRuntimeStarted: false;
  codexStarted: false;
  claudeStarted: false;
  subprocessStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  rulesVersion: string;
};

export type ReviewFixRequestResult = {
  id: string;
  projectId: string;
  reviewerRuntimeId?: string;
  reviewFixRequestId?: string;
  status: ReviewFixRequestStatus;
  requested: boolean;
  alreadyRequested: boolean;
  reasonCodes: ReviewFixRequestReasonCode[];
  fixExecutionStarted: false;
  validationRuntimeStarted: false;
  codexStarted: false;
  claudeStarted: false;
  subprocessStarted: false;
  validationStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ReviewFixRequestCollection = {
  projectId: string;
  requests: ReviewFixRequest[];
  requestCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixRequestResultCollection = {
  projectId: string;
  results: ReviewFixRequestResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ReviewFixRequestInput = ReviewDecisionInput & {
  existingFixRequests?: ReviewFixRequestCollection;
  existingFixRequestResults?: ReviewFixRequestResultCollection;
};

export type ReviewFixRequestOutcome = {
  result: ReviewFixRequestResult;
  request?: ReviewFixRequest;
  requestCollection?: ReviewFixRequestCollection;
  resultCollection?: ReviewFixRequestResultCollection;
};

export function createReviewFixRequestId(
  projectId: string,
  reviewerRuntimeId: string,
  rulesVersion = REVIEW_FIX_REQUEST_RULES_VERSION,
) {
  return `${projectId}:review-fix-request:${reviewerRuntimeId}:${rulesVersion}`;
}

export function createReviewFixRequestResultId(
  projectId: string,
  reviewerRuntimeId: string,
  rulesVersion = REVIEW_FIX_REQUEST_RULES_VERSION,
) {
  return `${projectId}:review-fix-request-result:${reviewerRuntimeId}:${rulesVersion}`;
}

export function createReviewFixRequestCollection(input: Omit<
  ReviewFixRequestCollection,
  "requests" | "requestCount"
> & {
  requests: ReadonlyArray<ReviewFixRequest>;
}): ReviewFixRequestCollection {
  const requests = input.requests.map(copyReviewFixRequest);
  return { ...input, requests, requestCount: requests.length };
}

export function createReviewFixRequestResultCollection(input: Omit<
  ReviewFixRequestResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ReviewFixRequestResult>;
}): ReviewFixRequestResultCollection {
  const results = input.results.map(copyReviewFixRequestResult);
  return { ...input, results, resultCount: results.length };
}

export function copyReviewFixRequest(request: ReviewFixRequest): ReviewFixRequest {
  return {
    ...request,
    validationCommands: [...request.validationCommands],
    mutationScope: [...request.mutationScope],
  };
}

export function copyReviewFixRequestResult(result: ReviewFixRequestResult): ReviewFixRequestResult {
  return { ...result, reasonCodes: [...result.reasonCodes] };
}