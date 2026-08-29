import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { readState, writeState } from "./agentWorkflow.js";
import {
  extractReviewFindings,
  previewOrchestration,
  runOrchestration,
  runOrchestrationAndPersist,
  runValidationCommands,
} from "./orchestrateCommand.js";
import { createFakeGitAdapter } from "./testDependencies.js";

type MockResult = {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  signal?: string | null;
  timedOut?: boolean;
  interrupted?: boolean;
  durationMs?: number;
  mutate?: (cwd: string, input?: string) => void;
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "orchestrate-"));
}

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

// Spec 056 Part A: the base fixture (one commit, one tracked file) is
// created exactly once per test-process run via a real `git init`/config/
// commit sequence, then never mutated again. Every test that still needs a
// real Git repository gets it via a cheap `fs.cpSync` copy into its own
// fresh `mkdtemp` directory instead of repeating that six-subprocess
// sequence itself -- full per-test isolation is preserved (each test copies
// into its own directory and mutates only its own copy) while the repeated
// git-init subprocess cost is paid once per test file, not once per test.
let cachedBaseFixture: string | undefined;

function getBaseFixture(): string {
  if (!cachedBaseFixture) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "orchestrate-base-"));
    git(dir, ["init", "-q"]);
    git(dir, ["symbolic-ref", "HEAD", "refs/heads/main"]);
    git(dir, ["config", "user.email", "test@example.com"]);
    git(dir, ["config", "user.name", "Test"]);
    fs.writeFileSync(path.join(dir, "tracked.txt"), "base\n");
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "-m", "init"]);
    cachedBaseFixture = dir;
  }
  return cachedBaseFixture;
}

function initRepo(cwd: string) {
  fs.cpSync(getBaseFixture(), cwd, { recursive: true });
}

function createState(overrides: Record<string, unknown> = {}) {
  return {
    featureId: "999-orchestrate-test",
    featureName: "Orchestrate Test",
    baseBranch: "main",
    taskScope: "Test orchestrate workflow.",
    results: [],
    validationCommands: ["mock validation"],
    agentRunners: {
      implementer: {
        identity: "Mock Implementer",
        command: "mock-implementer",
        args: [],
        inputMode: "stdin",
        timeoutMs: 1000,
      },
      reviewer: {
        identity: "Mock Reviewer",
        command: "mock-reviewer",
        args: [],
        inputMode: "stdin",
        timeoutMs: 1000,
      },
    },
    ...overrides,
  };
}

function createSequenceAdapter(results: MockResult[], cwd: string) {
  const calls: Array<{ command: string; args: string[]; input?: string }> = [];
  const run = vi.fn(async (command: string, args: string[], options: { input?: string }) => {
    calls.push({ command, args, input: options.input });
    const next = results.shift();
    if (!next) throw new Error(`Unexpected process call: ${command}`);
    if (next.mutate) next.mutate(cwd, options.input);
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      signal: null,
      timedOut: false,
      interrupted: false,
      durationMs: 5,
      ...next,
    };
  });
  return { run, calls };
}

