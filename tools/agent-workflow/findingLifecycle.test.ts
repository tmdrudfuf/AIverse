import { describe, expect, it } from "vitest";
import { normalizeFindingLifecycle } from "./findingLifecycle.js";

const normalizeLifecycle = normalizeFindingLifecycle as (...args: unknown[]) => any;

const blocker = {
  id: "F1",
  severity: "P1",
  filePath: "tools/example.js",
  location: "10",
  summary: "Guard misses committed changes.",
  reason: "A commit can bypass the edit signature.",
  recommendation: "Include committed diff state.",
};

function review(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    decision: "changes_requested",
    blockingFindings: [blocker],
    nonBlockingFindings: [],
    questions: [],
    ...overrides,
  };
}

function initialHistory() {
  return normalizeLifecycle(review(), [], {
    reviewSequence: 1,
    reviewPath: ".agent-workflow/runs/x/review.md",
    structuredReviewPath: ".agent-workflow/runs/x/structured.json",
  }).history || [];
}

function resolvedHistory() {
  return normalizeLifecycle(review({
    decision: "approved",
    blockingFindings: [],
    findingLifecycle: [
      { findingId: "F1", status: "resolved", explanation: "Committed diff is now included." },
    ],
  }), initialHistory(), { reviewSequence: 2 }).history || [];
}

function mixedHistory() {
  const f2 = {
    ...blocker,
    id: "F2",
    severity: "P2",
    summary: "Second issue.",
    recommendation: "Fix the second issue.",
  };
  return normalizeLifecycle(review({
    blockingFindings: [f2],
    findingLifecycle: [
      { findingId: "F1", status: "resolved", explanation: "Committed diff is now included." },
      { findingId: "F2", status: "new", explanation: "New issue found after the fix." },
    ],
  }), initialHistory(), { reviewSequence: 2 }).history || [];
}

