import type { ReviewTarget } from "../reviewer-runtime/ReviewTarget";
import type { ValidationRuntimeInput } from "../validation-runtime/ValidationRuntimeTypes";

export const POST_VALIDATION_REVIEW_TARGET_RULES_VERSION = "post-validation-review-target-v1";

export type PostValidationReviewTargetStatus = "Ready" | "AlreadyReady" | "Blocked" | "Failed";

export type PostValidationReviewTargetReasonCode =
  | "POST_VALIDATION_REVIEW_TARGET_READY"
  | "POST_VALIDATION_REVIEW_TARGET_ALREADY_READY"
  | "POST_VALIDATION_REVIEW_TARGET_MALFORMED"
  | "POST_VALIDATION_REVIEW_TARGET_INVALID_ACTOR"
  | "POST_VALIDATION_REVIEW_TARGET_VALIDATION_MISSING"
  | "POST_VALIDATION_REVIEW_TARGET_VALIDATION_NOT_COMPLETED"
  | "POST_VALIDATION_REVIEW_TARGET_VALIDATION_STALE"
  | "POST_VALIDATION_REVIEW_TARGET_CONTEXT_MISMATCH"
  | "POST_VALIDATION_REVIEW_TARGET_HEAD_CHANGED"
  | "POST_VALIDATION_REVIEW_TARGET_EXISTING_TARGET_MISMATCH"
  | "POST_VALIDATION_REVIEW_TARGET_INTERNAL_FAILURE";

export type PostValidationReviewTargetCommand = {
  projectId: string;
  validationRuntimeId: string;
  actor: string;
  requestedAt: string;
};

export type PostValidationReviewTargetResult = {
  id: string;
  projectId: string;
  validationRuntimeId?: string;
  reviewTargetId?: string;
  status: PostValidationReviewTargetStatus;
  reasonCodes: PostValidationReviewTargetReasonCode[];
  targetReady: boolean;
  alreadyReady: boolean;
  reviewerStarted: false;
  promotionStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  pushStarted: false;
  prStarted: false;
  readyForReviewStarted: false;
  mergeStarted: false;
  deployStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type PostValidationReviewTargetCollection = {
  projectId: string;
  targets: ReviewTarget[];
  targetCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type PostValidationReviewTargetResultCollection = {
  projectId: string;
  results: PostValidationReviewTargetResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type PostValidationReviewTargetInput = ValidationRuntimeInput & {
  existingPostValidationReviewTargets?: PostValidationReviewTargetCollection;
  existingPostValidationReviewTargetResults?: PostValidationReviewTargetResultCollection;
};

export type PostValidationReviewTargetOutcome = {
  result: PostValidationReviewTargetResult;
  reviewTarget?: ReviewTarget;
  targetCollection?: PostValidationReviewTargetCollection;
  resultCollection?: PostValidationReviewTargetResultCollection;
};

export function createPostValidationReviewTargetResultId(
  projectId: string,
  validationRuntimeId: string,
  rulesVersion = POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
) {
  return `${projectId}:post-validation-review-target-result:${validationRuntimeId}:${rulesVersion}`;
}

export function createPostValidationReviewTargetCollection(input: Omit<
  PostValidationReviewTargetCollection,
  "targets" | "targetCount"
> & { targets: ReadonlyArray<ReviewTarget> }): PostValidationReviewTargetCollection {
  const targets = input.targets.map((target) => ({
    ...target,
    changedFiles: [...target.changedFiles],
    validationCommands: target.validationCommands ? [...target.validationCommands] : undefined,
  }));
  return { ...input, targets, targetCount: targets.length };
}

export function createPostValidationReviewTargetResultCollection(input: Omit<
  PostValidationReviewTargetResultCollection,
  "results" | "resultCount"
> & { results: ReadonlyArray<PostValidationReviewTargetResult> }): PostValidationReviewTargetResultCollection {
  const results = input.results.map((result) => ({ ...result, reasonCodes: [...result.reasonCodes] }));
  return { ...input, results, resultCount: results.length };
}