const approvedReview = "# Review Decision: Approved\n\n## Blocking Findings\n(none)\n## Non-Blocking Improvements\n(none)\n## Validation Performed\nmock\n## Final Recommendation\nApprove.";
const actionableChanges = "# Review Decision: Changes Requested\n\n## Blocking Findings\n- File: tracked.txt\n  Location: line 1\n  Problem: value is stale\n  Impact: behavior remains wrong\n  Recommendation: update the value\n\n## Non-Blocking Improvements\n(none)\n## Validation Performed\nmock\n## Final Recommendation\nFix the finding.";
const structuredApprovedReview = [
  approvedReview,
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
const structuredActionableChanges = [
  actionableChanges,
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
function lifecycleReview(decision: "approved" | "changes_requested", blockingFindings: unknown[], findingLifecycle: unknown[]) {
  const heading = decision === "approved" ? "Approved" : "Changes Requested";
  return [
    `# Review Decision: ${heading}`,
    "",
    "## Blocking Findings",
    blockingFindings.length ? "- structured blockers supplied" : "(none)",
    "",
    "## Non-Blocking Improvements",
    "(none)",
    "",
    "## Validation Performed",
    "mock",
    "",
    "## Final Recommendation",
    heading,
    "",
    "## Structured Review",
    "",
    "```json",
    JSON.stringify({
      schemaVersion: 1,
      decision,
      summary: heading,
      blockingFindings,
      nonBlockingFindings: [],
      questions: [],
      findingLifecycle,
    }, null, 2),
    "```",
  ].join("\n");
}
const structuredResolvedApproval = lifecycleReview("approved", [], [
  { findingId: "P1-001", status: "resolved", explanation: "The stale value was updated." },
]);
const structuredStillOpenChanges = lifecycleReview("changes_requested", [
  {
    id: "P1-001",
    severity: "P1",
    filePath: "tracked.txt",
    location: "line 1",
    summary: "value is stale",
    reason: "behavior remains wrong",
    recommendation: "update the value",
  },
], [
  { findingId: "P1-001", status: "still_open", explanation: "The stale value remains." },
]);
const structuredResolvedPlusNew = lifecycleReview("changes_requested", [
  {
    id: "P2-001",
    severity: "P2",
    filePath: "tracked.txt",
    location: "line 2",
    summary: "new validation gap",
    reason: "a second behavior remains wrong",
    recommendation: "add the missing validation",
  },
], [
  { findingId: "P1-001", status: "resolved", explanation: "The stale value was updated." },
  { findingId: "P2-001", status: "new", explanation: "This issue was found after the fix." },
]);
const structuredQuestionsReview = [
  "# Review Decision: Questions",
  "",
  "## Blocking Findings",
  "(none)",
  "",
  "## Questions",
  "- Q1: Which validation result covers timeout behavior?",
  "",
  "## Non-Blocking Improvements",
  "(none)",
  "",
  "## Validation Performed",
  "mock",
  "",
  "## Final Recommendation",
  "Answer the question, then request final review.",
  "",
  "## Structured Review",
  "",
  "```json",
  JSON.stringify({
    schemaVersion: 1,
    decision: "questions",
    summary: "Clarification is needed before final decision.",
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
const structuredAnswers = [
  "# Implementer Answers",
  "",
  "## Answers",
  "- Q1: orchestrateCommand.test.ts covers timeout behavior.",
  "",
  "## Structured Answers",
  "",
  "```json",
  JSON.stringify({
    schemaVersion: 1,
    answers: [
      {
        questionId: "Q1",
        answer: "orchestrateCommand.test.ts covers Reviewer and Implementer timeout behavior.",
        evidence: ["tools/agent-workflow/orchestrateCommand.test.ts"],
      },
    ],
  }, null, 2),
  "```",
].join("\n");

describe("orchestrate dry-run", () => {
  it("does not spawn, validate, mutate state, or write result artifacts", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const state = createState();
    const preview = previewOrchestration(state, { cwd, gitAdapter, maxFixCycles: 3 });

    expect(preview.dryRun).toBe(true);
    expect(preview.willSpawn).toBe(false);
    expect(preview.implementer.commandPreview).toBe("mock-implementer");
    expect(preview.reviewer.commandPreview).toBe("mock-reviewer");
    expect(preview.validationCommands).toEqual(["mock validation"]);
    expect(preview.maxFixCycles).toBe(3);
    expect(preview.maxQuestionCycles).toBe(1);
    expect(preview.fixCycleCount).toBe(0);
    expect(preview.questionCycle).toBe(0);
    expect(preview.plannedStages.join(" -> ")).toContain("conditional answer-questions/final-review");
    expect(preview.promptPaths.answerQuestions).toContain("answer-questions-implementer-prompt");
    expect(preview.promptPaths.finalReview).toContain("final-review-independent-review-prompt");
    expect(state).not.toHaveProperty("orchestration");
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("reports the resumed fix cycle count", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const preview = previewOrchestration(createState({
      fixCycleCount: 1,
      orchestration: { currentStage: "re-review", maxFixCycles: 3 },
    }), { cwd, gitAdapter, maxFixCycles: 3 });

    expect(preview.currentStage).toBe("re-review");
    expect(preview.fixCycleCount).toBe(1);
  });
});

describe("orchestrate workflow", () => {
  it("runs direct approval flow to human merge decision", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.currentStage).toBe("human-merge-decision");
    expect(run.state.orchestration.implementerIdentity).toBe("Mock Implementer");
    expect(run.state.orchestration.reviewerIdentity).toBe("Mock Reviewer");
    expect(adapter.run).toHaveBeenCalledTimes(4);
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", expect.any(String), "mock-reviewer", expect.any(String)]);
    expect(run.state.validationRuns).toHaveLength(2);
    expect(run.state.reviewRuns).toHaveLength(1);
  }, 30000);

  it("runs one fix cycle and reaches approval", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      {
        stdout: "fixed",
        mutate: () => gitAdapter.setState({
          statusPorcelain: " M tracked.txt",
          unstagedDiffStat: " tracked.txt | 2 +-",
          unstagedDiff: "diff --git a/tracked.txt b/tracked.txt\n-fixed\n+fixed\n",
          unstagedDiffNumstat: "1\t1\ttracked.txt",
        }),
      },
      { stdout: "revalidation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.fixCycleCount).toBe(1);
    expect(adapter.calls.some((call) => call.input?.includes("File: tracked.txt"))).toBe(true);
  }, 30000);

  it("runs one question loop and reaches approval without a fix cycle", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });
    const answerPrompt = adapter.calls.find((call) => call.command === "mock-implementer" && call.input?.includes("Workflow stage: `answer-questions`"))?.input || "";
    const finalReviewPrompt = adapter.calls.find((call) => call.command === "mock-reviewer" && call.input?.includes("Workflow stage: `final-review`"))?.input || "";

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.questionCycle).toBe(1);
    expect(run.state.fixCycleCount || 0).toBe(0);
    expect(run.state.latestReviewerQuestionStatus).toBe("valid");
    expect(run.state.latestImplementerAnswerStatus).toBe("valid");
    expect(run.state.latestImplementerAnswers.answers[0].questionId).toBe("Q1");
    expect(answerPrompt).toContain("Do not edit source files or documentation.");
    expect(finalReviewPrompt).toContain("Do not return `questions` in this final review.");
    expect(adapter.calls.map((call) => call.command)).toEqual([
      "mock-implementer",
      expect.any(String),
      "mock-reviewer",
      "mock-implementer",
      "mock-reviewer",
      expect.any(String),
    ]);
  }, 30000);

  it("runs question loop then starts existing fix cycle after final Changes Requested", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredActionableChanges },
      {
        stdout: "fixed",
        mutate: () => gitAdapter.setState({
          statusPorcelain: " M tracked.txt",
          unstagedDiffStat: " tracked.txt | 2 +-",
          unstagedDiff: "diff --git a/tracked.txt b/tracked.txt\n-fixed\n+fixed\n",
          unstagedDiffNumstat: "1\t1\ttracked.txt",
        }),
      },
      { stdout: "revalidation passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.questionCycle).toBe(1);
    expect(run.state.fixCycleCount).toBe(1);
    expect(adapter.calls.filter((call) => call.command === "mock-implementer")).toHaveLength(3);
  }, 30000);

  it("blocks when final Reviewer asks questions again", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredQuestionsReview },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer asked questions after the allowed clarification round");
    expect(run.state.fixCycleCount || 0).toBe(0);
  }, 30000);

  it("does not spawn answer stage for invalid questions", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const invalidQuestions = structuredQuestionsReview.replace('"questions": [', '"blockingFindings": [{ "id": "P1", "severity": "P1", "summary": "Issue", "recommendation": "Fix" }],\n  "questions": [');
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: invalidQuestions },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("does not spawn final review for invalid answers", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const invalidAnswers = structuredAnswers.replace('"questionId": "Q1"', '"questionId": "Q2"');
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: invalidAnswers },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Implementer answers were invalid");
    expect(adapter.calls).toHaveLength(4);
  }, 30000);

  it("blocks when answer stage modifies repository files", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers, mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "changed by answer\n") },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Answer stage modified repository files");
  }, 30000);

  it("blocks when answer stage commits repository changes", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    git(cwd, ["checkout", "-q", "-b", "feature"]);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      {
        stdout: structuredAnswers,
        mutate: (repo) => {
          fs.writeFileSync(path.join(repo, "tracked.txt"), "changed and committed by answer\n");
          git(repo, ["add", "tracked.txt"]);
          git(repo, ["commit", "-q", "-m", "answer stage commit"]);
        },
      },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Answer stage modified repository files");
  }, 30000);

  it("stops conservatively on answer timeout", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("answer-questions execution failed");
  }, 30000);

  it("stops conservatively on final-review timeout", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Timed Out");
  }, 30000);

  it("resumes from answer-questions without repeating implementation or review", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: structuredAnswers },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      questionCycle: 1,
      orchestration: {
        currentStage: "answer-questions",
        maxFixCycles: 2,
        maxQuestionCycles: 1,
        latestReviewPath: ".agent-workflow/runs/x/review.md",
        latestReviewOutput: structuredQuestionsReview,
        latestReviewerQuestions: [
          {
            id: "Q1",
            question: "Which validation result covers timeout behavior?",
            reason: "The review artifact does not show the timeout evidence.",
          },
        ],
        latestReviewerQuestionPath: ".agent-workflow/runs/x/questions.json",
      },
      latestReviewerQuestions: [
        {
          id: "Q1",
          question: "Which validation result covers timeout behavior?",
          reason: "The review artifact does not show the timeout evidence.",
        },
      ],
    });

    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", "mock-reviewer", expect.any(String)]);
  }, 30000);

  it("resumes from final-review without duplicating completed answer stage", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      questionCycle: 1,
      orchestration: {
        currentStage: "final-review",
        maxFixCycles: 2,
        maxQuestionCycles: 1,
        latestReviewPath: ".agent-workflow/runs/x/review.md",
        latestReviewOutput: structuredQuestionsReview,
        latestReviewerQuestions: [
          {
            id: "Q1",
            question: "Which validation result covers timeout behavior?",
            reason: "The review artifact does not show the timeout evidence.",
          },
        ],
        latestImplementerAnswers: {
          schemaVersion: 1,
          answers: [
            { questionId: "Q1", answer: "Covered by orchestrateCommand.test.ts." },
          ],
        },
        latestImplementerAnswerOutput: structuredAnswers,
        latestImplementerAnswerPath: ".agent-workflow/runs/x/answers.md",
      },
    });

    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-reviewer", expect.any(String)]);
  }, 30000);

  it("supports role-swapped Implementer and Reviewer through a question loop", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      stageAgents: { implement: "claude", review: "codex" },
      agentRunners: {
        claude: { identity: "Implementer (Claude CLI)", command: "mock-claude", args: ["-p", "{{prompt}}"], inputMode: "argument" },
        codex: { identity: "Reviewer (Codex CLI)", command: "mock-codex", args: [], inputMode: "stdin" },
      },
    });

    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual([
      "mock-claude",
      expect.any(String),
      "mock-codex",
      "mock-claude",
      "mock-codex",
      expect.any(String),
    ]);
  }, 30000);

  it("uses structured blocking findings in the fix prompt when available", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });
    const fixPrompt = adapter.calls.find((call) => call.command === "mock-implementer" && call.input?.includes("Workflow stage: `fix`"))?.input || "";

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.latestStructuredReviewStatus).toBe("valid");
    expect(run.state.latestStructuredReviewPath).toMatch(/structured-review\.json$/);
    expect(run.state.orchestration.latestStructuredReviewStatus).toBe("valid");
    expect(fixPrompt).toContain("Finding P1-001:");
    expect(fixPrompt).toContain("Severity: P1");
    expect(fixPrompt).toContain("Summary: value is stale");
    expect(fixPrompt).toContain("Reason: behavior remains wrong");
    expect(fixPrompt).toContain("Recommended correction: update the value");
    expect(fixPrompt).toContain("## Previous Review Artifact");
  }, 30000);

  it("records initial structured findings as new lifecycle history", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.findingHistory).toHaveLength(1);
    expect(run.state.findingHistory[0].findingId).toBe("P1-001");
    expect(run.state.findingHistory[0].currentStatus).toBe("resolved");
    expect(run.state.latestFindingLifecycleStatus).toBe("valid");
    expect(run.state.latestFindingLifecyclePath).toMatch(/finding-lifecycle\.json$/);
  }, 30000);

  it("starts the next fix cycle for still-open lifecycle findings", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredStillOpenChanges },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 1 });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Maximum fix cycles reached");
    expect(run.state.findingHistory[0].currentStatus).toBe("still_open");
    expect(run.state.orchestration.latestFindings[0].id).toBe("P1-001");
  }, 30000);

  it("targets only new active blockers after resolving old findings", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredResolvedPlusNew },
      { stdout: "fixed again", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed twice\n") },
      { stdout: "revalidation passed" },
      { stdout: lifecycleReview("approved", [], [
        { findingId: "P2-001", status: "resolved", explanation: "The new validation gap was fixed." },
      ]) },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });
    const secondFixPrompt = adapter.calls.filter((call) => call.command === "mock-implementer" && call.input?.includes("Workflow stage: `fix`"))[1]?.input || "";

    expect(run.decision).toBe("Ready for human merge decision");
    expect(secondFixPrompt).toContain("Finding P2-001:");
    expect(secondFixPrompt).not.toContain("Finding P1-001:");
  }, 30000);

  it("blocks invalid lifecycle data before another fix cycle", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredActionableChanges },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toContain("Finding lifecycle invalid");
    expect(run.state.fixCycleCount).toBe(1);
  }, 30000);

  it("blocks Markdown-only re-review when previous structured findings exist", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: approvedReview },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toContain("Valid structured lifecycle data is required");
  }, 30000);

  it("applies lifecycle only to final review after re-review questions", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.questionCycle).toBe(1);
    expect(run.state.reviewSequence).toBe(2);
    expect(run.state.findingHistory[0].currentStatus).toBe("resolved");
  }, 30000);

  it("preserves fully resolved history when a resumed re-review introduces a new finding", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const f2 = {
      id: "P2-001",
      severity: "P2",
      filePath: "tracked.txt",
      location: "line 2",
      summary: "new validation gap",
      reason: "a later re-review found a new issue",
      recommendation: "add the missing validation",
    };
    const adapter = createSequenceAdapter([
      { stdout: lifecycleReview("changes_requested", [f2], [
        { findingId: "P2-001", status: "new", explanation: "This issue is new after earlier findings resolved." },
      ]) },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed new finding\n") },
      { stdout: "revalidation passed" },
      { stdout: lifecycleReview("approved", [], [
        { findingId: "P2-001", status: "resolved", explanation: "The new finding was fixed." },
      ]) },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      reviewSequence: 2,
      findingHistory: [
        {
          findingId: "F1",
          kind: "blocking",
          severity: "P1",
          summary: "old issue",
          recommendation: "fix old issue",
          firstSeenReviewSequence: 1,
          lastSeenReviewSequence: 2,
          currentStatus: "resolved",
          resolvedReviewSequence: 2,
          finding: {
            id: "F1",
            severity: "P1",
            summary: "old issue",
            recommendation: "fix old issue",
          },
        },
      ],
      orchestration: { currentStage: "re-review", maxFixCycles: 2, maxQuestionCycles: 1 },
    });

    const run = await runOrchestration(state, { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.findingHistory).toHaveLength(2);
    expect(run.state.findingHistory[0].findingId).toBe("F1");
    expect(run.state.findingHistory[0].currentStatus).toBe("resolved");
    expect(run.state.findingHistory[0].firstSeenReviewSequence).toBe(1);
    expect(run.state.findingHistory[0].resolvedReviewSequence).toBe(2);
    expect(run.state.findingHistory[1].findingId).toBe("P2-001");
    expect(run.state.findingHistory[1].currentStatus).toBe("resolved");
  }, 30000);

  it("accepts fix cycles that change content without changing diff stats", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "wrong\n") },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "right\n") },
      { stdout: "revalidation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.fixCycleCount).toBe(1);
    expect(fs.readFileSync(path.join(cwd, "tracked.txt"), "utf8")).toBe("right\n");
  }, 30000);

  it("stops when maximum fix cycles are exhausted", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed once\n") },
      { stdout: "revalidation passed" },
      { stdout: actionableChanges },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 1 });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Maximum fix cycles reached");
    expect(run.state.orchestration.currentStage).toBe("blocked");
  }, 30000);

  it("does not run Reviewer when validation fails", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stderr: "validation failed", exitCode: 1 },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toContain("validate failed");
    expect(adapter.calls.map((call) => call.command)).not.toContain("mock-reviewer");
  }, 30000);

  it("does not start a fix cycle for Reviewer Unknown", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "looks okay maybe" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls.filter((call) => call.command === "mock-implementer")).toHaveLength(1);
  }, 30000);

  it("stops conservatively on Reviewer timeout", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview, timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Timed Out");
  }, 30000);

  it("stops conservatively on Implementer timeout and never reviews", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("implement execution failed");
    expect(adapter.calls).toHaveLength(1);
  }, 30000);

  it("does not start a blind fix for non-actionable Changes Requested", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "# Review Decision: Changes Requested\n\n## Blocking Findings\nPlease improve it." },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer requested changes without actionable findings");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("does not start a blind fix when structured Changes Requested has no blocking findings", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const structuredNoBlockingChanges = [
      "# Review Decision: Changes Requested",
      "",
      "## Blocking Findings",
      "(none)",
      "",
      "## Structured Review",
      "",
      "```json",
      JSON.stringify({
        schemaVersion: 1,
        decision: "changes_requested",
        summary: "No actionable blocking findings were supplied.",
        blockingFindings: [],
        nonBlockingFindings: [
          { id: "P3-001", severity: "P3", summary: "Consider docs." },
        ],
        questions: [],
      }, null, 2),
      "```",
    ].join("\n");
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredNoBlockingChanges },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("blocks invalid structured review data instead of reaching final verification", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "# Review Decision: Approved\n\n## Structured Review\n\n```json\n{ nope\n```" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(run.state.latestStructuredReviewStatus).toBe("invalid");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("blocks conflicting Markdown and structured decisions", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges.replace("# Review Decision: Changes Requested", "# Review Decision: Approved") },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(run.state.latestStructuredReviewStatus).toBe("invalid");
  }, 30000);

  it("classifies a clean single structured review in stdout as valid even when stderr echoes duplicate example JSON blocks", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
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
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredApprovedReview, stderr: noisyTranscriptEcho },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.latestStructuredReviewStatus).toBe("valid");
  }, 30000);

  it("blocks no-change fix cycles", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      { stdout: "claimed fixed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Fix cycle produced no repository diff");
  }, 30000);

  it("rejects unsafe runner configs before spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([{ stdout: "should not run" }], cwd);
    const state = createState({
      agentRunners: {
        implementer: { identity: "Unsafe", command: "gh", args: ["pr", "merge"], inputMode: "stdin" },
        reviewer: { identity: "Mock Reviewer", command: "mock-reviewer", args: [], inputMode: "stdin" },
      },
    });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating");
    expect(adapter.run).not.toHaveBeenCalled();
  }, 30000);

  it("rejects unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["git push origin main"] });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects quote-split unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["g''it push origin main"] });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects shell-wrapped unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["sh -c \"git push origin main\""] });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("runs npm validation commands through the real adapter on Windows-compatible argv", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();

    const validation = await runValidationCommands(createState({ validationCommands: ["npm --version"] }), "validate", {
      cwd,
      gitAdapter,
      timeoutMs: 30000,
    });

    expect(validation.passed).toBe(true);
    expect(validation.records[0]?.status).toBe("passed");
    expect(validation.records[0]?.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  }, 30000);

  it("resumes from review without repeating implementation or validation", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      orchestration: { currentStage: "review", maxFixCycles: 2 },
      validationRuns: [{ stage: "validate", status: "passed", path: ".agent-workflow/runs/x/validation.md" }],
    });

    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-reviewer", expect.any(String)]);
  }, 30000);

  it("supports role-swapped Implementer and Reviewer", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      stageAgents: { implement: "claude", review: "codex" },
      agentRunners: {
        claude: { identity: "Implementer (Claude CLI)", command: "mock-claude", args: ["-p", "{{prompt}}"], inputMode: "argument" },
        codex: { identity: "Reviewer (Codex CLI)", command: "mock-codex", args: [], inputMode: "stdin" },
      },
    });

    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.implementerIdentity).toBe("Implementer (Claude CLI)");
    expect(run.state.orchestration.reviewerIdentity).toBe("Reviewer (Codex CLI)");
    expect(adapter.calls[0].command).toBe("mock-claude");
    expect(adapter.calls[2].command).toBe("mock-codex");
  }, 30000);

  it("loads BOM state and persists orchestration state", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `\uFEFF${JSON.stringify(createState())}`, "utf8");
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestrationAndPersist(statePath, { cwd, gitAdapter, processAdapter: adapter });
    const persisted = readState(statePath);

    expect(run.decision).toBe("Ready for human merge decision");
    expect(persisted.orchestration.currentStage).toBe("human-merge-decision");
  }, 30000);
});

