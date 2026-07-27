import { describe, expect, it } from "vitest";
import {
  buildFindingLedger,
  classifyFindingsForAttempt,
  computeConvergenceStatus,
  isEffectivelyBlocking,
  isHighRiskCategory,
  updateConvergenceMetrics,
} from "./reviewConvergence.js";

function historyEntry(overrides = {}) {
  return {
    findingId: "P1-001",
    kind: "blocking",
    severity: "P1",
    summary: "Stale value",
    recommendation: "Update it",
    firstSeenReviewSequence: 1,
    lastSeenReviewSequence: 1,
    currentStatus: "new",
    finding: { id: "P1-001", filePath: "a.js", location: "10", summary: "Stale value" },
    ...overrides,
  };
}

describe("classifyFindingsForAttempt", () => {
  it("classifies a finding never seen before as new", () => {
    const result = classifyFindingsForAttempt([{ id: "P1-001", severity: "P1", summary: "x" }], []);
    expect(result[0].classification).toBe("new");
  });

  it("classifies a still-open carryover finding as previously-known", () => {
    const history = [historyEntry({ currentStatus: "still_open" })];
    const result = classifyFindingsForAttempt([{ id: "P1-001", severity: "P1", summary: "Stale value" }], history);
    expect(result[0].classification).toBe("previously-known");
  });

  it("classifies a fresh-ID finding matching a resolved entry's file/location as reopened", () => {
    const history = [historyEntry({ currentStatus: "resolved", findingId: "P1-001" })];
    const result = classifyFindingsForAttempt(
      [{ id: "P2-005", severity: "P1", filePath: "a.js", location: "10", summary: "different text" }],
      history,
    );
    expect(result[0].classification).toBe("reopened");
    expect(result[0].reopenedFromFindingId).toBe("P1-001");
  });

  it("classifies a fresh-ID finding matching a resolved entry's summary as reopened", () => {
    const history = [historyEntry({ currentStatus: "resolved", findingId: "P1-001", summary: "Stale value" })];
    const result = classifyFindingsForAttempt(
      [{ id: "P2-006", severity: "P1", summary: "Stale value" }],
      history,
    );
    expect(result[0].classification).toBe("reopened");
  });

  it("does not classify an unrelated new finding as reopened just because unrelated history is resolved", () => {
    const history = [historyEntry({ currentStatus: "resolved" })];
    const result = classifyFindingsForAttempt(
      [{ id: "P3-099", severity: "P2", filePath: "different.js", location: "999", summary: "totally unrelated" }],
      history,
    );
    expect(result[0].classification).toBe("new");
  });
});

describe("isEffectivelyBlocking / isHighRiskCategory", () => {
  it("treats P0/P1/P2 as blocking by default", () => {
    expect(isEffectivelyBlocking({ severity: "P0" })).toBe(true);
    expect(isEffectivelyBlocking({ severity: "P1" })).toBe(true);
    expect(isEffectivelyBlocking({ severity: "P2" })).toBe(true);
  });

  it("treats P3 as non-blocking by default", () => {
    expect(isEffectivelyBlocking({ severity: "P3", summary: "docs typo" })).toBe(false);
  });

  it("treats a high-risk-category P3 as blocking regardless of severity", () => {
    const finding = { severity: "P3", summary: "This weakens the human-gate enforcement path." };
    expect(isHighRiskCategory(finding)).toBe(true);
    expect(isEffectivelyBlocking(finding)).toBe(true);
  });

  it("recognizes remote mutation, unsafe command, and data loss as high-risk categories", () => {
    expect(isHighRiskCategory({ summary: "Introduces a new remote mutation path." })).toBe(true);
    expect(isHighRiskCategory({ summary: "An unsafe command could reach spawn." })).toBe(true);
    expect(isHighRiskCategory({ summary: "Could cause data loss on resume." })).toBe(true);
  });
});

