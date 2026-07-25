import { describe, expect, it } from "vitest";
import {
  analyzeStructuredReview,
  extractStructuredReviewPayload,
  parseStructuredReview,
  validateStructuredReviewObject,
} from "./structuredReview.js";

function reviewWith(payload: string, decision = "Changes Requested", extra = "") {
  return [
    `# Review Decision: ${decision}`,
    "",
    "## Blocking Findings",
    "",
    "- finding",
    "",
    extra,
    "## Structured Review",
    "",
    "```json",
    payload,
    "```",
  ].filter((line) => line !== undefined).join("\n");
}

const approvedPayload = JSON.stringify({
  schemaVersion: 1,
  decision: "approved",
  summary: "No blocking issues.",
  blockingFindings: [],
  nonBlockingFindings: [],
  questions: [],
}, null, 2);

const changesPayload = JSON.stringify({
  schemaVersion: 1,
  decision: "changes_requested",
  summary: "One blocking issue.",
  blockingFindings: [
    {
      id: "P1-001",
      severity: "P1",
      filePath: "tools/agent-workflow/example.js",
      location: "42-48",
      summary: "Unsafe command reaches process spawn.",
      reason: "The configured command is replaced before safety validation.",
      recommendation: "Validate the normalized configured command before creating the process invocation.",
    },
  ],
  nonBlockingFindings: [],
  questions: [],
}, null, 2);

describe("structured review extraction", () => {
  it("extracts the designated structured JSON block", () => {
    const result = extractStructuredReviewPayload(reviewWith(changesPayload));

    expect(result.status).toBe("valid");
    expect(result.blockCount).toBe(1);
    expect(result.payload).toContain('"schemaVersion": 1');
  });

  it("reports absent when no structured section exists", () => {
    const result = parseStructuredReview("# Review Decision: Approved\n\n```json\n{\"ignored\":true}\n```");

    expect(result.status).toBe("absent");
    expect(result.blockCount).toBe(0);
  });

  it("ignores arbitrary unrelated JSON outside the structured section", () => {
    const result = analyzeStructuredReview([
      "# Review Decision: Approved",
      "",
      "```json",
      "{\"decision\":\"changes_requested\"}",
      "```",
    ].join("\n"));

    expect(result.status).toBe("absent");
    expect(result.decision).toBe("Approved");
  });

  it("rejects malformed JSON", () => {
    const result = analyzeStructuredReview(reviewWith("{ nope", "Approved"));

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
    expect(result.diagnostics[0]).toContain("malformed");
  });

  it("rejects multiple structured blocks", () => {
    const markdown = [
      "# Review Decision: Approved",
      "",
      "## Structured Review",
      "",
      "```json",
      approvedPayload,
      "```",
      "",
      "```json",
      approvedPayload,
      "```",
    ].join("\n");

    const result = analyzeStructuredReview(markdown);

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
    expect(result.blockCount).toBe(2);
  });
});

describe("structured review validation", () => {
  it("validates an approved structured review", () => {
    const result = analyzeStructuredReview(reviewWith(approvedPayload, "Approved"));

    expect(result.status).toBe("valid");
    expect(result.decision).toBe("Approved");
    expect(result.review?.decision).toBe("approved");
  });

  it("validates changes requested with multiple blocking findings", () => {
    const payload = JSON.stringify({
      schemaVersion: 1,
      decision: "changes_requested",
      blockingFindings: [
        {
          id: "P1-001",
          severity: "P1",
          filePath: "a.js",
          location: "10",
          summary: "First issue.",
          recommendation: "Fix the first issue.",
        },
        {
          id: "P2-001",
          severity: "P2",
          reason: "Second reason.",
          summary: "Second issue.",
          recommendation: "Fix the second issue.",
        },
      ],
      nonBlockingFindings: [],
      questions: [],
    });

    const result = analyzeStructuredReview(reviewWith(payload));

    expect(result.status).toBe("valid");
    expect(result.decision).toBe("Changes Requested");
    expect(result.review?.blockingFindings).toHaveLength(2);
  });

  it("allows non-blocking findings and optional questions", () => {
    const result = validateStructuredReviewObject({
      schemaVersion: 1,
      decision: "approved",
      blockingFindings: [],
      nonBlockingFindings: [
        { id: "P3-001", severity: "P3", summary: "Consider docs." },
      ],
      questions: ["Should this be documented?", { id: "Q2", question: "Follow-up?" }],
    });

    expect(result.status).toBe("valid");
    expect(result.review?.nonBlockingFindings).toHaveLength(1);
    expect(result.review?.questions).toHaveLength(2);
  });

  it("rejects unsupported schema versions", () => {
    const result = analyzeStructuredReview(reviewWith(JSON.stringify({
      schemaVersion: 2,
      decision: "approved",
      blockingFindings: [],
    }), "Approved"));

    expect(result.status).toBe("unsupported");
    expect(result.decision).toBe("Unknown");
  });

  it("rejects invalid decisions", () => {
    const result = analyzeStructuredReview(reviewWith(JSON.stringify({
      schemaVersion: 1,
      decision: "maybe",
      blockingFindings: [],
    }), "Approved"));

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
  });

  it("rejects invalid severity", () => {
    const result = analyzeStructuredReview(reviewWith(JSON.stringify({
      schemaVersion: 1,
      decision: "changes_requested",
      blockingFindings: [
        { id: "S1", severity: "high", summary: "Bad severity.", recommendation: "Use P1." },
      ],
    })));

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("invalid severity");
  });

  it("rejects duplicate finding IDs", () => {
    const result = validateStructuredReviewObject({
      schemaVersion: 1,
      decision: "approved",
      blockingFindings: [
        { id: "DUP", severity: "P1", summary: "One.", recommendation: "Fix one." },
      ],
      nonBlockingFindings: [
        { id: "DUP", severity: "P3", summary: "Two." },
      ],
    });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics.join("\n")).toContain("Duplicate");
  });

  it("rejects blocking findings without actionable recommendation", () => {
    const result = analyzeStructuredReview(reviewWith(JSON.stringify({
      schemaVersion: 1,
      decision: "changes_requested",
      blockingFindings: [
        { id: "P1-001", severity: "P1", summary: "Something is wrong." },
      ],
    })));

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
    expect(result.diagnostics.join("\n")).toContain("missing recommendation");
  });
});

describe("decision reconciliation", () => {
  it("lets a valid structured decision drive when Markdown is unknown", () => {
    const result = analyzeStructuredReview([
      "# Review",
      "",
      "## Structured Review",
      "",
      "```json",
      approvedPayload,
      "```",
    ].join("\n"));

    expect(result.status).toBe("valid");
    expect(result.decision).toBe("Approved");
  });

  it("does not weaken structured changes requested with Markdown approval", () => {
    const result = analyzeStructuredReview(reviewWith(changesPayload, "Approved"));

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
    expect(result.decisionSource).toBe("conflict");
  });

  it("does not let structured approval erase Markdown changes requested", () => {
    const result = analyzeStructuredReview(reviewWith(approvedPayload, "Changes Requested"));

    expect(result.status).toBe("invalid");
    expect(result.decision).toBe("Unknown");
    expect(result.decisionSource).toBe("conflict");
  });

  it("preserves Markdown-only backward compatibility", () => {
    const result = analyzeStructuredReview("# Review Decision: Changes Requested\n\n## Blocking Findings\n- File: a.js\n  Recommendation: fix it");

    expect(result.status).toBe("absent");
    expect(result.decision).toBe("Changes Requested");
    expect(result.decisionSource).toBe("markdown");
  });
});