function createRoleSelectionState(overrides: Record<string, unknown> = {}) {
  return createState({
    agentRunners: {
      codex: { identity: "Codex Mock", command: "mock-codex", args: [], inputMode: "stdin", timeoutMs: 1000 },
      claude: { identity: "Claude Mock", command: "mock-claude", args: ["-p", "{{prompt}}"], inputMode: "argument", timeoutMs: 1000 },
    },
    ...overrides,
  });
}

describe("runtime role selection (Spec 053)", () => {
  it("dry-run resolves --implementer claude to Claude Implementer / Codex Reviewer and spawns nothing", () => {
    const cwd = createTempDir();
    const state = createRoleSelectionState();
    const preview = previewOrchestration(state, { cwd, implementerAgentId: "claude", gitAdapter: createFakeGitAdapter() });

    expect(preview.willSpawn).toBe(false);
    expect(preview.roleSource).toBe("cli-override");
    expect(preview.implementer).toMatchObject({ id: "claude", identity: "Claude Mock" });
    expect(preview.reviewer).toMatchObject({ id: "codex", identity: "Codex Mock" });
    expect(state).not.toHaveProperty("orchestration");
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("dry-run resolves --implementer codex to Codex Implementer / Claude Reviewer and spawns nothing", () => {
    const cwd = createTempDir();
    const state = createRoleSelectionState();
    const preview = previewOrchestration(state, { cwd, implementerAgentId: "codex", gitAdapter: createFakeGitAdapter() });

    expect(preview.willSpawn).toBe(false);
    expect(preview.roleSource).toBe("cli-override");
    expect(preview.implementer).toMatchObject({ id: "codex", identity: "Codex Mock" });
    expect(preview.reviewer).toMatchObject({ id: "claude", identity: "Claude Mock" });
  });

  it("dry-run rejects an unknown --implementer before any spawn", () => {
    const cwd = createTempDir();
    expect(() => previewOrchestration(createRoleSelectionState(), { cwd, implementerAgentId: "unknown-agent", gitAdapter: createFakeGitAdapter() }))
      .toThrow("Requested implementer 'unknown-agent' is not configured.");
  });

  it("real orchestration sends the implementation prompt to the resolved Implementer and the review prompt to the resolved Reviewer", async () => {
    const cwd = createTempDir();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: adapter, implementerAgentId: "claude", gitAdapter: createFakeGitAdapter() });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.implementerId).toBe("claude");
    expect(run.state.orchestration.reviewerId).toBe("codex");
    expect(run.state.orchestration.resolvedImplementerId).toBe("claude");
    expect(run.state.orchestration.resolvedReviewerId).toBe("codex");
    expect(run.state.orchestration.roleResolutionSource).toBe("cli-override");
    expect(run.state.latestResolvedRoles).toEqual({ implementer: "claude", reviewer: "codex" });
    expect(run.state.latestRoleResolutionSource).toBe("cli-override");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-claude", expect.any(String), "mock-codex", expect.any(String)]);
  }, 30000);

  it("routes Reviewer questions to the resolved Implementer and the answers back to the resolved Reviewer", async () => {
    const cwd = createTempDir();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: adapter, implementerAgentId: "claude", maxFixCycles: 2, gitAdapter: createFakeGitAdapter() });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual([
      "mock-claude", expect.any(String), "mock-codex", "mock-claude", "mock-codex", expect.any(String),
    ]);
  }, 30000);

  it("targets the resolved Implementer for the fix stage after Changes Requested, with roles reversed", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed\n") },
      { stdout: "revalidation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: adapter, implementerAgentId: "codex", maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual([
      "mock-codex", expect.any(String), "mock-claude", "mock-codex", expect.any(String), "mock-claude", expect.any(String),
    ]);
  }, 30000);

  it("resumes a pinned in-progress run with the originally resolved roles when no --implementer is supplied", async () => {
    const cwd = createTempDir();
    const pinnedState = createRoleSelectionState({
      orchestration: {
        currentStage: "review",
        startedAt: "2026-07-25T00:00:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
        maxFixCycles: 2,
      },
      validationRuns: [{ stage: "validate", status: "passed", path: ".agent-workflow/runs/x/validation.md" }],
    });
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(pinnedState, { cwd, processAdapter: adapter, gitAdapter: createFakeGitAdapter() });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls[0].command).toBe("mock-codex");
    expect(run.state.orchestration.resolvedImplementerId).toBe("claude");
    expect(run.state.orchestration.resolvedReviewerId).toBe("codex");
  }, 30000);

  it("accepts a matching --implementer on resume", async () => {
    const cwd = createTempDir();
    const pinnedState = createRoleSelectionState({
      orchestration: {
        currentStage: "review",
        startedAt: "2026-07-25T00:00:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
        maxFixCycles: 2,
      },
    });
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(pinnedState, { cwd, processAdapter: adapter, implementerAgentId: "claude", gitAdapter: createFakeGitAdapter() });

    expect(run.decision).toBe("Ready for human merge decision");
  }, 30000);

  it("rejects a conflicting --implementer on resume before any spawn and leaves persisted roles unchanged", async () => {
    const cwd = createTempDir();
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    const pinnedState = createRoleSelectionState({
      orchestration: {
        currentStage: "review",
        startedAt: "2026-07-25T00:00:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
        maxFixCycles: 2,
      },
    });
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(pinnedState), "utf8");
    const adapter = createSequenceAdapter([{ stdout: "should not run" }], cwd);

    await expect(runOrchestrationAndPersist(statePath, { cwd, processAdapter: adapter, implementerAgentId: "codex" }))
      .rejects.toThrow("Rejected before spawn because runtime roles are already fixed for this run.");

    expect(adapter.run).not.toHaveBeenCalled();
    const persisted = readState(statePath);
    expect(persisted.orchestration.resolvedImplementerId).toBe("claude");
    expect(persisted.orchestration.resolvedReviewerId).toBe("codex");
  }, 30000);

  it("does not leak a completed run's resolved roles into a new run on a fresh state file", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const firstAdapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const firstRun = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: firstAdapter, implementerAgentId: "claude", gitAdapter });
    expect(firstRun.decision).toBe("Ready for human merge decision");

    const secondAdapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const secondRun = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: secondAdapter, implementerAgentId: "codex", gitAdapter });

    expect(secondRun.state.orchestration.resolvedImplementerId).toBe("codex");
    expect(secondRun.state.orchestration.resolvedReviewerId).toBe("claude");
  }, 30000);
});

