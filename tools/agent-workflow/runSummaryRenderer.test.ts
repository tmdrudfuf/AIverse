import { describe, expect, it } from "vitest";
import { buildRunSummary } from "./runSummary.js";
import { renderRunSummaryMarkdown } from "./runSummaryRenderer.js";

function approvedState() {
  return {
    featureId: "054-review-run-summary-audit-trail",
    baseBranch: "main",
    results: [],
    orchestration: {
      currentStage: "human-merge-decision",
      startedAt: "2026-07-26T00:00:00.000Z",
      updatedAt: "2026-07-26T00:05:00.000Z",
      resolvedImplementerId: "claude",
      resolvedReviewerId: "codex",
      roleResolutionSource: "cli-override",
      implementerIdentity: "Claude Code CLI",
      reviewerIdentity: "OpenAI Codex CLI",
    },
    orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement-claude-execution.md", resultPath: "implement-claude-result.md" }],
    validationRuns: [
      { stage: "validate", command: "npm test", status: "passed", exitCode: 0, durationMs: 1000, path: "validate.md" },
      { stage: "final-verification", command: "npm test", status: "passed", exitCode: 0, durationMs: 900, path: "final.md" },
    ],
    reviewRuns: [{ stage: "review", outcome: "Approved", reviewerId: "codex", structuredReviewStatus: "valid", structuredReviewDecision: "Approved", resultPath: "review-result.md" }],
    latestReviewDecision: "Approved",
  };
}

describe("renderRunSummaryMarkdown", () => {
  it("produces Markdown that ends with exactly one trailing newline", () => {
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState()));
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  });

  it("is deterministic for equivalent input", () => {
    const summary = buildRunSummary(approvedState());
    expect(renderRunSummaryMarkdown(summary)).toBe(renderRunSummaryMarkdown(summary));
  });

  it("semantically agrees with the JSON model on status/decision/readiness", () => {
    const summary = buildRunSummary(approvedState());
    const markdown = renderRunSummaryMarkdown(summary);
    expect(markdown).toContain("Awaiting human merge decision");
    expect(markdown).toContain("Final review: Approved");
    expect(markdown).toContain("Ready for human merge decision.");
    expect(markdown).toContain("Claude Code CLI");
    expect(markdown).toContain("OpenAI Codex CLI");
  });

  it("renders a placeholder rather than an empty table when no stages have run", () => {
    const markdown = renderRunSummaryMarkdown(buildRunSummary({ featureId: "x", baseBranch: "main", results: [] }));
    expect(markdown).toContain("_No stages have run yet._");
    expect(markdown).toContain("_No validation commands recorded._");
    expect(markdown).toContain("- None recorded.");
  });

  it("lists warnings when present, and 'None' when absent", () => {
    const cleanMarkdown = renderRunSummaryMarkdown(buildRunSummary(approvedState()));
    expect(cleanMarkdown).toMatch(/## Warnings\n\n- None/);

    const withWarningSummary = buildRunSummary({
      featureId: "x",
      baseBranch: "main",
      results: [],
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "Reviewer returned Execution Failed", terminalState: "blocked" },
      reviewRuns: [{ stage: "review", outcome: "Execution Failed", reviewerId: "codex", executionPath: "missing.md" }],
      latestReviewDecision: "Execution Failed",
    });
    const warningMarkdown = renderRunSummaryMarkdown(withWarningSummary);
    expect(warningMarkdown).toContain("missing-or-malformed-artifact");
  });

  it("never claims a remote mutation occurred", () => {
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState()));
    expect(markdown).toContain("No push, PR creation, PR approval, or merge was performed automatically.");
  });
});
