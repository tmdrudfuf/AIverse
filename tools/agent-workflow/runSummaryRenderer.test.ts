import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildRunSummary } from "./runSummary.js";
import { renderRunSummaryMarkdown } from "./runSummaryRenderer.js";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "run-summary-renderer-test-"));
}

const runDirRelative = ".agent-workflow/runs/054-review-run-summary-audit-trail";

function approvedState(cwd: string) {
  const runDir = path.join(cwd, runDirRelative);
  fs.mkdirSync(runDir, { recursive: true });
  for (const name of ["implement-claude-execution.md", "implement-claude-result.md", "validate.md", "final.md", "review-result.md"]) {
    fs.writeFileSync(path.join(runDir, name), "fixture content", "utf8");
  }
  const p = (name: string) => `${runDirRelative}/${name}`;
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
    orchestrationRuns: [{ stage: "implement", status: "completed", path: p("implement-claude-execution.md"), resultPath: p("implement-claude-result.md") }],
    validationRuns: [
      { stage: "validate", command: "npm test", status: "passed", exitCode: 0, durationMs: 1000, path: p("validate.md") },
      { stage: "final-verification", command: "npm test", status: "passed", exitCode: 0, durationMs: 900, path: p("final.md"), target: { commit: "abc123", dirty: false, dirtyHash: null } },
    ],
    reviewRuns: [{ stage: "review", outcome: "Approved", reviewerId: "codex", structuredReviewStatus: "valid", structuredReviewDecision: "Approved", resultPath: p("review-result.md"), target: { commit: "abc123", dirty: false, dirtyHash: null } }],
    latestReviewDecision: "Approved",
  };
}

describe("renderRunSummaryMarkdown", () => {
  it("produces Markdown that ends with exactly one trailing newline", () => {
    const cwd = createTempDir();
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState(cwd), { cwd }));
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  });

  it("is deterministic for equivalent input", () => {
    const cwd = createTempDir();
    const summary = buildRunSummary(approvedState(cwd), { cwd });
    expect(renderRunSummaryMarkdown(summary)).toBe(renderRunSummaryMarkdown(summary));
  });

  it("semantically agrees with the JSON model on status/decision/readiness", () => {
    const cwd = createTempDir();
    const summary = buildRunSummary(approvedState(cwd), { cwd });
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
    const cwd = createTempDir();
    const cleanMarkdown = renderRunSummaryMarkdown(buildRunSummary(approvedState(cwd), { cwd }));
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
    const cwd = createTempDir();
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState(cwd), { cwd }));
    expect(markdown).toContain("No push, PR creation, PR approval, or merge was performed automatically.");
  });
});

describe("renderRunSummaryMarkdown: focused validation review loop (Spec 055)", () => {
  it("shows the strategy, focused attempts/result, and final full attempts/result as distinct lines", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, runDirRelative);
    fs.mkdirSync(runDir, { recursive: true });
    for (const name of ["validate.md", "revalidate.md", "final.md"]) {
      fs.writeFileSync(path.join(runDir, name), "fixture", "utf8");
    }
    const p = (name: string) => `${runDirRelative}/${name}`;
    const state = {
      featureId: "054-review-run-summary-audit-trail",
      baseBranch: "main",
      results: [],
      validationPolicy: { strategy: "focused-final-full" },
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "state-invalid", terminalState: "blocked" },
      validationRuns: [
        { stage: "validate", command: "node --test a.test.ts", status: "passed", phase: "focused", batchId: 1, path: p("validate.md") },
        { stage: "revalidate", command: "node --test a.test.ts", status: "passed", phase: "focused", batchId: 2, path: p("revalidate.md") },
        { stage: "final-verification", command: "npm test", status: "passed", phase: "full", batchId: 3, path: p("final.md") },
      ],
    };
    const markdown = renderRunSummaryMarkdown(buildRunSummary(state, { cwd }));
    expect(markdown).toContain("- Strategy: Focused, then final full");
    expect(markdown).toContain("- Focused validation attempts: 2");
    expect(markdown).toContain("- Focused result: Passed");
    expect(markdown).toContain("- Final full validation attempts: 1");
    expect(markdown).toContain("- Final full result: Passed");
  });

  it("never shows a bare 'Validation: Passed' outcome line unless the full phase specifically passed", () => {
    const cwd = createTempDir();
    const runDir = path.join(cwd, runDirRelative);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, "validate.md"), "fixture", "utf8");
    const p = (name: string) => `${runDirRelative}/${name}`;
    const state = {
      featureId: "054-review-run-summary-audit-trail",
      baseBranch: "main",
      results: [],
      validationPolicy: { strategy: "focused-final-full" },
      orchestration: { currentStage: "blocked", startedAt: "2026-07-26T00:00:00.000Z", reason: "state-invalid", terminalState: "blocked" },
      validationRuns: [
        { stage: "validate", command: "node --test a.test.ts", status: "passed", phase: "focused", batchId: 1, path: p("validate.md") },
      ],
    };
    const markdown = renderRunSummaryMarkdown(buildRunSummary(state, { cwd }));
    expect(markdown).not.toContain("- Validation: Passed");
    expect(markdown).toContain("- Focused result: Passed");
    expect(markdown).toContain("- Final full result: Not run");
  });

  it("labels full-every-cycle distinctly from focused-final-full", () => {
    const cwd = createTempDir();
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState(cwd), { cwd }));
    expect(markdown).toContain("- Strategy: Full validation every cycle");
  });

  it("shows the reviewed target and full validation target lines under commit provenance", () => {
    const cwd = createTempDir();
    const markdown = renderRunSummaryMarkdown(buildRunSummary(approvedState(cwd), { cwd }));
    expect(markdown).toContain("- Reviewed target:");
    expect(markdown).toContain("- Full validation target:");
  });
});