describe("review finding extraction", () => {
  it("extracts only details that are present", () => {
    const findings = extractReviewFindings(actionableChanges);
    const firstFinding = findings[0];

    expect(findings).toHaveLength(1);
    expect(firstFinding?.filePath).toBe("tracked.txt");
    expect(firstFinding?.location).toBe("line 1");
    expect(firstFinding?.problem).toBe("value is stale");
    expect(firstFinding?.recommendation).toBe("update the value");
  });

  it("does not invent findings from vague text", () => {
    expect(extractReviewFindings("Please improve it.")).toEqual([]);
  });
});

describe("orchestrate run summaries", () => {
  it("reports correct question/fix cycle counts and a resolved finding after Questions -> Changes Requested -> fix -> Approved", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    const summary = run.summary!;
    expect(summary.review.questionCycles).toBe(1);
    expect(summary.review.fixCycles).toBe(1);
    expect(summary.review.reviewAttempts).toBe(3);
    expect(summary.findings.opened).toBe(1);
    expect(summary.findings.resolved).toBe(1);
    expect(summary.findings.remainingBlocking).toBe(0);
    expect(summary.findings.items[0]).toMatchObject({ findingId: "P1-001", status: "resolved" });
    expect(summary.humanGate.ready).toBe(true);
  }, 30000);

  it("writes agreeing run-summary.json/run-summary.md for a clean approved run", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.summaryPaths).not.toBeNull();
    expect(run.summaryWarning).toBeNull();
    const jsonPath = path.join(cwd, run.summaryPaths!.json!);
    const markdownPath = path.join(cwd, run.summaryPaths!.markdown!);
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(markdownPath)).toBe(true);

    const persistedSummary = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    expect(persistedSummary.run.status).toBe("awaiting-human-decision");
    expect(persistedSummary.humanGate.ready).toBe(true);
    expect(persistedSummary.review.finalDecision).toBe("Approved");
    expect(persistedSummary.validation.status).toBe("passed");
    expect(persistedSummary.roles.implementer.agentId).toBe("implementer");
    expect(persistedSummary.roles.reviewer.agentId).toBe("reviewer");

    const markdown = fs.readFileSync(markdownPath, "utf8");
    expect(markdown).toContain("Awaiting human merge decision");
    expect(markdown).toContain("Ready for human merge decision.");
    expect(markdown.endsWith("\n")).toBe(true);
    expect(JSON.parse(fs.readFileSync(jsonPath, "utf8")).schemaVersion).toBe(1);

    expect(run.summary).toEqual(persistedSummary);
  }, 30000);

  it("writes a summary reporting readiness=false when validation fails", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation failed", exitCode: 1 },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    const persistedSummary = JSON.parse(fs.readFileSync(path.join(cwd, run.summaryPaths!.json!), "utf8"));
    expect(persistedSummary.run.status).toBe("failed");
    expect(persistedSummary.run.stopReason).toBe("validation-failed");
    expect(persistedSummary.humanGate.ready).toBe(false);
    expect(persistedSummary.review.finalDecision).not.toBe("Approved");
  }, 30000);

  it("writes a partial timed-out summary with no approval claim when the Reviewer times out", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview, timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Timed Out");
    const persistedSummary = JSON.parse(fs.readFileSync(path.join(cwd, run.summaryPaths!.json!), "utf8"));
    expect(persistedSummary.run.status).toBe("timed-out");
    expect(persistedSummary.run.stopReason).toBe("timeout");
    expect(persistedSummary.humanGate.ready).toBe(false);
    expect(persistedSummary.review.finalDecision).not.toBe("Approved");
    expect(persistedSummary.stageTimeline.map((entry: { stage: string }) => entry.stage)).toEqual(["implement", "validate", "review"]);
    const reviewEntry = persistedSummary.stageTimeline.find((entry: { stage: string }) => entry.stage === "review");
    expect(reviewEntry.result).toBe("Timed Out");
  }, 30000);

  it("does not write any summary artifact during dry-run, and previews the paths it would write", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const preview = previewOrchestration(createState(), { cwd, gitAdapter });

    expect(preview.summaryPaths.willWrite).toBe(false);
    expect(preview.summaryPaths.json).toContain("run-summary.json");
    expect(preview.summaryPaths.markdown).toContain("run-summary.md");
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("does not duplicate stage-timeline entries when resuming from review", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const resumedState = createState({
      orchestration: { currentStage: "review", maxFixCycles: 2, startedAt: "2026-07-26T00:00:00.000Z" },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md" }],
    });

    const run = await runOrchestration(resumedState, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestrationRuns.filter((r: { stage: string }) => r.stage === "implement")).toHaveLength(1);
    expect(run.state.validationRuns.filter((r: { stage: string }) => r.stage === "validate")).toHaveLength(1);
    expect(run.summary!.stageTimeline.map((entry: { stage: string }) => entry.stage)).toEqual([
      "implement", "validate", "review", "final-verification",
    ]);
  }, 30000);

  it("reports unchanged roles and source after a resumed --implementer run", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const resumedState = createRoleSelectionState({
      orchestration: {
        currentStage: "review",
        maxFixCycles: 2,
        startedAt: "2026-07-26T00:00:00.000Z",
        resolvedImplementerId: "claude",
        resolvedReviewerId: "codex",
        roleResolutionSource: "cli-override",
      },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md" }],
    });

    const run = await runOrchestration(resumedState, { cwd, gitAdapter, processAdapter: adapter });

    expect(run.summary!.roles).toEqual({
      implementer: { agentId: "claude", displayName: expect.any(String) },
      reviewer: { agentId: "codex", displayName: expect.any(String) },
      source: "cli-override",
    });
  }, 30000);
});

