import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { main as cliMain, formatDryRunPreview, formatRunSummary } from "./cli.js";
import {
  SAME_RUNNER_WARNING,
  classifyReviewOutcome,
  collectGitContext,
  previewIndependentReview,
  resolveRoleRunner,
  runIndependentReview,
  runIndependentReviewAndPersist,
  runnersMatch,
} from "./reviewCommand.js";
import { writeState } from "./agentWorkflow.js";
import { CLAUDE_FULL_ACCESS_ARGS, CODEX_FULL_ACCESS_ARGS } from "./agentRunner.js";

type WorkflowState = {
  featureId: string;
  featureName: string;
  baseBranch?: string;
  results: Array<{ stage: string; decision?: string }>;
  validationEvidence?: string[];
  agentRunners?: Record<string, unknown>;
  stageAgents?: Record<string, string>;
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "review-command-"));
}

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function initRepo(cwd: string) {
  git(cwd, ["init", "-q"]);
  git(cwd, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Test"]);
}

function commitAll(cwd: string, message: string) {
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "-q", "-m", message]);
}

function createState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return {
    featureId: "999-independent-review-test",
    featureName: "Independent Review Test",
    baseBranch: "main",
    results: [],
    ...overrides,
  };
}

function createSpyAdapter(result: Record<string, unknown>) {
  const run = vi.fn(async () => ({
    stdout: "",
    stderr: "",
    exitCode: 0,
    signal: null,
    timedOut: false,
    interrupted: false,
    durationMs: 5,
    ...result,
  }));
  return { run };
}

describe("Reviewer/Implementer resolution", () => {
  it("resolves the default Implementer (Codex CLI) and Reviewer (Claude CLI)", () => {
    const state = createState();
    const implementer = resolveRoleRunner(state, "implementer");
    const reviewer = resolveRoleRunner(state, "reviewer");

    expect(implementer.command).toBe("codex");
    expect(implementer.args).toEqual(CODEX_FULL_ACCESS_ARGS);
    expect(implementer.inputMode).toBe("stdin");
    expect(reviewer.command).toBe("claude");
    expect(reviewer.args).toEqual(CLAUDE_FULL_ACCESS_ARGS);
    expect(reviewer.inputMode).toBe("argument");
    expect(reviewer.agentId).toBe("reviewer");
    expect(runnersMatch(implementer, reviewer)).toBe(false);
  });

  it("resolves a state-configured Reviewer override", () => {
    const state = createState({
      agentRunners: {
        "codex-reviewer": {
          agentId: "codex-reviewer",
          identity: "Reviewer (Codex CLI)",
          command: "codex",
          args: [],
          inputMode: "stdin",
        },
      },
      stageAgents: { review: "codex-reviewer" },
    });

    const reviewer = resolveRoleRunner(state, "reviewer");
    expect(reviewer.command).toBe("codex");
    expect(reviewer.agentId).toBe("codex-reviewer");
  });

  it("supports legacy 'claude' and 'codex' runner ids explicitly", () => {
    const state = createState();
    expect(resolveRoleRunner(state, "reviewer", "claude").command).toBe("claude");
    expect(resolveRoleRunner(state, "implementer", "codex").command).toBe("codex");
  });

  it("supports role-swapped configuration (Implementer=Claude, Reviewer=Codex)", () => {
    const state = createState({
      stageAgents: { implement: "claude", review: "codex" },
    });

    const implementer = resolveRoleRunner(state, "implementer");
    const reviewer = resolveRoleRunner(state, "reviewer");
    expect(implementer.command).toBe("claude");
    expect(implementer.args).toEqual(CLAUDE_FULL_ACCESS_ARGS);
    expect(reviewer.command).toBe("codex");
    expect(reviewer.args).toEqual(CODEX_FULL_ACCESS_ARGS);
    expect(runnersMatch(implementer, reviewer)).toBe(false);
  });

  it("preserves custom state runner precedence over built-in full-access aliases", () => {
    const state = createState({
      agentRunners: {
        codex: {
          identity: "Custom Codex",
          command: "custom-codex",
          args: ["review"],
          inputMode: "stdin",
        },
      },
      stageAgents: { review: "codex" },
    });

    const reviewer = resolveRoleRunner(state, "reviewer");
    expect(reviewer.command).toBe("custom-codex");
    expect(reviewer.args).toEqual(["review"]);
  });
});

