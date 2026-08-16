import { describe, expect, it } from "vitest";

import { OfficeActionInputController } from "./OfficeActionInputController";

describe("OfficeActionInputController", () => {
  it("keeps Request Review Fix pending when Promote is consumed first", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingPromoteReview: boolean;
      pendingRequestReviewFix: boolean;
      consumePromoteReviewPressed: () => boolean;
      consumeRequestReviewFixPressed: () => boolean;
    };
    input.pendingPromoteReview = false;
    input.pendingRequestReviewFix = true;

    expect(input.consumePromoteReviewPressed()).toBe(false);
    expect(input.consumeRequestReviewFixPressed()).toBe(true);
  });

  it("keeps Plan Review Fix pending separate from Request Review Fix", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingRequestReviewFix: boolean;
      pendingPlanReviewFix: boolean;
      consumeRequestReviewFixPressed: () => boolean;
      consumePlanReviewFixPressed: () => boolean;
    };
    input.pendingRequestReviewFix = true;
    input.pendingPlanReviewFix = true;

    expect(input.consumeRequestReviewFixPressed()).toBe(true);
    expect(input.consumeRequestReviewFixPressed()).toBe(false);
    expect(input.consumePlanReviewFixPressed()).toBe(true);
    expect(input.consumePlanReviewFixPressed()).toBe(false);
  });

  it("keeps Start Review Fix Runtime pending separate from Plan Review Fix", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingPlanReviewFix: boolean;
      pendingStartReviewFixRuntime: boolean;
      consumePlanReviewFixPressed: () => boolean;
      consumeStartReviewFixRuntimePressed: () => boolean;
    };
    input.pendingPlanReviewFix = true;
    input.pendingStartReviewFixRuntime = true;

    expect(input.consumePlanReviewFixPressed()).toBe(true);
    expect(input.consumePlanReviewFixPressed()).toBe(false);
    expect(input.consumeStartReviewFixRuntimePressed()).toBe(true);
    expect(input.consumeStartReviewFixRuntimePressed()).toBe(false);
  });

  it("keeps Validation Runtime pending separate from Review Fix Runtime", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingStartReviewFixRuntime: boolean;
      pendingStartValidationRuntime: boolean;
      consumeStartReviewFixRuntimePressed: () => boolean;
      consumeStartValidationRuntimePressed: () => boolean;
    };
    input.pendingStartReviewFixRuntime = true;
    input.pendingStartValidationRuntime = true;

    expect(input.consumeStartReviewFixRuntimePressed()).toBe(true);
    expect(input.consumeStartReviewFixRuntimePressed()).toBe(false);
    expect(input.consumeStartValidationRuntimePressed()).toBe(true);
    expect(input.consumeStartValidationRuntimePressed()).toBe(false);
  });

  it("keeps post-validation target and re-review inputs separate from validation", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingStartValidationRuntime: boolean;
      pendingPreparePostValidationReviewTarget: boolean;
      pendingStartPostValidationReview: boolean;
      consumeStartValidationRuntimePressed: () => boolean;
      consumePreparePostValidationReviewTargetPressed: () => boolean;
      consumeStartPostValidationReviewPressed: () => boolean;
    };
    input.pendingStartValidationRuntime = true;
    input.pendingPreparePostValidationReviewTarget = true;
    input.pendingStartPostValidationReview = true;

    expect(input.consumeStartValidationRuntimePressed()).toBe(true);
    expect(input.consumePreparePostValidationReviewTargetPressed()).toBe(true);
    expect(input.consumeStartPostValidationReviewPressed()).toBe(true);
    expect(input.consumeStartPostValidationReviewPressed()).toBe(false);
  });

  it("keeps candidate detail pending separate from Space action", () => {
    const input = new OfficeActionInputController() as unknown as {
      pendingAction: boolean;
      pendingOpenCandidateDetail: boolean;
      consumeActionPressed: () => boolean;
      consumeOpenCandidateDetailPressed: () => boolean;
    };
    input.pendingAction = true;
    input.pendingOpenCandidateDetail = true;

    expect(input.consumeActionPressed()).toBe(true);
    expect(input.consumeActionPressed()).toBe(false);
    expect(input.consumeOpenCandidateDetailPressed()).toBe(true);
    expect(input.consumeOpenCandidateDetailPressed()).toBe(false);
  });
});
