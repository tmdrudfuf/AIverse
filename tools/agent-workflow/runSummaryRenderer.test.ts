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