describe("renderRunSummaryMarkdown: performance and review convergence (Spec 056)", () => {
  it("renders the Review Convergence and Performance sections with matching numbers", () => {
    const cwd = createTempDir();
    const state = approvedState(cwd);
    (state.orchestration as Record<string, unknown>).reviewConvergenceMetrics = {
      firstReviewBlockingFindings: 4,
      newBlockingFindingsAfterFirstReview: 0,
      reopenedFindings: 0,
      resolvedFindingsVerified: 4,
    };
    (state.reviewRuns as Record<string, unknown>[])[0] = { ...state.reviewRuns[0], durationMs: 1320000 };
    (state.validationRuns as Record<string, unknown>[])[0] = { ...state.validationRuns[0], durationMs: 42000, phase: "focused" };
    (state.validationRuns as Record<string, unknown>[])[1] = { ...state.validationRuns[1], durationMs: 118000, phase: "full" };
    const markdown = renderRunSummaryMarkdown(buildRunSummary(state, { cwd }));
    expect(markdown).toContain("## Review Convergence");
    expect(markdown).toContain("- First-review blocking findings: 4");
    expect(markdown).toContain("- New blocking findings after first review: 0");
    expect(markdown).toContain("- Reopened findings: 0");
    expect(markdown).toContain("## Performance");
    expect(markdown).toContain("- Reviewer time: 22m 0s");
    expect(markdown).toContain("- Focused validation time: 42s");
    expect(markdown).toContain("- Final full validation time: 1m 58s");
  });

  it("reports not-started convergence status when no review has run yet", () => {
    const markdown = renderRunSummaryMarkdown(buildRunSummary({ featureId: "x", baseBranch: "main", results: [] }));
    expect(markdown).toContain("- Status: Not started");
  });

  it("reports not-started (not an active status) for a legacy pre-Spec-056 state with reviewRuns but no convergence evidence -- JSON/Markdown agree (regression for Codex Spec 056 review round 4, P2-002)", () => {
    const legacyState = {
      featureId: "010-legacy",
      baseBranch: "main",
      results: [],
      orchestration: { currentStage: "blocked", startedAt: "2026-01-01T00:00:00.000Z", reason: "Reviewer returned Approved", terminalState: "blocked" },
      reviewRuns: [{ outcome: "Approved", reviewerId: "codex" }],
    };
    const summary = buildRunSummary(legacyState);
    const markdown = renderRunSummaryMarkdown(summary);
    expect(summary.reviewConvergence.status).toBe("not-started");
    expect(markdown).toContain("- Status: Not started");
  });

  it("renders 'Budget exhausted' for the reviewer-question-cycle exhaustion path (regression for Codex Spec 056 review round 3, P2-001)", () => {
    const state = {
      featureId: "x",
      baseBranch: "main",
      results: [],
      orchestration: {
        currentStage: "blocked",
        startedAt: "2026-07-26T00:00:00.000Z",
        reason: "Reviewer question-cycle budget exhausted (maxReviewerQuestionCycles)",
        stopReason: "review-convergence-failed",
        terminalState: "blocked",
        activeBlockingFindings: [],
      },
      reviewRuns: [
        { stage: "review", outcome: "Questions", reviewerId: "codex", structuredReviewStatus: "valid", durationMs: 3000 },
      ],
    };
    const markdown = renderRunSummaryMarkdown(buildRunSummary(state));
    expect(markdown).toContain("- Status: Budget exhausted");
  });
});
