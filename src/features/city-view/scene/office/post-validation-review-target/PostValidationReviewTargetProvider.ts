import type { ReviewTargetWorkingTreeState } from "../reviewer-runtime/ReviewTarget";

export const POST_VALIDATION_TARGET_GIT_INSPECT_ALLOW_ENV_VAR = "AIVERSE_ALLOW_POST_VALIDATION_TARGET_GIT_INSPECT";

export type PostValidationReviewTargetInspectionRequest = {
  repositoryId: string;
  worktreePath: string;
  branch: string;
  expectedHead: string;
};

export type PostValidationReviewTargetInspection = {
  providerId: string;
  workingTreeState: ReviewTargetWorkingTreeState;
  currentHead?: string;
  branch?: string;
  clean: boolean;
  exactHeadMatch: boolean;
  available: boolean;
};

export type PostValidationReviewTargetProvider = {
  readonly providerId: string;
  inspect(request: PostValidationReviewTargetInspectionRequest): PostValidationReviewTargetInspection;
};

export class UnavailablePostValidationReviewTargetProvider implements PostValidationReviewTargetProvider {
  readonly providerId = "unavailable-post-validation-target";

  inspect(request: PostValidationReviewTargetInspectionRequest): PostValidationReviewTargetInspection {
    return {
      providerId: this.providerId,
      workingTreeState: "Uncommitted",
      currentHead: undefined,
      branch: undefined,
      clean: false,
      exactHeadMatch: false,
      available: false,
    };
  }
}
