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
});