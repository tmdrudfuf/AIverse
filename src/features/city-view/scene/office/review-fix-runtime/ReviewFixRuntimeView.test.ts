import { describe, expect, it } from "vitest";

import type { ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import { createReviewFixRuntimeDisplayRows } from "./ReviewFixRuntimeView";

describe("ReviewFixRuntimeView", () => {
  it("uses safe bounded dashboard wording for ready and terminal states", () => {
    const plan = { reviewFixPlanId: "plan-1" } as ReviewFixPlan;

    expect(createReviewFixRuntimeDisplayRows(plan, undefined).statusText).toContain("Start fix runtime (X)");
    expect(createReviewFixRuntimeDisplayRows(plan, undefined).statusText).toContain("validation not run");
    expect(createReviewFixRuntimeDisplayRows(undefined, undefined).statusText).toContain("needs Review Fix Plan");
    expect(createReviewFixRuntimeDisplayRows(plan, {
      status: "Completed",
    } as Parameters<typeof createReviewFixRuntimeDisplayRows>[1]).statusText).toBe(
      "Completed; validation not run; re-review not run",
    );
  });
});