describe("git context collection", () => {
  it("reports a clean working tree with no changes", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    expect(ctx.currentBranch).toBe("main");
    expect(ctx.hasStagedChanges).toBe(false);
    expect(ctx.hasUnstagedChanges).toBe(false);
    expect(ctx.hasCommittedChanges).toBe(false);
  });

  it("detects staged-only changes", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    fs.writeFileSync(path.join(cwd, "new.txt"), "staged content\n");
    git(cwd, ["add", "new.txt"]);

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    expect(ctx.hasStagedChanges).toBe(true);
    expect(ctx.hasUnstagedChanges).toBe(false);
    expect(ctx.stagedDiff).toContain("staged content");
  });

  it("detects unstaged-only changes", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\nmore\n");

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    expect(ctx.hasStagedChanges).toBe(false);
    expect(ctx.hasUnstagedChanges).toBe(true);
    expect(ctx.unstagedDiff).toContain("more");
  });

  it("detects committed branch changes plus working-tree changes", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "base.txt"), "base\n");
    commitAll(cwd, "init");
    git(cwd, ["checkout", "-q", "-b", "feature"]);
    fs.writeFileSync(path.join(cwd, "feature.txt"), "feature work\n");
    commitAll(cwd, "feature commit");
    fs.writeFileSync(path.join(cwd, "base.txt"), "base\nchanged\n");

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    expect(ctx.currentBranch).toBe("feature");
    expect(ctx.hasCommittedChanges).toBe(true);
    expect(ctx.committedLog).toContain("feature commit");
    expect(ctx.hasUnstagedChanges).toBe(true);
    expect(ctx.unstagedDiff).toContain("changed");
  });
});

describe("decision classification", () => {
  it("parses an explicit Approved decision", () => {
    const outcome = classifyReviewOutcome(
      { exitCode: 0 },
      "# Review Decision: Approved\n\n## Blocking Findings\n(none)",
    );
    expect(outcome).toBe("Approved");
  });

  it("parses an explicit Changes Requested decision", () => {
    const outcome = classifyReviewOutcome(
      { exitCode: 0 },
      "# Review Decision: Changes Requested\n\n## Blocking Findings\n- fix the thing",
    );
    expect(outcome).toBe("Changes Requested");
  });

  it("classifies ambiguous language as Unknown rather than fabricating approval", () => {
    const outcome = classifyReviewOutcome(
      { exitCode: 0 },
      "This looks pretty good overall, nice work.",
    );
    expect(outcome).toBe("Unknown");
  });

  it("classifies a timeout as Timed Out even if the partial output says Approved", () => {
    const outcome = classifyReviewOutcome(
      { exitCode: null, timedOut: true, signal: "SIGTERM" },
      "# Review Decision: Approved",
    );
    expect(outcome).toBe("Timed Out");
  });

  it("classifies a non-zero exit as Execution Failed", () => {
    expect(classifyReviewOutcome({ exitCode: 1 }, "")).toBe("Execution Failed");
  });

  it("classifies a spawn error as Execution Failed", () => {
    expect(classifyReviewOutcome({ exitCode: 0, errorMessage: "spawn claude ENOENT" }, "")).toBe("Execution Failed");
  });
});

