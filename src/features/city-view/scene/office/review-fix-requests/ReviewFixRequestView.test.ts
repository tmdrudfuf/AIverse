import { describe, expect, it } from "vitest";

import type { ReviewDecisionClassification } from "../review-decision/ReviewDecisionTypes";
import { createReviewFixRequestDisplayRows } from "./ReviewFixRequestView";
import type { ReviewFixRequest, ReviewFixRequestResult } from "./ReviewFixRequestTypes";

describe("ReviewFixRequestView", () => {
  it("shows requestable ChangesRequested wording without execution claims", () => {
    const classification: ReviewDecisionClassification = {
      state: "ChangesRequested",
      reviewerRuntimeId: "reviewer-1",
      decision: "ChangesRequested",
    };

    const rows = createReviewFixRequestDisplayRows(classification, undefined);

    expect(rows.statusText).toContain("Request fixes (F)");
    expect(rows.statusText).toContain("no execution");
    expect(rows.statusText).not.toMatch(/Codex|Claude|Running|Executing|Validation Runtime/i);
  });

  it("shows recorded request wording and keeps execution absent", () => {
    const request = { requestedBy: "Local Human" } as ReviewFixRequest;
    const rows = createReviewFixRequestDisplayRows(undefined, request);

    expect(rows.statusText).toBe("Fix request recorded by Local Human; no execution");
  });

  it("shows blocked result wording safely", () => {
    const result = {
      status: "Blocked",
      reasonCodes: ["REVIEW_FIX_REQUEST_REVIEWER_STALE"],
    } as ReviewFixRequestResult;
    const rows = createReviewFixRequestDisplayRows({ state: "Stale", reviewerRuntimeId: "reviewer-1" }, undefined, result);

    expect(rows.statusText).toContain("Blocked");
    expect(rows.statusText).toContain("reviewer stale");
    expect(rows.statusText).toContain("no execution");
  });

  it("does not offer a fix request for Approved or Unknown decisions", () => {
    expect(createReviewFixRequestDisplayRows({ state: "Approved", reviewerRuntimeId: "reviewer-1" }, undefined).statusText)
      .toContain("no fix request needed");
    expect(createReviewFixRequestDisplayRows({ state: "ChangesRequested", reviewerRuntimeId: "reviewer-1", decision: "Unknown" }, undefined).statusText)
      .toContain("fix request unavailable");
  });
});