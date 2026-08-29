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
import { buildChangedFileInventory } from "./reviewCoverage.js";
import { createFakeGitAdapter } from "./testDependencies.js";

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

function structuredApprovedReview() {
  return [
    "# Review Decision: Approved",
    "",
    "## Blocking Findings",
    "(none)",
    "",
    "## Non-Blocking Improvements",
    "(none)",
    "",
    "## Validation Performed",
    "mock",
    "",
    "## Final Recommendation",
    "Approve.",
    "",
    "## Structured Review",
    "",
    "```json",
    JSON.stringify({
      schemaVersion: 1,
      decision: "approved",
      summary: "No blocking findings.",
      blockingFindings: [],
      nonBlockingFindings: [],
      questions: [],
    }, null, 2),
    "```",
  ].join("\n");
}

function structuredChangesReview() {
  return [
    "# Review Decision: Changes Requested",
    "",
    "## Blocking Findings",
    "- Severity: P1",
    "  File: tracked.txt",
    "  Location: line 1",
    "  Problem: value is stale",
    "  Impact: behavior remains wrong",
    "  Recommendation: update the value",
    "",
    "## Non-Blocking Improvements",
    "(none)",
    "",
    "## Validation Performed",
    "mock",
    "",
    "## Final Recommendation",
    "Fix the finding.",
    "",
    "## Structured Review",
    "",
    "```json",
    JSON.stringify({
      schemaVersion: 1,
      decision: "changes_requested",
      summary: "One blocking finding.",
      blockingFindings: [
        {
          id: "P1-001",
          severity: "P1",
          filePath: "tracked.txt",
          location: "line 1",
          summary: "value is stale",
          reason: "behavior remains wrong",
          recommendation: "update the value",
        },
      ],
      nonBlockingFindings: [],
      questions: [],
    }, null, 2),
    "```",
  ].join("\n");
}

