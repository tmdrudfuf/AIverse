import { describe, expect, it } from "vitest";
import {
  buildPerformanceSummary,
  measurePromptSize,
  summarizeReviewDurationMs,
  summarizeValidationPhaseDurations,
} from "./performanceMetrics.js";

describe("measurePromptSize", () => {
  it("is deterministic for the same prompt text", () => {
    const a = measurePromptSize("hello world");
    const b = measurePromptSize("hello world");
    expect(a).toEqual(b);
  });

  it("reports character count for ASCII text", () => {
    expect(measurePromptSize("hello").characters).toBe(5);
  });

  it("reports byte count distinct from character count for multi-byte text", () => {
    const result = measurePromptSize("café");
    expect(result.characters).toBe(4);
    expect(result.bytes).toBeGreaterThan(result.characters);
  });

  it("handles an empty/undefined prompt safely", () => {
    expect(measurePromptSize(undefined)).toEqual({ characters: 0, bytes: 0 });
  });
});

describe("summarizeValidationPhaseDurations", () => {
  it("buckets focused and full phase records separately", () => {
    const result = summarizeValidationPhaseDurations([
      { phase: "focused", durationMs: 100 },
      { phase: "focused", durationMs: 50 },
      { phase: "full", durationMs: 900 },
    ]);
    expect(result).toEqual({ focusedValidationDurationMs: 150, fullValidationDurationMs: 900 });
  });

  it("treats a legacy record with no phase field as full (Spec 055 precedent)", () => {
    const result = summarizeValidationPhaseDurations([{ durationMs: 300 }]);
    expect(result.fullValidationDurationMs).toBe(300);
    expect(result.focusedValidationDurationMs).toBe(0);
  });

  it("returns zero totals for an empty list", () => {
    expect(summarizeValidationPhaseDurations([])).toEqual({ focusedValidationDurationMs: 0, fullValidationDurationMs: 0 });
  });
});

describe("summarizeReviewDurationMs", () => {
  it("sums durationMs across every review run", () => {
    expect(summarizeReviewDurationMs([{ durationMs: 100 }, { durationMs: 200 }])).toBe(300);
  });

  it("treats a missing durationMs as zero", () => {
    expect(summarizeReviewDurationMs([{}, { durationMs: 50 }])).toBe(50);
  });
});

describe("buildPerformanceSummary", () => {
  it("combines review and validation duration totals with an explicit review-attempt count", () => {
    const summary = buildPerformanceSummary({
      reviewRuns: [{ durationMs: 1000 }, { durationMs: 2000 }],
      validationRuns: [{ phase: "focused", durationMs: 100 }, { phase: "full", durationMs: 5000 }],
      reviewAttempts: 2,
    });
    expect(summary).toEqual({
      reviewDurationMs: 3000,
      focusedValidationDurationMs: 100,
      fullValidationDurationMs: 5000,
      reviewAttempts: 2,
    });
  });

  it("falls back to reviewRuns.length when reviewAttempts is not supplied", () => {
    const summary = buildPerformanceSummary({ reviewRuns: [{ durationMs: 1 }, { durationMs: 2 }] });
    expect(summary.reviewAttempts).toBe(2);
  });
});
