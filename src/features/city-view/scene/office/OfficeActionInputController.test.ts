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
});
