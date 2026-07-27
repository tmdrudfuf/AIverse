import { describe, expect, it } from "vitest";
import {
  buildChangedFileInventory,
  classifyHighRisk,
  computeReviewCompleteness,
  summarizeInventory,
  validateReviewCoverage,
} from "./reviewCoverage.js";

const SAMPLE_STAT = [
  " tools/agent-workflow/orchestrateCommand.js | 55 +++++++++++++++++++++-----",
  " tools/agent-workflow/README.md              | 4 ++--",
  " 2 files changed, 50 insertions(+), 9 deletions(-)",
].join("\n");

describe("buildChangedFileInventory", () => {
  it("includes every changed file from the diff --stat sections", () => {
    const inventory = buildChangedFileInventory({
      committedDiffStat: SAMPLE_STAT,
      statusPorcelain: "M  tools/agent-workflow/orchestrateCommand.js\nM  tools/agent-workflow/README.md",
    });
    expect(inventory.map((entry) => entry.path).sort()).toEqual([
      "tools/agent-workflow/README.md",
      "tools/agent-workflow/orchestrateCommand.js",
    ].sort());
  });

  it("reports file status from git status --porcelain", () => {
    const inventory = buildChangedFileInventory({
      committedDiffStat: " new-file.js | 3 +++\n 1 file changed, 3 insertions(+)",
      statusPorcelain: "A  new-file.js",
    });
    expect(inventory[0]).toMatchObject({ path: "new-file.js", status: "added" });
  });

  it("reports approximate additions/deletions from the diff --stat bar", () => {
    const inventory = buildChangedFileInventory({ committedDiffStat: SAMPLE_STAT });
    const orchestrateEntry = inventory.find((entry) => entry.path.endsWith("orchestrateCommand.js"));
    expect(orchestrateEntry?.additions).toBeGreaterThan(0);
    expect(orchestrateEntry?.deletions).toBeGreaterThan(0);
  });

  it("includes untracked files known only from status --porcelain", () => {
    const inventory = buildChangedFileInventory({ statusPorcelain: "?? tools/agent-workflow/newModule.js" });
    expect(inventory).toEqual([
      expect.objectContaining({ path: "tools/agent-workflow/newModule.js", status: "added" }),
    ]);
  });

  it("resolves a rename to its resulting path", () => {
    const inventory = buildChangedFileInventory({
      committedDiffStat: " tools/agent-workflow/{old.js => new.js} | 0\n 1 file changed",
      statusPorcelain: "R  tools/agent-workflow/old.js -> tools/agent-workflow/new.js",
    });
    expect(inventory.map((entry) => entry.path)).toContain("tools/agent-workflow/new.js");
  });

  it("deduplicates a file appearing in multiple diff --stat sections", () => {
    const inventory = buildChangedFileInventory({
      committedDiffStat: " a.js | 5 +++++",
      unstagedDiffStat: " a.js | 5 +++++",
    });
    expect(inventory).toHaveLength(1);
  });
});

describe("classifyHighRisk", () => {
  it("classifies known state-machine/safety files under tools/agent-workflow/ as high-risk", () => {
    expect(classifyHighRisk("tools/agent-workflow/orchestrateCommand.js", {})).toBe(true);
    expect(classifyHighRisk("tools/agent-workflow/reviewBudget.js", {})).toBe(true);
  });

  it("does not classify a same-named file outside tools/agent-workflow/ as high-risk", () => {
    expect(classifyHighRisk("src/other/orchestrateCommand.js", { additions: 1, deletions: 1 })).toBe(false);
  });

  it("classifies a large net line-change as high-risk regardless of filename", () => {
    expect(classifyHighRisk("tools/agent-workflow/README.md", { additions: 30, deletions: 20 })).toBe(true);
  });

  it("does not classify a small unrelated change as high-risk", () => {
    expect(classifyHighRisk("tools/agent-workflow/README.md", { additions: 2, deletions: 1 })).toBe(false);
  });

  it("respects a configurable high-risk line threshold", () => {
    expect(classifyHighRisk("docs/notes.md", { additions: 10, deletions: 0 }, { highRiskLineThreshold: 5 })).toBe(true);
  });
});