function structuredQuestionsReview() {
  return [
    "# Review Decision: Questions",
    "",
    "## Blocking Findings",
    "(none)",
    "",
    "## Questions",
    "- Q1: Which validation result covers timeout behavior?",
    "",
    "## Structured Review",
    "",
    "```json",
    JSON.stringify({
      schemaVersion: 1,
      decision: "questions",
      summary: "Clarification is needed.",
      blockingFindings: [],
      nonBlockingFindings: [],
      questions: [
        {
          id: "Q1",
          question: "Which validation result covers timeout behavior?",
          reason: "The review artifact does not show the timeout evidence.",
        },
      ],
    }, null, 2),
    "```",
  ].join("\n");
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
  }, 20000);

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
  }, 20000);

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
  }, 20000);

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
  }, 20000);

  it("collects exact numstat additions/deletions and untruncated paths for a large change under a deeply nested path (regression for Codex Spec 056 review round 2, P1-001: --stat's bar graph abbreviates long paths and scales large counts)", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const deepDir = path.join(cwd, "a", "very", "deeply", "nested", "directory", "structure", "that", "is", "quite", "long", "indeed", "for", "testing");
    fs.mkdirSync(deepDir, { recursive: true });
    const deepFile = path.join(deepDir, "file.js");
    fs.writeFileSync(deepFile, "line1\n");
    commitAll(cwd, "init");
    fs.writeFileSync(deepFile, Array.from({ length: 500 }, (_, i) => `line${i}`).join("\n") + "\n");

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    // --stat truncates this path with a leading "..." and scales the +/-
    // bar far below the real 499 insertions -- confirmed empirically against
    // real git output during this fix.
    expect(ctx.unstagedDiffStat).toMatch(/\.\.\./);
    expect((ctx.unstagedDiffStat.match(/\+/g) || []).length).toBeLessThan(100);
    // --numstat has neither problem.
    expect(ctx.unstagedDiffNumstat).toContain("a/very/deeply/nested/directory/structure/that/is/quite/long/indeed/for/testing/file.js");
    expect(ctx.unstagedDiffNumstat).toMatch(/^499\t0\t/m);

    const inventory = buildChangedFileInventory(ctx);
    const entry = inventory.find((item) => item.path.endsWith("for/testing/file.js"));
    expect(entry).toBeDefined();
    expect(entry!.path).not.toContain("...");
    expect(entry!.additions).toBe(499);
    // 499 >= the default high-risk line threshold (40): this large change
    // must be classified high-risk, which the --stat-scaled bar (21 "+"
    // characters) would have missed.
    expect(entry!.highRisk).toBe(true);
  });

  it("resolves the base branch to origin/main rather than a stale local main (regression: Spec 057 review round 2 timed out and produced 10 structured-review JSON blocks because a worktree's stale local main dragged an unrelated merged PR's ~40 files into the reviewed diff)", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "base.txt"), "base\n");
    commitAll(cwd, "init");
    const staleMain = execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();

    // Simulate a PR merging into origin/main after this worktree's local
    // `main` ref was created (e.g. EnterWorktree fetched origin to branch
    // from it but never moved the local `main` branch).
    fs.writeFileSync(path.join(cwd, "unrelated.txt"), "unrelated merged work\n");
    commitAll(cwd, "unrelated PR merged into origin main");
    git(cwd, ["update-ref", "refs/remotes/origin/main", "HEAD"]);

    git(cwd, ["checkout", "-q", "-b", "feature", "origin/main"]);
    git(cwd, ["branch", "-f", "main", staleMain]);
    fs.writeFileSync(path.join(cwd, "feature.txt"), "feature work\n");
    commitAll(cwd, "feature commit");

    const ctx = collectGitContext({ cwd, baseBranch: "main" });

    expect(ctx.baseBranchRef).toBe("origin/main");
    expect(ctx.committedLog).toContain("feature commit");
    expect(ctx.committedLog).not.toContain("unrelated PR merged into origin main");
  }, 20000);
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

  it("classifies conflicting Markdown and structured decisions as Unknown", () => {
    const output = structuredChangesReview().replace("# Review Decision: Changes Requested", "# Review Decision: Approved");

    expect(classifyReviewOutcome({ exitCode: 0 }, output)).toBe("Unknown");
  });

  it("classifies a valid structured Questions decision", () => {
    expect(classifyReviewOutcome({ exitCode: 0 }, structuredQuestionsReview())).toBe("Questions");
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

  it("writes a structured review artifact when Reviewer output contains valid structured JSON", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const adapter = createSpyAdapter({
      stdout: structuredChangesReview(),
      exitCode: 0,
    });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Changes Requested");
    expect(run.structuredReviewAnalysis.status).toBe("valid");
    expect(run.structuredReviewPath).toBeDefined();
    expect(fs.readFileSync(run.resultPath, "utf8")).toContain("## Structured Review");
    const structuredArtifact = JSON.parse(fs.readFileSync(run.structuredReviewPath as string, "utf8"));
    expect(structuredArtifact.blockingFindings[0].id).toBe("P1-001");
    expect(run.state.reviewRuns[0].structuredReviewStatus).toBe("valid");
    expect(run.state.reviewRuns[0].structuredReviewPath).toMatch(/structured-review\.json$/);
    expect(run.state.latestStructuredReview.blockingFindings[0].recommendation).toBe("update the value");
  });

  it("preserves Markdown-only review output without writing a structured artifact", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSpyAdapter({
      stdout: "# Review Decision: Approved\n\n## Blocking Findings\n(none)",
      exitCode: 0,
    });

    const run = await runIndependentReview(createState(), {
      cwd,
      gitAdapter,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Approved");
    expect(run.structuredReviewAnalysis.status).toBe("absent");
    expect(run.structuredReviewPath).toBeUndefined();
    expect(run.state.reviewRuns[0].structuredReviewStatus).toBe("absent");
  });

  it("does not approve malformed structured review data", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const adapter = createSpyAdapter({
      stdout: "# Review Decision: Approved\n\n## Structured Review\n\n```json\n{ nope\n```",
      exitCode: 0,
    });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Unknown");
    expect(run.structuredReviewAnalysis.status).toBe("invalid");
    expect(run.structuredReviewPath).toBeUndefined();
    expect(run.state.reviewRuns[0].structuredReviewDiagnostics[0]).toContain("malformed");
  });

  it("classifies a clean single structured review in stdout as Approved even when stderr echoes duplicate example JSON blocks", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const cleanApproved = [
      "# Review Decision: Approved",
      "",
      "## Blocking Findings",
      "(none)",
      "## Non-Blocking Improvements",
      "(none)",
      "## Validation Performed",
      "npm test",
      "## Final Recommendation",
      "Ship it.",
      "",
      "## Structured Review",
      "",
      "```json",
      "{",
      "  \"schemaVersion\": 1,",
      "  \"decision\": \"approved\",",
      "  \"summary\": \"Clean single approval.\",",
      "  \"blockingFindings\": [],",
      "  \"nonBlockingFindings\": [],",
      "  \"questions\": []",
      "}",
      "```",
    ].join("\n");
    const noisyTranscriptEcho = [
      "Reading prompt from stdin...",
      "OpenAI Codex v0.145.0",
      "## Structured Review",
      "",
      "```json",
      "{ \"schemaVersion\": 1, \"decision\": \"changes_requested\" }",
      "```",
      "",
      "## Structured Review",
      "",
      "```json",
      "{ \"findingLifecycle\": [] }",
      "```",
    ].join("\n");
    const adapter = createSpyAdapter({
      stdout: cleanApproved,
      stderr: noisyTranscriptEcho,
      exitCode: 0,
    });

    const run = await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Approved");
    expect(run.structuredReviewAnalysis.status).toBe("valid");
    expect(run.state.reviewRuns[0].structuredReviewStatus).toBe("valid");
    expect(fs.readFileSync(run.resultPath, "utf8")).toContain("Reading prompt from stdin...");
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

  it("propagates an explicit Reviewer timeout unchanged", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const adapter = createSpyAdapter({ stdout: "# Review Decision: Approved", exitCode: 0 });

    await runIndependentReview(createState(), {
      cwd,
      processAdapter: adapter,
      timeoutMs: 600000,
      now: () => "2026-07-23T00:00:00.000Z",
    });

    expect(adapter.run).toHaveBeenCalledWith("claude", expect.any(Array), expect.objectContaining({
      timeoutMs: 600000,
    }));
  });

  it("allows a long-running successful Reviewer to complete before timeout", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    const state = createState({
      agentRunners: {
        reviewer: {
          identity: "Long Mock Reviewer",
          command: process.execPath,
          args: [
            "-e",
            "process.stdin.resume(); process.stdin.on('end', () => setTimeout(() => console.log('# Review Decision: Approved\\n\\n## Blocking Findings\\n(none)\\n## Non-Blocking Improvements\\n(none)\\n## Validation Performed\\nmock\\n## Final Recommendation\\nApprove.'), 12000));",
          ],
          inputMode: "stdin",
          timeoutMs: 30000,
        },
      },
    });

    const run = await runIndependentReview(state, {
      cwd,
      timeoutMs: 30000,
      now: () => "2026-07-23T00:00:00.000Z",
    });
    const executionRecord = JSON.parse(fs.readFileSync(run.executionPath, "utf8"));

    expect(run.outcome).toBe("Approved");
    expect(executionRecord.exitCode).toBe(0);
    expect(executionRecord.signal).toBeNull();
    expect(executionRecord.timedOut).toBe(false);
    expect(executionRecord.interrupted).toBe(false);
    expect(executionRecord.terminationReason).toBe("natural-exit");
    expect(executionRecord.configuredTimeoutMs).toBe(30000);
  }, 20000);

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

