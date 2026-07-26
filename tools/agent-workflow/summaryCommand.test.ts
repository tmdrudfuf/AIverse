import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getRunSummaryForDisplay, formatSummaryCommandOutput } from "./summaryCommand.js";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "summary-command-test-"));
}

describe("summaryCommand", () => {
  it("computes a summary directly from state, without touching the filesystem", () => {
    const cwd = createTempDir();
    const filesBefore = fs.readdirSync(cwd);
    const summary = getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] }, { cwd });
    const filesAfter = fs.readdirSync(cwd);
    expect(summary.schemaVersion).toBe(1);
    expect(filesAfter).toEqual(filesBefore);
  });

  it("formats markdown output by default", () => {
    const summary = getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] });
    const output = formatSummaryCommandOutput(summary, "markdown");
    expect(output).toContain("# Agent Workflow Run Summary");
  });

  it("formats JSON output that parses cleanly and ends with a newline", () => {
    const summary = getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] });
    const output = formatSummaryCommandOutput(summary, "json");
    expect(output.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(output)).not.toThrow();
    expect(JSON.parse(output).schemaVersion).toBe(1);
  });

  it("produces a safe partial summary for a legacy state file with no Spec 054 fields, without crashing", () => {
    const legacyState = { featureId: "010-legacy", baseBranch: "main", currentBranch: "codex/legacy", results: [] };
    expect(() => getRunSummaryForDisplay(legacyState)).not.toThrow();
    const summary = getRunSummaryForDisplay(legacyState);
    expect(summary.run.status).toBe("planned");
  });
});