describe("focused validation review loop (Spec 055)", () => {
  function focusedFinalFullState(overrides: Record<string, unknown> = {}) {
    return createState({
      validationPolicy: {
        strategy: "focused-final-full",
        focusedCommands: ["mock focused"],
        fullCommands: ["mock full"],
      },
      ...overrides,
    });
  }

  it("Smoke A: multiple fix cycles run only focused validation; final-verification runs full validation exactly once", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation 1 passed" },
      { stdout: structuredActionableChanges },
      { stdout: "fixed 1", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fix1\n") },
      { stdout: "focused validation 2 passed" },
      { stdout: structuredStillOpenChanges },
      { stdout: "fixed 2", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fix2\n") },
      { stdout: "focused validation 3 passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "full validation passed" },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter, maxFixCycles: 3 });

    expect(run.decision).toBe("Ready for human merge decision");
    const summary = run.summary!;
    expect(summary.validation.focused.attempts).toBe(3);
    expect(summary.validation.focused.status).toBe("passed");
    expect(summary.validation.full.attempts).toBe(1);
    expect(summary.validation.full.status).toBe("passed");
    expect(summary.validation.status).toBe("passed");
    expect(summary.review.fixCycles).toBe(2);
    expect(summary.humanGate.ready).toBe(true);
  }, 30000);

  it("Smoke B: full validation failure after Approved does not become ready; it routes back to fix (not a hard block) and must pass focused validation + a fresh review before full validation runs again", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    // One continuous invocation: the loop only pauses at a terminal
    // (human-merge-decision/blocked) stage, so the fix -> revalidate ->
    // re-review -> final-verification recovery happens within this same run.
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "full validation failed", exitCode: 1 },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fix1\n") },
      { stdout: "focused validation passed again" },
      { stdout: structuredApprovedReview },
      { stdout: "full validation passed" },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.fullValidationFixCycleCount).toBe(1);
    // A full-validation-triggered fix must never consume the Reviewer's own
    // fix-cycle budget (spec.md FR-006, Architecture Decision 3).
    expect(run.state.fixCycleCount || 0).toBe(0);
    const summary = run.summary!;
    expect(summary.validation.full.attempts).toBe(2);
    expect(summary.validation.focused.attempts).toBe(2);
    expect(summary.humanGate.ready).toBe(true);
  }, 30000);

  it("Smoke B (ceiling): repeated full-validation failures hard-block once fullValidationFixCycleCount reaches maxFixCycles", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "full validation failed", exitCode: 1 },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fix1\n") },
      { stdout: "focused validation passed again" },
      { stdout: structuredApprovedReview },
      { stdout: "full validation failed again", exitCode: 1 },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter, maxFixCycles: 1 });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.currentStage).toBe("blocked");
    expect(run.reason).toMatch(/Maximum full-validation fix cycles reached/);
    expect(run.state.fixCycleCount || 0).toBe(0);
  }, 30000);

  it("full validation modifying the tracked tree is treated the same as a full-validation failure (hard-blocks immediately when no retry budget remains)", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation passed" },
      { stdout: structuredApprovedReview },
      {
        stdout: "full validation passed but modified the tree",
        exitCode: 0,
        mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "modified-by-validation\n"),
      },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter, maxFixCycles: 0 });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.currentStage).toBe("blocked");
    expect(run.reason).toMatch(/Maximum full-validation fix cycles reached/);
    expect(run.reason).toMatch(/modified the tracked working tree/);
    expect(run.summary!.humanGate.ready).toBe(false);
  }, 30000);

  it("does not reach human-merge-decision when final-verification passes but the Approved review's target cannot be verified (resumed run with a legacy, target-less review record)", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    // .agent-workflow/ is gitignored in the real repository (matching
    // AGENTS.md/README); replicate that here so this resume-directly-at-
    // final-verification scenario (where nothing has written to
    // .agent-workflow/ yet in this invocation) does not spuriously trip the
    // tree-modification check purely because final-verification's own first
    // artifact write creates a newly-untracked directory.
    fs.writeFileSync(path.join(cwd, ".gitignore"), ".agent-workflow/\n");
    git(cwd, ["add", "-A"]);
    git(cwd, ["commit", "-q", "-m", "ignore agent-workflow"]);
    const adapter = createSequenceAdapter([
      { stdout: "final validation passed" },
    ], cwd);

    // Simulates a resumed run where an older (pre-target-tracking) Approved
    // review record is already persisted, and only final-verification runs
    // fresh in this invocation. The tree-diff check alone would see no
    // change during final-verification's own execution and would otherwise
    // proceed straight to markHumanGate; isFinalValidationSatisfied must
    // still catch the missing review target and prevent this (Codex review
    // round 3, finding P1-001).
    const resumedState = focusedFinalFullState({
      orchestration: {
        currentStage: "final-verification",
        maxFixCycles: 0,
        startedAt: "2026-07-26T00:00:00.000Z",
      },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      reviewRuns: [{ stage: "review", outcome: "Approved", resultPath: "review.md" }],
    });

    const run = await runOrchestration(resumedState, { cwd, processAdapter: adapter, maxFixCycles: 0 });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.currentStage).toBe("blocked");
    expect(run.reason).toMatch(/Maximum full-validation fix cycles reached/);
    expect(run.reason).toMatch(/target-evidence-missing/);
    expect(run.summary!.humanGate.ready).toBe(false);
  }, 30000);

  it("Smoke D: full-every-cycle (explicit) reproduces the same stage/command behavior as the default", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const state = createState({ validationPolicy: { strategy: "full-every-cycle" } });
    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.validation.full.attempts).toBe(2);
    expect(run.summary!.validation.commands.every((command: { phase: string }) => command.phase === "full")).toBe(true);
  }, 30000);

  it("persists the effective validation strategy so a CLI-only override is never misreported by the run summary", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    // state.validationPolicy has no strategy at all -- only the CLI option
    // resolves focused-final-full for this invocation.
    const state = createState({ validationPolicy: { focusedCommands: ["mock focused"], fullCommands: ["mock full"] } });
    const run = await runOrchestration(state, {
      cwd,
      gitAdapter,
      processAdapter: adapter,
      maxFixCycles: 2,
      validationStrategy: "focused-final-full",
    });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.effectiveValidationStrategy).toBe("focused-final-full");
    expect(run.summary!.validation.strategy).toBe("focused-final-full");
  }, 30000);

  it("Smoke E: dry-run previews the strategy, both command lists, and the next phase without executing anything", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([{ stdout: "should not run" }], cwd);

    const preview = previewOrchestration(focusedFinalFullState(), { cwd, gitAdapter, processAdapter: adapter });

    expect(preview.validationPolicy).toEqual({
      strategy: "focused-final-full",
      focusedCommands: ["mock focused"],
      fullCommands: ["mock full"],
    });
    expect(preview.nextValidationPhase.phase).toBe("focused");
    expect(preview.willSpawn).toBe(false);
    expect(adapter.run).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("Smoke E: dry-run previews the full phase at final-verification regardless of strategy", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const preview = previewOrchestration(focusedFinalFullState({
      orchestration: { currentStage: "final-verification", startedAt: "2026-07-26T00:00:00.000Z" },
    }), { cwd, gitAdapter });
    expect(preview.nextValidationPhase.phase).toBe("full");
  });

  it("Smoke C: resume after the second focused-validation attempt preserves strategy, roles, and attempt history without duplication", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fix1\n") },
      { stdout: "focused validation 2 passed" },
      { stdout: structuredResolvedApproval },
      { stdout: "full validation passed" },
    ], cwd);

    const resumedState = focusedFinalFullState({
      orchestration: {
        currentStage: "review",
        maxFixCycles: 2,
        startedAt: "2026-07-26T00:00:00.000Z",
        implementerId: "implementer",
        reviewerId: "reviewer",
        nextValidationBatchId: 1,
      },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md", phase: "focused", batchId: 1 }],
    });

    const run = await runOrchestration(resumedState, { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    const summary = run.summary!;
    expect(summary.validation.focused.attempts).toBe(2);
    expect(summary.validation.full.attempts).toBe(1);
    // No duplicate stage-timeline entries for the pre-resume "validate" occurrence.
    const validateEntries = summary.stageTimeline.filter((entry: { stage: string }) => entry.stage === "validate");
    expect(validateEntries).toHaveLength(1);
  }, 30000);

  it("does not re-run validation when resuming a state already at a terminal stage", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([], cwd);
    const terminalState = focusedFinalFullState({
      orchestration: {
        currentStage: "human-merge-decision",
        terminalState: "human-merge-decision",
        startedAt: "2026-07-26T00:00:00.000Z",
      },
      validationRuns: [{ stage: "final-verification", status: "passed", path: "final.md", phase: "full", batchId: 1 }],
      reviewRuns: [{ stage: "review", outcome: "Approved", resultPath: "review.md" }],
    });

    const run = await runOrchestration(terminalState, { cwd, gitAdapter, processAdapter: adapter });

    expect(adapter.run).not.toHaveBeenCalled();
    expect(run.state.orchestration.currentStage).toBe("human-merge-decision");
  }, 30000);

  it("--skip-validation still makes readiness unreachable under focused-final-full, at both the summary and the top-level orchestration-decision/CLI-exit-code signal", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: structuredApprovedReview },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, gitAdapter, processAdapter: adapter, skipValidation: true, maxFixCycles: 2 });

    expect(run.summary!.validation.status).toBe("skipped");
    expect(run.summary!.humanGate.ready).toBe(false);
    // A skipped final-verification must not reach the human merge gate at the
    // orchestration-decision level either -- this is exactly what the CLI's
    // own exit-code check (`decision !== "Ready for human merge decision"`)
    // and `run` command's success condition key off, so these two signals
    // must never disagree about whether skipping permits readiness.
    expect(run.decision).not.toBe("Ready for human merge decision");
    expect(run.state.orchestration.currentStage).toBe("blocked");
    expect(run.reason).toMatch(/final-verification skipped via --skip-validation/);
  }, 30000);

  it("--force-full-validation elevates a validate/revalidate occurrence to full, tagged manual-request, without touching fixCycleCount", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([{ stdout: "full validation forced" }], cwd);
    const state = focusedFinalFullState();

    const result = await runValidationCommands(state, "validate", { cwd, gitAdapter, processAdapter: adapter, forceFullValidation: true });

    expect(result.passed).toBe(true);
    expect(result.phase).toBe("full");
    expect(result.records[0].phase).toBe("full");
    expect(result.records[0].triggerReason).toBe("manual-request");
    expect(result.records[0].command).toBe("mock full");
    expect(result.state.fixCycleCount || 0).toBe(0);
  });

  it("rejects an unsafe focused validation command before spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([{ stdout: "implemented" }], cwd);
    const state = focusedFinalFullState({
      validationPolicy: {
        strategy: "focused-final-full",
        focusedCommands: ["git push origin main"],
        fullCommands: ["mock full"],
      },
    });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects a later unsafe command in a multi-command list before ANY command in that list spawns, even a safe earlier one", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([{ stdout: "implemented" }], cwd);
    const state = focusedFinalFullState({
      validationPolicy: {
        strategy: "focused-final-full",
        focusedCommands: ["mock focused"],
        fullCommands: ["mock full", "git push origin main"],
      },
    });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter, forceFullValidation: true })).rejects.toThrow("Remote-mutating validation commands");
    // Only the implement stage spawned; neither "mock full" (the safe first
    // command) nor the unsafe second command ever reached adapter.run --
    // both are safety-checked before either spawns (Codex review round 4,
    // finding P1-001).
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects an unsafe full validation command before spawn", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "focused validation passed" },
      { stdout: structuredApprovedReview },
    ], cwd);
    const state = focusedFinalFullState({
      validationPolicy: {
        strategy: "focused-final-full",
        focusedCommands: ["mock focused"],
        fullCommands: ["git push origin main"],
      },
    });

    await expect(runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", "mock", "mock-reviewer"]);
  }, 30000);

  it("falls back to full validation at validate/revalidate when focused-final-full is selected with no focused commands configured", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "full validation ran as fallback" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const state = createState({ validationPolicy: { strategy: "focused-final-full" } });
    const run = await runOrchestration(state, { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.validationRuns[0].phase).toBe("full");
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.validation.full.attempts).toBe(2);
  }, 30000);

  it("legacy validationRuns records without a phase field remain valid and are treated as full", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const resumedState = createState({
      orchestration: {
        currentStage: "review",
        maxFixCycles: 2,
        startedAt: "2026-07-26T00:00:00.000Z",
      },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      // Legacy shape: no phase/triggerReason/target fields at all.
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md" }],
    });

    const run = await runOrchestration(resumedState, { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.validation.full.attempts).toBe(2);
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.humanGate.ready).toBe(true);
  }, 30000);
});

