import { describe, expect, it } from "vitest";
import {
  DEFAULT_REVIEW_BUDGET,
  buildExhaustionReport,
  isBudgetExhausted,
  resolveReviewBudget,
} from "./reviewBudget.js";

describe("resolveReviewBudget", () => {
  it("resolves documented defaults when nothing is configured", () => {
    expect(resolveReviewBudget({})).toEqual(DEFAULT_REVIEW_BUDGET);
  });

  it("mirrors --max-fix-cycles into maxAutomaticFixCycles when reviewBudget does not override it", () => {
    const budget = resolveReviewBudget({ state: { maxFixCycles: 5 } });
    expect(budget.maxAutomaticFixCycles).toBe(5);
  });

  it("prefers an explicit state.reviewBudget.maxAutomaticFixCycles over --max-fix-cycles", () => {
    const budget = resolveReviewBudget({
      state: { maxFixCycles: 5, reviewBudget: { maxAutomaticFixCycles: 2 } },
    });
    expect(budget.maxAutomaticFixCycles).toBe(2);
  });

  it("prefers a CLI override over both state.reviewBudget and --max-fix-cycles", () => {
    const budget = resolveReviewBudget({
      cliOverrides: { maxAutomaticFixCycles: 9 },
      state: { maxFixCycles: 5, reviewBudget: { maxAutomaticFixCycles: 2 } },
    });
    expect(budget.maxAutomaticFixCycles).toBe(9);
  });

  it("resolves maxReviewAttempts from state.reviewBudget when no CLI override is given", () => {
    const budget = resolveReviewBudget({ state: { reviewBudget: { maxReviewAttempts: 7 } } });
    expect(budget.maxReviewAttempts).toBe(7);
  });

  it("resolves maxReviewAttempts from a CLI override over state", () => {
    const budget = resolveReviewBudget({
      cliOverrides: { maxReviewAttempts: 10 },
      state: { reviewBudget: { maxReviewAttempts: 7 } },
    });
    expect(budget.maxReviewAttempts).toBe(10);
  });

  it("resolves maxIncompleteReviewRetries and maxReviewerQuestionCycles independently", () => {
    const budget = resolveReviewBudget({
      state: { reviewBudget: { maxIncompleteReviewRetries: 3, maxReviewerQuestionCycles: 2 } },
    });
    expect(budget.maxIncompleteReviewRetries).toBe(3);
    expect(budget.maxReviewerQuestionCycles).toBe(2);
  });

  it("falls back to defaults for invalid/negative values", () => {
    const budget = resolveReviewBudget({ state: { reviewBudget: { maxReviewAttempts: -5 } } });
    expect(budget.maxReviewAttempts).toBe(DEFAULT_REVIEW_BUDGET.maxReviewAttempts);
  });
});

describe("isBudgetExhausted", () => {
  it("is not exhausted when usage is below every ceiling", () => {
    expect(isBudgetExhausted({ reviewAttempts: 1 }, DEFAULT_REVIEW_BUDGET).exhausted).toBe(false);
  });

  it("is exhausted when review attempts reach maxReviewAttempts", () => {
    const result = isBudgetExhausted({ reviewAttempts: 3 }, DEFAULT_REVIEW_BUDGET);
    expect(result.exhausted).toBe(true);
    expect(result.ceiling).toBe("maxReviewAttempts");
  });

  it("is exhausted when automatic fix cycles reach maxAutomaticFixCycles", () => {
    const result = isBudgetExhausted({ automaticFixCycles: 2 }, DEFAULT_REVIEW_BUDGET);
    expect(result.exhausted).toBe(true);
    expect(result.ceiling).toBe("maxAutomaticFixCycles");
  });

  it("is exhausted when incomplete-review retries reach the ceiling", () => {
    const result = isBudgetExhausted({ incompleteReviewRetries: 1 }, DEFAULT_REVIEW_BUDGET);
    expect(result.exhausted).toBe(true);
    expect(result.ceiling).toBe("maxIncompleteReviewRetries");
  });

  it("is exhausted when reviewer-question cycles reach the ceiling", () => {
    const result = isBudgetExhausted({ reviewerQuestionCycles: 1 }, DEFAULT_REVIEW_BUDGET);
    expect(result.exhausted).toBe(true);
    expect(result.ceiling).toBe("maxReviewerQuestionCycles");
  });

  it("never reports exhaustion below every ceiling even with all usage fields present", () => {
    const result = isBudgetExhausted(
      { reviewAttempts: 2, automaticFixCycles: 1, incompleteReviewRetries: 0, reviewerQuestionCycles: 0 },
      DEFAULT_REVIEW_BUDGET,
    );
    expect(result.exhausted).toBe(false);
  });
});

describe("buildExhaustionReport", () => {
  it("reports a stable stop reason and never marks readiness", () => {
    const report = buildExhaustionReport({ reviewAttempts: 3 }, DEFAULT_REVIEW_BUDGET, {
      openBlockingFindingsCount: 2,
      newFindingsLatestRound: 1,
      reopenedFindingsCount: 0,
    });
    expect(report.stopReason).toBe("review-convergence-failed");
    expect(report).not.toHaveProperty("ready");
    expect(report.openBlockingFindings).toBe(2);
    expect(report.attemptCount).toBe(3);
    expect(report.configuredLimit).toBe(DEFAULT_REVIEW_BUDGET.maxReviewAttempts);
  });

  it("preserves open/new/reopened finding counts rather than discarding them", () => {
    const report = buildExhaustionReport({ reviewAttempts: 3 }, DEFAULT_REVIEW_BUDGET, {
      openBlockingFindingsCount: 5,
      newFindingsLatestRound: 2,
      reopenedFindingsCount: 1,
    });
    expect(report.openBlockingFindings).toBe(5);
    expect(report.newFindingsLatestRound).toBe(2);
    expect(report.reopenedFindings).toBe(1);
  });

  it("recommends inspecting the loop when there are no open or new findings to point at", () => {
    const report = buildExhaustionReport({ reviewAttempts: 3 }, DEFAULT_REVIEW_BUDGET, {});
    expect(report.recommendedHumanAction).toMatch(/flapping|converged/i);
  });
});
