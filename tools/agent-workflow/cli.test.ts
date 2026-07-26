import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  describeRoleSource,
  formatIndependentReviewDryRunPreview,
  formatOrchestrationDryRun,
  formatOrchestrationResult,
  readImplementerFlag,
} from "./cli.js";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cli-test-"));
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

const cliPath = path.join(__dirname, "cli.js");

function runCli(args: string[], cwd: string) {
  try {
    const stdout = execFileSync("node", [cliPath, ...args], { cwd, encoding: "utf8" });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: any) {
    return { stdout: error.stdout?.toString() || "", stderr: error.stderr?.toString() || "", exitCode: error.status ?? 1 };
  }
}

describe("readImplementerFlag", () => {
  it("returns undefined when --implementer is absent", () => {
    expect(readImplementerFlag(["--state", "x.json", "--dry-run"])).toBeUndefined();
  });

  it("reads a single value", () => {
    expect(readImplementerFlag(["--implementer", "claude"])).toBe("claude");
  });

  it("rejects a missing value at end of argv", () => {
    expect(() => readImplementerFlag(["--implementer"])).toThrow("--implementer requires a value.");
  });

  it("rejects a missing value immediately followed by another flag", () => {
    expect(() => readImplementerFlag(["--implementer", "--dry-run"])).toThrow("--implementer requires a value.");
  });

  it("normalizes repeated identical values to one value", () => {
    expect(readImplementerFlag(["--implementer", "claude", "--implementer", "claude"])).toBe("claude");
  });

  it("rejects repeated conflicting values", () => {
    expect(() => readImplementerFlag(["--implementer", "claude", "--implementer", "codex"]))
      .toThrow("--implementer was provided multiple times with conflicting values: claude, codex.");
  });

  it("does not support the --implementer=value equals form", () => {
    // Equals form is treated as a single unrecognized token, not a flag+value pair,
    // so it is silently absent rather than parsed - documented, not a crash.
    expect(readImplementerFlag(["--implementer=claude"])).toBeUndefined();
  });
});

describe("describeRoleSource", () => {
  it("maps known sources to human-readable labels", () => {
    expect(describeRoleSource("cli-override")).toBe("CLI override");
    expect(describeRoleSource("state")).toBe("state");
    expect(describeRoleSource("default")).toBe("default");
  });

  it("falls back to the raw value for unknown sources", () => {
    expect(describeRoleSource("mystery")).toBe("mystery");
  });
});

describe("orchestrate dry-run output contains no hard-coded incorrect role labels", () => {
  it("labels Claude as Implementer and Codex as Reviewer when --implementer claude is requested", () => {
    const output = formatOrchestrationDryRun({
      featureId: "x",
      branch: "b",
      currentStage: "implement",
      roleSource: "cli-override",
      implementer: { id: "claude", identity: "Claude Code CLI", commandPreview: "claude ..." },
      reviewer: { id: "codex", identity: "OpenAI Codex CLI", commandPreview: "codex ..." },
      sameRunner: false,
      validationCommands: ["npm test"],
      maxFixCycles: 2,
      questionCycle: 0,
      maxQuestionCycles: 1,
      findingLifecycle: { previousFindingsMayBeSupplied: false, currentFindingCount: 0 },
      nextExpectedStage: "implement",
      runDirectory: "dir",
      promptPaths: { implement: "a", fix: "b", review: "c", answerQuestions: "d", finalReview: "e", findingLifecycle: "f" },
      summaryPaths: { json: "run-summary.json", markdown: "run-summary.md", willWrite: false },
      plannedStages: ["implement"],
      willSpawn: false,
    } as never);
    expect(output).toContain("Implementer: Claude Code CLI (claude)");
    expect(output).toContain("Reviewer: OpenAI Codex CLI (codex)");
    expect(output).toContain("Role source: CLI override");
    expect(output).not.toMatch(/Implementer: OpenAI Codex CLI/);
    expect(output).toContain("Will spawn agents: no");
    expect(output).toContain("Will mutate state: no");
    expect(output).toContain("Will run validation: no");
    expect(output).toContain("Will perform remote mutation: no");
  });
});

describe("orchestrate result output states which agents served each role", () => {
  it("reflects the actual resolved implementer/reviewer identities from state.orchestration", () => {
    const output = formatOrchestrationResult({
      state: {
        featureId: "x",
        orchestration: {
          implementerId: "claude",
          implementerIdentity: "Claude Code CLI",
          reviewerId: "codex",
          reviewerIdentity: "OpenAI Codex CLI",
          roleResolutionSource: "cli-override",
          currentStage: "human-merge-decision",
        },
      },
      steps: [],
      decision: "Ready for human merge decision",
      reason: "",
      nextAction: "human merge decision",
    } as never);
    expect(output).toContain("Implementer: Claude Code CLI (claude)");
    expect(output).toContain("Reviewer: OpenAI Codex CLI (codex)");
    expect(output).toContain("Role source: CLI override");
  });
});

