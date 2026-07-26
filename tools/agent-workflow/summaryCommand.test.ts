import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getRunSummaryForDisplay, formatSummaryCommandOutput } from "./summaryCommand.js";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "summary-command-test-"));
}

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function initRepo(cwd: string) {
  git(cwd, ["init", "-q"]);
  git(cwd, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(cwd, "tracked.txt"), "base\n");
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "-q", "-m", "init"]);
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

  it("populates commits.currentBranchHead from the live repository, matching orchestrate-written summaries", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();

    const summary = getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] }, { cwd });

    expect(summary.commits.currentBranchHead).toBe(head);
  });

  it("does not crash when the supplied cwd is not a git repository", () => {
    const cwd = createTempDir();
    expect(() => getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] }, { cwd })).not.toThrow();
  });
});
