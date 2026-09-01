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
  execFileSync("git", [
    "-c", "commit.gpgsign=false",
    "-c", "tag.gpgSign=false",
    "-c", "core.hooksPath=/dev/null",
    ...args,
  ], {
    cwd,
    stdio: "pipe",
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: os.platform() === "win32" ? "NUL" : "/dev/null",
    },
  });
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

  it("reports currentBranchHead as unknown even in a real repository (no git call is made)", () => {
    const cwd = createTempDir();
    initRepo(cwd);

    const summary = getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] }, { cwd });

    expect(summary.commits.currentBranchHead).toBeNull();
  });

  it("does not import any process-spawning module (git context collection, child_process), enforced at the source level", () => {
    // vi.spyOn cannot intercept a CommonJS module's own already-destructured
    // reference to child_process.execFileSync from within an ESM test
    // (Vitest cannot redefine the export), so this is verified structurally
    // instead: summaryCommand.js must never require the modules that would
    // let it spawn a process, not just happen to avoid calling them today.
    const source = fs.readFileSync(path.join(__dirname, "summaryCommand.js"), "utf8");
    expect(source).not.toMatch(/require\(["']\.\/reviewCommand\.js["']\)/);
    expect(source).not.toMatch(/require\(["']child_process["']\)/);
  });

  it("does not crash when the supplied cwd is not a git repository", () => {
    const cwd = createTempDir();
    expect(() => getRunSummaryForDisplay({ featureId: "x", baseBranch: "main", results: [] }, { cwd })).not.toThrow();
  });
});