describe("summarizeInventory / validateReviewCoverage", () => {
  const inventory = [
    { path: "tools/agent-workflow/orchestrateCommand.js", highRisk: true },
    { path: "tools/agent-workflow/README.md", highRisk: false },
  ];

  it("summarizes total and high-risk counts", () => {
    expect(summarizeInventory(inventory)).toEqual({ changedFilesTotal: 2, highRiskFilesTotal: 1 });
  });

  it("accepts a reviewer's coverage claim that meets the deterministic totals", () => {
    const result = validateReviewCoverage(
      { changedFilesInspected: 2, highRiskFilesInspected: 1, checklistCompleted: true },
      inventory,
    );
    expect(result.coverageSufficient).toBe(true);
  });

  it("rejects a reviewer's coverage claim that undercounts the deterministic total", () => {
    const result = validateReviewCoverage(
      { changedFilesInspected: 1, highRiskFilesInspected: 1, checklistCompleted: true },
      inventory,
    );
    expect(result.coverageSufficient).toBe(false);
  });

  it("caps an over-claimed inspected count at the deterministic total rather than trusting it", () => {
    const result = validateReviewCoverage(
      { changedFilesInspected: 99, highRiskFilesInspected: 99, checklistCompleted: true },
      inventory,
    );
    expect(result.changedFilesInspected).toBe(2);
    expect(result.highRiskFilesInspected).toBe(1);
  });
});

describe("computeReviewCompleteness", () => {
  const inventory = [
    { path: "tools/agent-workflow/orchestrateCommand.js", highRisk: true },
  ];
  const completeCoverage = {
    changedFilesTotal: 1,
    changedFilesInspected: 1,
    highRiskFilesTotal: 1,
    highRiskFilesInspected: 1,
    checklistCompleted: true,
  };

  function validAnalysis(reviewCoverage: Record<string, unknown> | undefined) {
    return {
      status: "valid",
      review: { decision: "approved", reviewCoverage },
    };
  }

  it("is invalid when the reviewer process timed out", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: validAnalysis(completeCoverage), inventory, timedOut: true });
    expect(result.status).toBe("invalid");
  });

  it("is invalid when the reviewer process failed to execute", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: validAnalysis(completeCoverage), inventory, executionFailed: true });
    expect(result.status).toBe("invalid");
  });

  it("is invalid when interrupted", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: validAnalysis(completeCoverage), inventory, interrupted: true });
    expect(result.status).toBe("invalid");
  });

  it("is complete (not incomplete) for a legacy plain-Markdown review with no structured JSON at all", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: { status: "absent" }, inventory });
    expect(result.status).toBe("complete");
  });

  it("is invalid when the structured review is malformed", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: { status: "invalid" }, inventory });
    expect(result.status).toBe("invalid");
  });

  it("is complete (not incomplete) when reviewCoverage is entirely missing -- backward compatible with every pre-Spec-056 structured review", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: validAnalysis(undefined), inventory });
    expect(result.status).toBe("complete");
  });

  it("is incomplete when the reviewer explicitly reports stopping early", () => {
    const result = computeReviewCompleteness({
      structuredAnalysis: validAnalysis({ ...completeCoverage, stoppedEarly: true }),
      inventory,
    });
    expect(result.status).toBe("incomplete");
  });

  it("is incomplete when the checklist was not completed", () => {
    const result = computeReviewCompleteness({
      structuredAnalysis: validAnalysis({ ...completeCoverage, checklistCompleted: false }),
      inventory,
    });
    expect(result.status).toBe("incomplete");
  });

  it("is incomplete when reported high-risk coverage falls short of the deterministic total", () => {
    const result = computeReviewCompleteness({
      structuredAnalysis: validAnalysis({ ...completeCoverage, highRiskFilesInspected: 0 }),
      inventory,
    });
    expect(result.status).toBe("incomplete");
  });

  it("is complete when coverage, checklist, and inspected counts all satisfy the deterministic inventory", () => {
    const result = computeReviewCompleteness({ structuredAnalysis: validAnalysis(completeCoverage), inventory });
    expect(result.status).toBe("complete");
  });

  it("is complete for a genuine zero-finding Approved review with complete coverage (no forced findings)", () => {
    const analysis = { status: "valid", review: { decision: "approved", blockingFindings: [], reviewCoverage: completeCoverage } };
    const result = computeReviewCompleteness({ structuredAnalysis: analysis, inventory });
    expect(result.status).toBe("complete");
  });
});