describe("independent review dry-run", () => {
  it("performs no spawn and reports the same-runner warning when configured identically", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createState({
      agentRunners: {
        shared: {
          agentId: "shared",
          identity: "Shared CLI",
          command: "shared-cli",
          args: ["--prompt", "{{prompt}}"],
          inputMode: "argument",
        },
      },
      stageAgents: { implement: "shared", review: "shared" },
    });

    const preview = previewIndependentReview(state, { cwd, processAdapter: spy } as never);

    expect(spy.run).not.toHaveBeenCalled();
    expect(preview.willSpawn).toBe(false);
    expect(preview.sameRunner).toBe(true);
    expect(preview.reviewerId).toBe("shared");
  });

  it("previews the default Reviewer without spawning", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const preview = previewIndependentReview(createState(), { cwd, processAdapter: spy } as never);

    expect(spy.run).not.toHaveBeenCalled();
    expect(preview.dryRun).toBe(true);
    expect(preview.reviewerId).toBe("reviewer");
    expect(preview.sameRunner).toBe(false);
    expect(preview.commandPreview).toBe("claude --dangerously-skip-permissions -p {{prompt}}");
    expect(preview.repositoryContext.currentBranch).toBe("main");
  });

  it("rejects an unsafe Reviewer runner configuration before any spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createState({
      agentRunners: {
        reviewer: {
          agentId: "reviewer",
          identity: "Unsafe Reviewer",
          command: "gh",
          args: ["pr", "merge"],
          inputMode: "stdin",
        },
      },
    });

    expect(() => previewIndependentReview(state, { cwd, processAdapter: spy })).toThrow("Remote-mutating");
    await expect(runIndependentReview(state, { cwd, processAdapter: spy })).rejects.toThrow("Remote-mutating");
    expect(spy.run).not.toHaveBeenCalled();
  });
});

describe("independent review execution", () => {
  it("records run artifacts and an Approved outcome", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\nchanged\n");

    const adapter = createSpyAdapter({
      stdout: "# Review Decision: Approved\n\n## Blocking Findings\n(none)\n## Non-Blocking Improvements\n(none)\n## Validation Performed\nnpm test\n## Final Recommendation\nShip it.",
      exitCode: 0,
    });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Approved");
    expect(run.reviewerId).toBe("reviewer");
    expect(run.sameRunner).toBe(false);
    expect(fs.existsSync(run.promptPath)).toBe(true);
    expect(fs.existsSync(run.executionPath)).toBe(true);
    expect(fs.existsSync(run.resultPath)).toBe(true);
    expect(fs.readFileSync(run.promptPath, "utf8")).toContain("Independent Review: 999-independent-review-test");
    expect(fs.readFileSync(run.promptPath, "utf8")).toContain("changed");
    const executionRecord = JSON.parse(fs.readFileSync(run.executionPath, "utf8"));
    expect(executionRecord.outcome).toBe("Approved");
    expect(executionRecord.reviewerId).toBe("reviewer");
    expect(run.state.reviewRuns).toHaveLength(1);
    expect(run.state.reviewRuns[0].outcome).toBe("Approved");
    expect(adapter.run).toHaveBeenCalledWith("claude", [
      "--dangerously-skip-permissions",
      "-p",
      expect.stringContaining("Independent Review"),
    ], expect.objectContaining({ cwd }));
  });

  it("classifies a timed-out execution and still records artifacts", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const adapter = createSpyAdapter({ stdout: "# Review Decision: Approved", timedOut: true, signal: "SIGTERM", exitCode: null });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Timed Out");
    expect(run.state.reviewRuns[0].outcome).toBe("Timed Out");
  });

  it("classifies a failed execution without fabricating approval", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const adapter = createSpyAdapter({ stderr: "boom Approved", exitCode: 1 });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Execution Failed");
  });

  it("persists state through runIndependentReviewAndPersist", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    writeState(statePath, createState());

    const adapter = createSpyAdapter({ stdout: "# Review Decision: Changes Requested\n\n## Blocking Findings\n- fix x", exitCode: 0 });

    const run = await runIndependentReviewAndPersist(statePath, {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
    expect(persisted.reviewRuns).toHaveLength(1);
    expect(run.outcome).toBe("Changes Requested");
  });
});

describe("same-runner warning constant", () => {
  it("matches the documented warning text", () => {
    expect(SAME_RUNNER_WARNING).toContain("Warning: Implementer and Reviewer resolve to the same runner.");
    expect(SAME_RUNNER_WARNING).toContain("Independent review is not guaranteed.");
  });
});

describe("existing CLI commands remain compatible", () => {
  it("keeps prior cli.js exports available", () => {
    expect(typeof cliMain).toBe("function");
    expect(typeof formatDryRunPreview).toBe("function");
    expect(typeof formatRunSummary).toBe("function");
  });
});
