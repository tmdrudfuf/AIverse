import { describe, expect, it } from "vitest";

import { createPostValidationReviewTargetDisplayRows } from "./PostValidationReviewTargetView";

describe("PostValidationReviewTargetView", () => {
  it("reports unavailable, ready-to-prepare, target-ready, and blocked states without promotion claims", () => {
    expect(createPostValidationReviewTargetDisplayRows(undefined, undefined, undefined).statusText).toContain("Unavailable");

    const validation = { status: "Completed" } as Parameters<typeof createPostValidationReviewTargetDisplayRows>[0];
    const result = { status: "Completed" } as Parameters<typeof createPostValidationReviewTargetDisplayRows>[1];
    expect(createPostValidationReviewTargetDisplayRows(validation, result, undefined).statusText).toContain("prepare fresh review target");

    const target = {
      source: "PostValidation",
      reviewTargetSha: "1234567890abcdef",
    } as Parameters<typeof createPostValidationReviewTargetDisplayRows>[2];
    expect(createPostValidationReviewTargetDisplayRows(validation, result, target).statusText).toContain("no promotion");

    const blocked = {
      status: "Blocked",
      reasonCodes: ["POST_VALIDATION_REVIEW_TARGET_HEAD_CHANGED"],
    } as Parameters<typeof createPostValidationReviewTargetDisplayRows>[3];
    expect(createPostValidationReviewTargetDisplayRows(validation, result, undefined, blocked).statusText).toContain("reviewer not started");
  });
});