describe("run-review dry-run preview reflects resolved roles", () => {
  it("prints the resolved Implementer/Reviewer and role source", () => {
    const output = formatIndependentReviewDryRunPreview({
      dryRun: true,
      reviewerId: "codex",
      reviewerIdentity: "OpenAI Codex CLI",
      implementerId: "claude",
      implementerIdentity: "Claude Code CLI",
      roleSource: "cli-override",
      sameRunner: false,
      commandPreview: "codex ...",
      promptPath: "p",
      runDirectory: "d",
      repositoryContext: {
        repositoryPath: "r",
        currentBranch: "b",
        baseBranch: "main",
        mergeBase: "abc",
        hasStagedChanges: false,
        hasUnstagedChanges: false,
        hasCommittedChanges: false,
      },
      willSpawn: false,
    } as never);
    expect(output).toContain("Implementer: Claude Code CLI (claude)");
    expect(output).toContain("Reviewer: OpenAI Codex CLI (codex)");
    expect(output).toContain("Role source: CLI override");
    expect(output).toContain("Will spawn: false");
  });
});

describe("CLI process: orchestrate --implementer validation before spawn", () => {
  function writeState(cwd: string, extra: Record<string, unknown> = {}) {
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({
      featureId: "cli-test-feature",
      featureName: "CLI Test Feature",
      baseBranch: "main",
      results: [],
      ...extra,
    }), "utf8");
    return statePath;
  }

  it("rejects an unknown --implementer before any spawn (dry-run)", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);
    const result = runCli(["orchestrate", "--state", statePath, "--implementer", "nonexistent-agent", "--dry-run"], cwd);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Requested implementer 'nonexistent-agent' is not configured.");
  });

  it("rejects a missing --implementer value before any spawn", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);
    const result = runCli(["orchestrate", "--state", statePath, "--implementer"], cwd);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("--implementer requires a value.");
  });

  it("rejects repeated conflicting --implementer values before any spawn", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);
    const result = runCli(["orchestrate", "--state", statePath, "--implementer", "claude", "--implementer", "codex", "--dry-run"], cwd);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("--implementer was provided multiple times with conflicting values");
  });

  it("prints the correct opposite Reviewer for --implementer claude and --implementer codex", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePathClaude = writeState(cwd);
    const claudeResult = runCli(["orchestrate", "--state", statePathClaude, "--implementer", "claude", "--dry-run"], cwd);
    expect(claudeResult.exitCode).toBe(0);
    expect(claudeResult.stdout).toContain("Implementer: Claude Code CLI (claude)");
    expect(claudeResult.stdout).toContain("Reviewer: OpenAI Codex CLI (codex)");
    expect(claudeResult.stdout).toContain("Will spawn: false");

    const codexResult = runCli(["orchestrate", "--state", statePathClaude, "--implementer", "codex", "--dry-run"], cwd);
    expect(codexResult.exitCode).toBe(0);
    expect(codexResult.stdout).toContain("Implementer: OpenAI Codex CLI (codex)");
    expect(codexResult.stdout).toContain("Reviewer: Claude Code CLI (claude)");
  }, 20000);
});

describe("CLI process: summary command is read-only", () => {
  function writeState(cwd: string, extra: Record<string, unknown> = {}) {
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({
      featureId: "cli-test-feature",
      featureName: "CLI Test Feature",
      baseBranch: "main",
      results: [],
      ...extra,
    }), "utf8");
    return statePath;
  }

  it("renders markdown by default and never spawns, mutates state, or writes artifacts", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);
    const stateBefore = fs.readFileSync(statePath, "utf8");

    const result = runCli(["summary", "--state", statePath], cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("# Agent Workflow Run Summary");
    expect(result.stdout).toContain("Status: Planned (not started)");
    expect(fs.readFileSync(statePath, "utf8")).toBe(stateBefore);
    expect(fs.existsSync(path.join(cwd, ".agent-workflow", "runs"))).toBe(false);
  });

  it("renders JSON with --format json", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);

    const result = runCli(["summary", "--state", statePath, "--format", "json"], cwd);

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.run.status).toBe("planned");
  });

  it("rejects an unsupported --format value", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd);

    const result = runCli(["summary", "--state", statePath, "--format", "yaml"], cwd);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Unsupported --format value");
  });

  it("reads a UTF-8 BOM state file without crashing or mutating it", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const bomContent = `﻿${JSON.stringify({ featureId: "bom-feature", baseBranch: "main", results: [] })}`;
    fs.writeFileSync(statePath, bomContent, "utf8");

    const result = runCli(["summary", "--state", statePath, "--format", "json"], cwd);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).run.featureId).toBe("bom-feature");
    expect(fs.readFileSync(statePath, "utf8")).toBe(bomContent);
  });

  it("produces a safe partial summary for a legacy state file with no Spec 054 fields", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = writeState(cwd, { currentBranch: "codex/legacy-feature" });

    const result = runCli(["summary", "--state", statePath, "--format", "json"], cwd);

    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.run.status).toBe("planned");
    expect(parsed.roles.source).toBeNull();
  });
});
