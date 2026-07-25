import { describe, expect, it } from "vitest";
import { normalizeFindingLifecycle } from "./findingLifecycle.js";

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
  return normalizeFindingLifecycle(review(), [], {
    reviewSequence: 1,
    reviewPath: ".agent-workflow/runs/x/review.md",
    structuredReviewPath: ".agent-workflow/runs/x/structured.json",
  }).history || [];
}

describe("finding lifecycle normalization", () => {
  it("records initial findings as new", () => {
    const result = normalizeFindingLifecycle(review(), [], { reviewSequence: 1 });

    expect(result.status).toBe("valid");
    expect(result.history).toHaveLength(1);
    expect(result.history?.[0].findingId).toBe("F1");
    expect(result.history?.[0].currentStatus).toBe("new");
    expect(result.activeBlockingFindings).toHaveLength(1);
    expect(result.lifecycle?.newFindings).toEqual(["F1"]);
  });

  it("resolves one previous finding", () => {
    const result = normalizeFindingLifecycle(review({
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
    const result = normalizeFindingLifecycle(review({
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
    const result = normalizeFindingLifecycle(review({
      blockingFindings: [f2],
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "The old bypass is fixed." },
        { findingId: "F2", status: "new", explanation: "This gap was introduced in the fix." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("valid");
    expect(result.lifecycle?.resolvedFindings).toEqual(["F1"]);
    expect(result.lifecycle?.newFindings).toEqual(["F2"]);
    expect(result.activeBlockingFindings?.map((finding) => finding.id)).toEqual(["F2"]);
  });

  it("rejects missing classification for a previous finding", () => {
    const result = normalizeFindingLifecycle(review({
      findingLifecycle: [],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Missing lifecycle classification");
  });

  it("rejects duplicate lifecycle classifications", () => {
    const result = normalizeFindingLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "One." },
        { findingId: "F1", status: "still_open", explanation: "Two." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Duplicate lifecycle classification");
  });

  it("rejects unknown lifecycle finding IDs", () => {
    const result = normalizeFindingLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Fixed." },
        { findingId: "F9", status: "new", explanation: "Unknown." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("unknown findingId");
  });

  it("rejects previous findings marked new", () => {
    const result = normalizeFindingLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "new", explanation: "Still here." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("must not be classified as new");
  });

  it("rejects new current findings marked resolved", () => {
    const f2 = { ...blocker, id: "F2", summary: "New issue." };
    const result = normalizeFindingLifecycle(review({
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
    const result = normalizeFindingLifecycle(review({
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
    const result = normalizeFindingLifecycle(review({
      blockingFindings: [],
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "Still open." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("omitted from current findings");
  });

  it("rejects resolved findings included as current blockers", () => {
    const result = normalizeFindingLifecycle(review({
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "Fixed." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("still present as a current blocking finding");
  });

  it("rejects reused IDs with incompatible severity or content", () => {
    const result = normalizeFindingLifecycle(review({
      blockingFindings: [{ ...blocker, severity: "P2", summary: "Unrelated issue." }],
      findingLifecycle: [
        { findingId: "F1", status: "still_open", explanation: "Still open." },
      ],
    }), initialHistory(), { reviewSequence: 2 });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("changed severity");
    expect(result.diagnostics.join("\n")).toContain("changed summary");
  });
});