// --- Spec 056: review convergence, budgets, and performance smoke tests ------

function structuredReviewText({ decision, summary, blockingFindings = [], nonBlockingFindings = [], findingLifecycle, reviewCoverage }: {
  decision: "approved" | "changes_requested";
  summary: string;
  blockingFindings?: unknown[];
  nonBlockingFindings?: unknown[];
  findingLifecycle?: unknown[];
  reviewCoverage?: Record<string, unknown>;
}) {
  const heading = decision === "approved" ? "Approved" : "Changes Requested";
  const payload: Record<string, unknown> = {
    schemaVersion: 1,
    decision,
    summary,
    blockingFindings,
    nonBlockingFindings,
    questions: [],
  };
  if (findingLifecycle) payload.findingLifecycle = findingLifecycle;
  if (reviewCoverage) payload.reviewCoverage = reviewCoverage;
  return [
    `# Review Decision: ${heading}`,
    "",
    "## Blocking Findings",
    blockingFindings.length ? "- structured blockers supplied" : "(none)",
    "",
    "## Non-Blocking Improvements",
    nonBlockingFindings.length ? "- structured non-blocking notes supplied" : "(none)",
    "",
    "## Validation Performed",
    "mock",
    "",
    "## Final Recommendation",
    heading,
    "",
    "## Structured Review",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
  ].join("\n");
}