function createRoleSelectionState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return createState({
    agentRunners: {
      codex: { agentId: "codex", identity: "Codex Mock", command: "mock-codex", args: [], inputMode: "stdin" },
      claude: { agentId: "claude", identity: "Claude Mock", command: "mock-claude", args: ["-p", "{{prompt}}"], inputMode: "argument" },
    },
    ...overrides,
  } as Partial<WorkflowState>);
}

describe("run-review --implementer support", () => {
  it("auto-derives Reviewer=codex when --implementer claude is given (dry-run)", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const preview = previewIndependentReview(createRoleSelectionState(), {
      cwd,
      processAdapter: spy,
      implementerAgentId: "claude",
    } as never);

    expect(spy.run).not.toHaveBeenCalled();
    expect(preview.implementerId).toBe("claude");
    expect(preview.reviewerId).toBe("codex");
    expect(preview.roleSource).toBe("cli-override");
    expect(preview.willSpawn).toBe(false);
  });

  it("auto-derives Reviewer=claude when --implementer codex is given (dry-run)", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const preview = previewIndependentReview(createRoleSelectionState(), {
      cwd,
      processAdapter: spy,
      implementerAgentId: "codex",
    } as never);

    expect(preview.implementerId).toBe("codex");
    expect(preview.reviewerId).toBe("claude");
    expect(preview.roleSource).toBe("cli-override");
  });

  it("lets an explicit --agent override take precedence over --implementer auto-derivation", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createRoleSelectionState({
      agentRunners: {
        codex: { agentId: "codex", identity: "Codex Mock", command: "mock-codex", args: [], inputMode: "stdin" },
        claude: { agentId: "claude", identity: "Claude Mock", command: "mock-claude", args: ["-p", "{{prompt}}"], inputMode: "argument" },
        "explicit-reviewer": { agentId: "explicit-reviewer", identity: "Explicit Reviewer", command: "mock-explicit", args: [], inputMode: "stdin" },
      },
    } as never);
    const preview = previewIndependentReview(state, {
      cwd,
      processAdapter: spy,
      implementerAgentId: "claude",
      agentId: "explicit-reviewer",
    } as never);

    expect(preview.implementerId).toBe("claude");
    expect(preview.reviewerId).toBe("explicit-reviewer");
    expect(preview.roleSource).toBe("cli-override");
  });

  it("rejects a disabled --implementer before any spawn even when --agent is also supplied", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createRoleSelectionState({
      agentRunners: {
        codex: { agentId: "codex", identity: "Codex Mock", command: "mock-codex", args: [], inputMode: "stdin" },
        claude: { agentId: "claude", identity: "Claude Mock", command: "mock-claude", args: [], inputMode: "stdin", enabled: false },
        "explicit-reviewer": { agentId: "explicit-reviewer", identity: "Explicit Reviewer", command: "mock-explicit", args: [], inputMode: "stdin" },
      },
    } as never);

    expect(() => previewIndependentReview(state, {
      cwd,
      processAdapter: spy,
      implementerAgentId: "claude",
      agentId: "explicit-reviewer",
    } as never)).toThrow("Requested implementer 'claude' is disabled.");
    await expect(runIndependentReview(state, {
      cwd,
      processAdapter: spy,
      implementerAgentId: "claude",
      agentId: "explicit-reviewer",
    })).rejects.toThrow("Requested implementer 'claude' is disabled.");
    expect(spy.run).not.toHaveBeenCalled();
  });

  it("rejects an unsafe --implementer before any spawn even when --agent is also supplied", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createRoleSelectionState({
      agentRunners: {
        codex: { agentId: "codex", identity: "Codex Mock", command: "mock-codex", args: [], inputMode: "stdin" },
        claude: { agentId: "claude", identity: "Unsafe Claude", command: "gh", args: ["pr", "merge"], inputMode: "stdin" },
        "explicit-reviewer": { agentId: "explicit-reviewer", identity: "Explicit Reviewer", command: "mock-explicit", args: [], inputMode: "stdin" },
      },
    } as never);

    expect(() => previewIndependentReview(state, {
      cwd,
      processAdapter: spy,
      implementerAgentId: "claude",
      agentId: "explicit-reviewer",
    } as never)).toThrow("unsafe or invalid runner configuration");
    expect(spy.run).not.toHaveBeenCalled();
  });

  it("rejects an unknown --implementer before any spawn, in dry-run and real execution", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createRoleSelectionState();

    expect(() => previewIndependentReview(state, { cwd, processAdapter: spy, implementerAgentId: "unknown-agent" } as never))
      .toThrow("Requested implementer 'unknown-agent' is not configured.");
    await expect(runIndependentReview(state, { cwd, processAdapter: spy, implementerAgentId: "unknown-agent" }))
      .rejects.toThrow("Requested implementer 'unknown-agent' is not configured.");
    expect(spy.run).not.toHaveBeenCalled();
  });

  it("runs the actual review against the auto-derived Reviewer and records role source", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\nchanged\n");

    const adapter = createSpyAdapter({
      stdout: "# Review Decision: Approved\n\n## Blocking Findings\n(none)\n## Non-Blocking Improvements\n(none)\n## Validation Performed\nnpm test\n## Final Recommendation\nShip it.",
      exitCode: 0,
    });

    const run = await runIndependentReview(createRoleSelectionState(), {
      cwd,
      processAdapter: adapter,
      implementerAgentId: "claude",
      now: () => "2026-07-25T00:00:00.000Z",
    });

    expect(run.outcome).toBe("Approved");
    expect(run.reviewerId).toBe("codex");
    expect(run.implementerId).toBe("claude");
    expect(run.roleSource).toBe("cli-override");
    expect(adapter.run).toHaveBeenCalledWith("mock-codex", [], expect.objectContaining({ cwd }));
  });

  it("preserves default role source when --implementer is not supplied", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const preview = previewIndependentReview(createState(), { cwd, processAdapter: spy } as never);

    expect(preview.roleSource).toBe("default");
  });

  it("preserves state role source when stageAgents overrides exist and --implementer is not supplied", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    fs.writeFileSync(path.join(cwd, "file.txt"), "hello\n");
    commitAll(cwd, "init");

    const spy = createSpyAdapter({ stdout: "should not run" });
    const state = createState({ stageAgents: { implement: "claude", review: "codex" } });
    const preview = previewIndependentReview(state, { cwd, processAdapter: spy } as never);

    expect(preview.roleSource).toBe("state");
  });
});