describe("finding lifecycle normalization", () => {
  it("records initial findings as new", () => {
    const result = normalizeLifecycle(review(), [], { reviewSequence: 1 });

    expect(result.status).toBe("valid");
    expect(result.history).toHaveLength(1);
    expect(result.history?.[0].findingId).toBe("F1");
    expect(result.history?.[0].currentStatus).toBe("new");
    expect(result.activeBlockingFindings).toHaveLength(1);
    expect(result.lifecycle?.newFindings).toEqual(["F1"]);
  });

  it("resolves one previous finding", () => {
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Committed diff is now included." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("valid");
    expect(result.history?.[0].currentStatus).toBe("resolved");
    expect(result.activeBlockingFindings).toEqual([]);
    expect(result.lifecycle?.resolvedFindings).toEqual(["F1"]);
  });

  it("keeps one previous finding still open", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "The bypass remains." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("valid");
    expect(result.history?.[0].currentStatus).toBe("still_open");
    expect(result.activeBlockingFindings?.[0].id).toBe("F1");
    expect(result.lifecycle?.stillOpenFindings).toEqual(["F1"]);
  });

  it("resolves one finding and introduces a new blocker", () => {
    const f2 = {
      ...blocker,
      id: "F2",
      severity: "P2",
      summary: "New validation gap.",
      recommendation: "Add validation coverage.",
    };
    const result = normalizeLifecycle(review({
      blockingFindings: [f2],
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "The old bypass is fixed." },
        { findingId: "F2", status: "new", explanation: "This gap was introduced in the fix." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("valid");
    expect(result.lifecycle?.resolvedFindings).toEqual(["F1"]);
    expect(result.lifecycle?.newFindings).toEqual(["F2"]);
    expect(result.activeBlockingFindings?.map((finding: { id: string }) => finding.id)).toEqual(["F2"]);
  });

  it("rejects missing classification for a previous finding", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Missing lifecycle classification");
  });

  it("rejects duplicate lifecycle classifications", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "One." },
        { findingId: "F1", status: "still_open", explanation: "Two." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Duplicate lifecycle classification");
  });

  it("rejects unknown lifecycle finding IDs", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Fixed." },
        { findingId: "F9", status: "new", explanation: "Unknown." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("unknown findingId");
  });

  it("rejects previous findings marked new", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Still here." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("must not be classified as new");
  });

  it("rejects new current findings marked resolved", () => {
    const f2 = { ...blocker, id: "F2", summary: "New issue." };
    const result = normalizeLifecycle(review({
      blockingFindings: [f2],
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Fixed." },
        { findingId: "F2", status: "resolved", explanation: "Not active." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("must be classified as new");
  });

  it("rejects approved reviews with still-open blockers", () => {
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "Still open." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("approved review has still-open blocking findings");
  });

  it("rejects still-open findings omitted from current findings", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [],
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "Still open." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("omitted from current findings");
  });

  it("rejects resolved findings included as current blockers", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Fixed." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("still present as a current blocking finding");
  });

  it("rejects reused IDs with incompatible severity or content", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [{ ...blocker, severity: "P2", summary: "Unrelated issue." }],
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "Still open." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("changed severity");
    expect(result.diagnostics.join("\n")).toContain("changed summary");
  });

  it("preserves fully resolved history when lifecycle normalization runs again", () => {
    const history = resolvedHistory();
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      findingLifecycle: [],
    }), history, { reviewSequence: 3 });

    expect(result.status).toBe("valid");
    expect(result.history).toHaveLength(1);
    expect(result.history?.[0].findingId).toBe("F1");
    expect(result.history?.[0].currentStatus).toBe("resolved");
    expect(result.history?.[0].firstSeenReviewSequence).toBe(1);
    expect(result.history?.[0].resolvedReviewSequence).toBe(2);
    expect(result.activeBlockingFindings).toEqual([]);
  });

  it("allows a genuinely new finding after all prior findings are resolved", () => {
    const f2 = {
      ...blocker,
      id: "F2",
      severity: "P2",
      summary: "New issue after resolution.",
      recommendation: "Fix the new issue.",
    };
    const result = normalizeLifecycle(review({
      blockingFindings: [f2],
      findingLifecycle: [
        { findingId: "F2", status: "new", explanation: "This issue was found after previous findings resolved." },
      ],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("valid");
    expect(result.history).toHaveLength(2);
    expect(result.history?.[0].currentStatus).toBe("resolved");
    expect(result.history?.[0].firstSeenReviewSequence).toBe(1);
    expect(result.history?.[0].resolvedReviewSequence).toBe(2);
    expect(result.activeBlockingFindings?.map((finding: { id: string }) => finding.id)).toEqual(["F2"]);
  });

  it("rejects reuse of a previously resolved finding ID for an unrelated new issue", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [{
        ...blocker,
        summary: "Completely different issue.",
        recommendation: "Apply a different fix.",
      }],
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Treat as new." },
      ],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("cannot be reused");
    expect(result.diagnostics.join("\n")).toContain("changed summary");
    expect(result.diagnostics.join("\n")).toContain("changed recommendation");
  });

  it("rejects reuse of a previously resolved finding ID with incompatible severity", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [{ ...blocker, severity: "P2" }],
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Treat as new." },
      ],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("cannot be reused");
    expect(result.diagnostics.join("\n")).toContain("changed severity");
  });

  it("rejects reuse of a previously resolved finding ID with incompatible kind", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [],
      nonBlockingFindings: [{ ...blocker, recommendation: undefined }],
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Treat as new non-blocking." },
      ],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("cannot be reused");
    expect(result.diagnostics.join("\n")).toContain("changed kind");
  });

  it("rejects a previously resolved finding reappearing as new", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Reappeared." },
      ],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("cannot be reused");
    expect(result.diagnostics.join("\n")).toContain("must not receive a new lifecycle transition");
  });

  it("rejects a previously resolved finding reappearing as a blocker without a valid transition", () => {
    const result = normalizeLifecycle(review({
      findingLifecycle: [],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("cannot be reused");
  });

  it("rejects reuse of a resolved finding ID when other prior findings remain open", () => {
    const result = normalizeLifecycle(review({
      blockingFindings: [
        {
          ...blocker,
          id: "F1",
          summary: "Unrelated issue reusing a resolved ID.",
          recommendation: "Use a new finding ID for the new issue.",
        },
        {
          ...blocker,
          id: "F2",
          severity: "P2",
          summary: "Second issue.",
          recommendation: "Fix the second issue.",
        },
      ],
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Incorrectly presented as a new issue." },
        { findingId: "F2", status: "still_open", explanation: "The second issue remains." },
      ],
    }), mixedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Resolved finding F1 cannot be reused");
    expect(result.diagnostics.join("\n")).toContain("must not receive a new lifecycle transition");
    expect(result.diagnostics.join("\n")).toContain("changed summary");
  });
});

describe("critical-risk (high-risk-category) findings always block, regardless of the array a Reviewer put them in (Spec 056 Codex review round 4, P1-001)", () => {
  const highRiskNonBlocker = {
    id: "F9",
    severity: "P3",
    filePath: "tools/agent-workflow/orchestrateCommand.js",
    location: "1",
    summary: "Human-gate weakening: this could allow false readiness under a specific resume sequence.",
    reason: "Explains why the gate could be weakened.",
    recommendation: "Fix the gate.",
  };
  const normalP3 = {
    id: "F10",
    severity: "P3",
    filePath: "docs/notes.md",
    location: "1",
    summary: "Consider clarifying a comment.",
    reason: "Minor readability nit.",
    recommendation: "Clarify the wording.",
  };

  it("classifies a high-risk finding reported non-blocking as kind 'blocking' on the very first review", () => {
    const result = normalizeLifecycle(review({
      decision: "changes_requested",
      blockingFindings: [],
      nonBlockingFindings: [highRiskNonBlocker],
    }), [], { reviewSequence: 1 });

    expect(result.status).toBe("valid");
    expect(result.activeBlockingFindings.map((finding: any) => finding.id)).toContain("F9");
    expect(result.history.find((entry: any) => entry.findingId === "F9").kind).toBe("blocking");
  });

  it("rejects a first-round 'approved' review that hides a high-risk finding in nonBlockingFindings -- convergence cannot happen", () => {
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      nonBlockingFindings: [highRiskNonBlocker],
    }), [], { reviewSequence: 1 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("approved review has active blocking findings");
  });

  it("leaves a normal (non-high-risk) P3 finding non-blocking -- no broad promotion of unrelated findings", () => {
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      nonBlockingFindings: [normalP3],
    }), [], { reviewSequence: 1 });

    expect(result.status).toBe("valid");
    expect(result.activeBlockingFindings).toHaveLength(0);
    expect(result.history.find((entry: any) => entry.findingId === "F10").kind).toBe("non_blocking");
  });

  it("also rejects a hidden high-risk finding on the preserveResolvedHistoryLifecycle path (all prior findings already resolved)", () => {
    const result = normalizeLifecycle(review({
      decision: "approved",
      blockingFindings: [],
      nonBlockingFindings: [highRiskNonBlocker],
      findingLifecycle: [{ findingId: "F9", status: "new", explanation: "First reported here." }],
    }), resolvedHistory(), { reviewSequence: 3 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("approved review has active blocking findings");
  });
});