describe("review convergence and budgets (Spec 056)", () => {
  const emptyCompleteCoverage = { changedFilesTotal: 0, changedFilesInspected: 0, highRiskFilesTotal: 0, highRiskFilesInspected: 0, checklistCompleted: true };
  const oneFileCompleteCoverage = { changedFilesTotal: 1, changedFilesInspected: 1, highRiskFilesTotal: 0, highRiskFilesInspected: 0, checklistCompleted: true };

  it("Smoke A: two-review convergence -- three blockers found comprehensively in round 1, one consolidated fix cycle, Approved with complete coverage in round 2", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const round1 = structuredReviewText({
      decision: "changes_requested",
      summary: "Three blocking issues found in one comprehensive pass.",
      blockingFindings: [
        { id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue A", reason: "r", recommendation: "fix A" },
        { id: "P1-002", severity: "P1", filePath: "b.js", location: "2", summary: "issue B", reason: "r", recommendation: "fix B" },
        { id: "P1-003", severity: "P1", filePath: "c.js", location: "3", summary: "issue C", reason: "r", recommendation: "fix C" },
      ],
      reviewCoverage: emptyCompleteCoverage,
    });
    const round2 = structuredReviewText({
      decision: "approved",
      summary: "All three findings resolved; no new issues found in this comprehensive pass.",
      findingLifecycle: [
        { findingId: "P1-001", status: "resolved", explanation: "fixed" },
        { findingId: "P1-002", status: "resolved", explanation: "fixed" },
        { findingId: "P1-003", status: "resolved", explanation: "fixed" },
      ],
      reviewCoverage: oneFileCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: round1 },
      { stdout: "fixed all three", mutate: () => gitAdapter.setState({ statusPorcelain: "M a.js" }) },
      { stdout: "revalidation passed" },
      { stdout: round2 },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.review.reviewAttempts).toBe(2);
    expect(run.summary!.reviewConvergence.automaticFixCycles).toBe(1);
    expect(run.summary!.reviewConvergence.firstReviewBlockingFindings).toBe(3);
    expect(run.summary!.reviewConvergence.newBlockingFindingsAfterFirstReview).toBe(0);
    expect(run.summary!.reviewConvergence.status).toBe("converged");
    expect(run.summary!.humanGate.ready).toBe(true);
  }, 30000);

  it("Smoke B: Reviewer reports incomplete coverage; the incomplete-review retry budget is consumed, not the full review-attempt budget, and findings are preserved for the retry", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const incompleteReview = structuredReviewText({
      decision: "changes_requested",
      summary: "One issue found, but coverage was not completed.",
      blockingFindings: [
        { id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue A", reason: "r", recommendation: "fix A" },
      ],
      reviewCoverage: { changedFilesTotal: 5, changedFilesInspected: 1, highRiskFilesTotal: 1, highRiskFilesInspected: 0, checklistCompleted: false, stoppedEarly: true },
    });
    const retryStillIncomplete = structuredReviewText({
      decision: "changes_requested",
      summary: "Same finding reported again; still incomplete.",
      blockingFindings: [
        { id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue A", reason: "r", recommendation: "fix A" },
      ],
      findingLifecycle: [{ findingId: "P1-001", status: "still_open", explanation: "still present" }],
      reviewCoverage: { changedFilesTotal: 5, changedFilesInspected: 2, highRiskFilesTotal: 1, highRiskFilesInspected: 0, checklistCompleted: false, stoppedEarly: true },
    });
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: incompleteReview },
      { stdout: retryStillIncomplete },
    ], cwd);

    const run = await runOrchestration(createState(), {
      cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2, reviewBudget: { maxIncompleteReviewRetries: 1 },
    });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.reason).toMatch(/Incomplete review retry budget exhausted/);
    expect(run.state.orchestration.incompleteReviewRetries).toBe(1);
    expect(run.state.orchestration.stopReason).toBe("review-convergence-failed");
    expect(run.summary!.humanGate.ready).toBe(false);
    // No fix cycle was ever started from the incomplete review alone.
    expect(run.state.fixCycleCount || 0).toBe(0);
    // Regression for Codex Spec 056 review round 3, P1-001: two incomplete
    // review attempts must not advance the budget-relevant
    // orchestration.reviewAttempts counter at all -- only
    // incompleteReviewRetries. (run.summary.review.reviewAttempts is a
    // separate, purely descriptive count of total Reviewer executions --
    // reviewRuns.length -- and legitimately stays 2; it is not the budget
    // counter this fix targets.)
    expect(run.state.orchestration.reviewAttempts || 0).toBe(0);
    expect(run.summary!.review.reviewAttempts).toBe(2);
    // The raw state field and the run-summary's derived field must never
    // disagree (Spec 055's "two signals that can never disagree" invariant).
    expect(run.summary!.run.stopReason).toBe(run.state.orchestration.stopReason);
    // Regression for Codex Spec 056 review round 3, P2-001: incomplete-review
    // budget exhaustion must also report as budget-exhausted convergence.
    expect(run.summary!.reviewConvergence.status).toBe("budget-exhausted");
  }, 30000);

  it("preserves reviewAttempts and incompleteReviewRetries independently across a resume, and a subsequent complete review advances only reviewAttempts (regression for Codex Spec 056 review round 3, P1-001)", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const approved = structuredReviewText({
      decision: "approved",
      summary: "All clear.",
      reviewCoverage: emptyCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: approved },
      { stdout: "final validation passed" },
    ], cwd);

    // Simulates a paused run with two prior complete review attempts and one
    // prior incomplete-review retry already recorded, resuming directly at
    // "review".
    const pausedState = createState({
      reviewSequence: 2,
      fixCycleCount: 0,
      orchestration: {
        currentStage: "review",
        maxFixCycles: 2,
        startedAt: "2026-07-26T00:00:00.000Z",
        reviewAttempts: 2,
        incompleteReviewRetries: 1,
      },
    });

    const run = await runOrchestration(pausedState, { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    // The resumed counters are preserved (not reset), and the new complete
    // review attempt advances only reviewAttempts -- incompleteReviewRetries
    // is untouched since this attempt was not incomplete.
    expect(run.state.orchestration.reviewAttempts).toBe(3);
    expect(run.state.orchestration.incompleteReviewRetries).toBe(1);
  }, 30000);

  it("Smoke D: review-attempt budget exhaustion stops safely -- never ready, findings preserved, stable stop reason", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const round1 = structuredReviewText({
      decision: "changes_requested",
      summary: "One blocking issue.",
      blockingFindings: [{ id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue", reason: "r", recommendation: "fix" }],
      reviewCoverage: emptyCompleteCoverage,
    });
    const round2 = structuredReviewText({
      decision: "changes_requested",
      summary: "Still not fixed.",
      blockingFindings: [{ id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue", reason: "r", recommendation: "fix" }],
      findingLifecycle: [{ findingId: "P1-001", status: "still_open", explanation: "not fixed" }],
      reviewCoverage: oneFileCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: round1 },
      { stdout: "fix attempt 1", mutate: () => gitAdapter.setState({ statusPorcelain: "M a.js" }) },
      { stdout: "revalidation passed" },
      { stdout: round2 },
    ], cwd);

    const run = await runOrchestration(createState(), {
      cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 5, reviewBudget: { maxReviewAttempts: 2 },
    });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.reason).toMatch(/Review convergence budget exhausted/);
    expect(run.state.orchestration.stopReason).toBe("review-convergence-failed");
    expect(run.summary!.humanGate.ready).toBe(false);
    expect((run.state.orchestration.activeBlockingFindings || []).length).toBeGreaterThan(0);
    // The raw state field and the run-summary's derived field must never
    // disagree (Spec 055's "two signals that can never disagree" invariant).
    expect(run.summary!.run.stopReason).toBe(run.state.orchestration.stopReason);
  }, 30000);

  it("Smoke C: a genuinely new blocker discovered in round 2 (after round 1's two blockers were fixed) is not converged, and a third review is required", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const round1 = structuredReviewText({
      decision: "changes_requested",
      summary: "Two blocking issues found.",
      blockingFindings: [
        { id: "P1-001", severity: "P1", filePath: "a.js", location: "1", summary: "issue A", reason: "r", recommendation: "fix A" },
        { id: "P1-002", severity: "P1", filePath: "b.js", location: "2", summary: "issue B", reason: "r", recommendation: "fix B" },
      ],
      reviewCoverage: emptyCompleteCoverage,
    });
    const round2 = structuredReviewText({
      decision: "changes_requested",
      summary: "Both original issues resolved, but a new issue was found during this comprehensive pass.",
      blockingFindings: [
        { id: "P2-005", severity: "P1", filePath: "c.js", location: "3", summary: "issue C (newly discovered)", reason: "r", recommendation: "fix C" },
      ],
      findingLifecycle: [
        { findingId: "P1-001", status: "resolved", explanation: "fixed" },
        { findingId: "P1-002", status: "resolved", explanation: "fixed" },
        { findingId: "P2-005", status: "new", explanation: "discovered after the first two were fixed" },
      ],
      reviewCoverage: oneFileCompleteCoverage,
    });
    const round3 = structuredReviewText({
      decision: "approved",
      summary: "The newly discovered issue is now resolved; no further issues found.",
      findingLifecycle: [{ findingId: "P2-005", status: "resolved", explanation: "fixed" }],
      reviewCoverage: oneFileCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: round1 },
      { stdout: "fixed both", mutate: () => gitAdapter.setState({ statusPorcelain: "M a.js" }) },
      { stdout: "revalidation 1 passed" },
      { stdout: round2 },
      { stdout: "fixed the new one", mutate: () => gitAdapter.setState({ statusPorcelain: "M a.js\nM c.js" }) },
      { stdout: "revalidation 2 passed" },
      { stdout: round3 },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 3 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.review.reviewAttempts).toBe(3);
    expect(run.summary!.reviewConvergence.firstReviewBlockingFindings).toBe(2);
    expect(run.summary!.reviewConvergence.newBlockingFindingsAfterFirstReview).toBe(1);
    expect(run.summary!.reviewConvergence.automaticFixCycles).toBe(2);
    expect(run.summary!.reviewConvergence.status).toBe("converged");
    // Normal-accounting counterpart to the Smoke B incomplete-review
    // regression above: three complete (non-incomplete) review attempts
    // must still advance the budget-relevant orchestration.reviewAttempts
    // counter normally, one per attempt.
    expect(run.state.orchestration.reviewAttempts).toBe(3);
  }, 30000);

  it("Smoke E: Approved with one P3 non-blocking note and complete coverage converges without an extra cycle", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const approvedWithP3 = structuredReviewText({
      decision: "approved",
      summary: "Approved with a minor documentation note.",
      nonBlockingFindings: [{ id: "P3-001", severity: "P3", summary: "Consider clarifying a comment.", recommendation: "Clarify the comment." }],
      reviewCoverage: emptyCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedWithP3 },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.reviewConvergence.status).toBe("converged");
    expect(run.summary!.review.reviewAttempts).toBe(1);
    expect(run.summary!.reviewConvergence.automaticFixCycles).toBe(0);
  }, 30000);

  it("Smoke G: resume after Review 1 + consolidated fix preparation preserves ledger, convergence metrics, and review-attempt count", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const reReviewApproved = structuredReviewText({
      decision: "approved",
      summary: "Both carried-over findings resolved; no new issues.",
      findingLifecycle: [
        { findingId: "F1", status: "resolved", explanation: "fixed" },
        { findingId: "F2", status: "resolved", explanation: "fixed" },
      ],
      reviewCoverage: oneFileCompleteCoverage,
    });
    const adapter = createSequenceAdapter([
      { stdout: "fixed both", mutate: () => gitAdapter.setState({ statusPorcelain: "M a.js" }) },
      { stdout: "revalidation passed" },
      { stdout: reReviewApproved },
      { stdout: "final validation passed" },
    ], cwd);

    const pausedState = createState({
      reviewSequence: 1,
      fixCycleCount: 0,
      reviewRuns: [
        { stage: "review", outcome: "Changes Requested", reviewerId: "reviewer", structuredReviewStatus: "valid", durationMs: 1000, completenessStatus: "complete" },
      ],
      findingHistory: [
        { findingId: "F1", kind: "blocking", severity: "P1", summary: "old issue 1", recommendation: "fix 1", firstSeenReviewSequence: 1, lastSeenReviewSequence: 1, currentStatus: "new", finding: { id: "F1", severity: "P1", summary: "old issue 1", recommendation: "fix 1" } },
        { findingId: "F2", kind: "blocking", severity: "P1", summary: "old issue 2", recommendation: "fix 2", firstSeenReviewSequence: 1, lastSeenReviewSequence: 1, currentStatus: "new", finding: { id: "F2", severity: "P1", summary: "old issue 2", recommendation: "fix 2" } },
      ],
      orchestration: {
        currentStage: "fix",
        maxFixCycles: 2,
        startedAt: "2026-07-26T00:00:00.000Z",
        reviewAttempts: 1,
        pendingFixTriggerReason: "reviewer-fix",
        activeBlockingFindings: [
          { id: "F1", severity: "P1", summary: "old issue 1", recommendation: "fix 1" },
          { id: "F2", severity: "P1", summary: "old issue 2", recommendation: "fix 2" },
        ],
        latestFindings: [
          { id: "F1", severity: "P1", summary: "old issue 1", recommendation: "fix 1" },
          { id: "F2", severity: "P1", summary: "old issue 2", recommendation: "fix 2" },
        ],
        reviewConvergenceMetrics: {
          reviewAttempts: 1,
          firstReviewBlockingFindings: 2,
          newBlockingFindingsAfterFirstReview: 0,
          reopenedFindings: 0,
          resolvedFindingsVerified: 0,
        },
      },
    });

    const run = await runOrchestration(pausedState, { cwd, gitAdapter, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.reviewConvergence.reviewAttempts).toBe(2);
    expect(run.summary!.reviewConvergence.firstReviewBlockingFindings).toBe(2);
    expect(run.summary!.reviewConvergence.newBlockingFindingsAfterFirstReview).toBe(0);
    expect(run.summary!.reviewConvergence.status).toBe("converged");
  }, 30000);

  it("Smoke H: dry-run previews changed-file inventory, review-budget usage, open finding count, and the next review action -- with zero spawn/write", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter({ state: { statusPorcelain: "M a.js" } });
    const state = createState({
      orchestration: {
        currentStage: "review",
        maxFixCycles: 2,
        reviewAttempts: 1,
        activeBlockingFindings: [{ id: "F1", severity: "P1", summary: "x" }],
      },
    });

    const preview = previewOrchestration(state, { cwd, gitAdapter, reviewBudget: { maxReviewAttempts: 3 } });

    expect(preview.reviewBudget.maxReviewAttempts).toBe(3);
    expect(preview.reviewBudgetUsage.reviewAttempts).toBe(1);
    expect(preview.openBlockingFindingsCount).toBe(1);
    expect(Array.isArray(preview.changedFileInventory)).toBe(true);
    expect(preview.nextReviewAction).toMatch(/review/i);
    expect(preview.willSpawn).toBe(false);
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("reviewBudget.maxReviewerQuestionCycles mirrors the resolved maxQuestionCycles by default", () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    // normalizeMaxQuestionCycles caps at DEFAULT_MAX_QUESTION_CYCLES (1), so
    // 0 is the only value distinguishable from the default (1) here.
    const preview = previewOrchestration(createState(), { cwd, gitAdapter, maxQuestionCycles: 0 });

    expect(preview.maxQuestionCycles).toBe(0);
    expect(preview.reviewBudget.maxReviewerQuestionCycles).toBe(0);
  });

  it("an explicit reviewBudget.maxReviewerQuestionCycles override stricter than maxQuestionCycles stops the Questions outcome safely with stopReason review-convergence-failed (regression for Codex Spec 056 review P2-001: this ceiling was resolved but never enforced)", async () => {
    const cwd = createTempDir();
    const gitAdapter = createFakeGitAdapter();
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
    ], cwd);

    const run = await runOrchestration(createState(), {
      cwd, gitAdapter, processAdapter: adapter, reviewBudget: { maxReviewerQuestionCycles: 0 },
    });

    expect(run.decision).toBe("Blocked");
    expect(run.state.orchestration.reason).toMatch(/Reviewer question-cycle budget exhausted/);
    expect(run.state.orchestration.stopReason).toBe("review-convergence-failed");
    // The legacy maxQuestionCycles ceiling (default 1) was not itself
    // reached -- only the stricter reviewBudget override was.
    expect(run.state.questionCycle || 0).toBe(0);
    expect(run.summary!.humanGate.ready).toBe(false);
    expect(run.summary!.run.stopReason).toBe(run.state.orchestration.stopReason);
    // Regression for Codex Spec 056 review round 3's P2-001 (a distinct
    // finding from round 1's P2-001 above, despite the reused ID): the
    // reviewer-question-cycle exhaustion path's message wasn't recognized
    // by buildReviewConvergenceSummary's budget-exhausted detection, so
    // this exact scenario reported "in-progress" instead of
    // "budget-exhausted".
    expect(run.summary!.reviewConvergence.status).toBe("budget-exhausted");
  }, 30000);
});