describe("updateConvergenceMetrics", () => {
  it("records the first review's blocking finding count", () => {
    const classified = [
      { classification: "new", finding: { severity: "P1" } },
      { classification: "new", finding: { severity: "P1" } },
      { classification: "new", finding: { severity: "P1" } },
    ];
    const metrics = updateConvergenceMetrics(undefined, { attemptNumber: 1, classifiedFindings: classified });
    expect(metrics.firstReviewBlockingFindings).toBe(3);
    expect(metrics.newBlockingFindingsAfterFirstReview).toBe(0);
  });

  it("does not count later known findings as new", () => {
    const firstMetrics = updateConvergenceMetrics(undefined, {
      attemptNumber: 1,
      classifiedFindings: [{ classification: "new", finding: { severity: "P1" } }],
    });
    const secondMetrics = updateConvergenceMetrics(firstMetrics, {
      attemptNumber: 2,
      classifiedFindings: [{ classification: "previously-known", finding: { severity: "P1" } }],
    });
    expect(secondMetrics.newBlockingFindingsAfterFirstReview).toBe(0);
  });

  it("counts a genuinely new finding discovered in a later review", () => {
    const firstMetrics = updateConvergenceMetrics(undefined, {
      attemptNumber: 1,
      classifiedFindings: [{ classification: "new", finding: { severity: "P1" } }],
    });
    const secondMetrics = updateConvergenceMetrics(firstMetrics, {
      attemptNumber: 2,
      classifiedFindings: [{ classification: "new", finding: { severity: "P1" } }],
    });
    expect(secondMetrics.newBlockingFindingsAfterFirstReview).toBe(1);
  });

  it("increments reopened count and includes it in new-after-first", () => {
    const firstMetrics = updateConvergenceMetrics(undefined, {
      attemptNumber: 1,
      classifiedFindings: [],
    });
    const secondMetrics = updateConvergenceMetrics(firstMetrics, {
      attemptNumber: 2,
      classifiedFindings: [{ classification: "reopened", finding: { severity: "P1" } }],
    });
    expect(secondMetrics.reopenedFindings).toBe(1);
    expect(secondMetrics.newBlockingFindingsAfterFirstReview).toBe(1);
  });

  it("does not count a P3 non-blocking finding toward new-after-first", () => {
    const firstMetrics = updateConvergenceMetrics(undefined, { attemptNumber: 1, classifiedFindings: [] });
    const secondMetrics = updateConvergenceMetrics(firstMetrics, {
      attemptNumber: 2,
      classifiedFindings: [{ classification: "new", finding: { severity: "P3", summary: "note" } }],
    });
    expect(secondMetrics.newBlockingFindingsAfterFirstReview).toBe(0);
  });

  it("accumulates resolvedFindingsVerified across attempts", () => {
    const firstMetrics = updateConvergenceMetrics(undefined, { attemptNumber: 1, classifiedFindings: [], resolvedCountThisAttempt: 2 });
    const secondMetrics = updateConvergenceMetrics(firstMetrics, { attemptNumber: 2, classifiedFindings: [], resolvedCountThisAttempt: 1 });
    expect(secondMetrics.resolvedFindingsVerified).toBe(3);
  });
});

describe("buildFindingLedger", () => {
  it("merges findingHistory with reopened counts", () => {
    const history = [historyEntry()];
    const ledger = buildFindingLedger(history, { "P1-001": 2 });
    expect(ledger[0]).toMatchObject({ id: "P1-001", severity: "P1", blocking: true, reopenedCount: 2 });
  });

  it("defaults reopenedCount to zero when not tracked", () => {
    const ledger = buildFindingLedger([historyEntry()], {});
    expect(ledger[0].reopenedCount).toBe(0);
  });

  it("survives an empty history", () => {
    expect(buildFindingLedger([], {})).toEqual([]);
  });
});

describe("computeConvergenceStatus", () => {
  it("is not-started when no review attempt has occurred", () => {
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: false })).toBe("not-started");
  });

  it("is budget-exhausted when the budget is exhausted regardless of other signals", () => {
    expect(computeConvergenceStatus({
      hasAnyReviewAttempt: true,
      budgetExhausted: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
    })).toBe("budget-exhausted");
  });

  it("is incomplete-review when the latest review is incomplete", () => {
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: true, latestCompletenessStatus: "incomplete" })).toBe("incomplete-review");
  });

  it("is blocked when the latest review is invalid", () => {
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: true, latestCompletenessStatus: "invalid" })).toBe("blocked");
  });

  it("is converged only with a complete Approved review, zero open blockers, and an exact target match", () => {
    expect(computeConvergenceStatus({
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
      exactTargetMatch: true,
    })).toBe("converged");
  });

  it("is not converged when a complete Approved review still has an open blocker", () => {
    expect(computeConvergenceStatus({
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 1,
    })).toBe("in-progress");
  });

  it("is not converged when coverage is complete and Approved but the exact target does not match", () => {
    expect(computeConvergenceStatus({
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
      exactTargetMatch: false,
    })).toBe("in-progress");
  });

  it("is in-progress for a Changes Requested review that is otherwise complete", () => {
    expect(computeConvergenceStatus({
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Changes Requested",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 2,
    })).toBe("in-progress");
  });
});
