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

function initRepo(cwd: string) {
  git(cwd, ["init", "-q"]);
  git(cwd, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Test"]);
  fs.writeFileSync(path.join(cwd, "tracked.txt"), "base\n");
  git(cwd, ["add", "-A"]);
  git(cwd, ["commit", "-q", "-m", "init"]);
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
    initRepo(cwd);
    const state = createState();
    const preview = previewOrchestration(state, { cwd, maxFixCycles: 3 });

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
    initRepo(cwd);
    const preview = previewOrchestration(createState({
      fixCycleCount: 1,
      orchestration: { currentStage: "re-review", maxFixCycles: 3 },
    }), { cwd, maxFixCycles: 3 });

    expect(preview.currentStage).toBe("re-review");
    expect(preview.fixCycleCount).toBe(1);
  });
});

describe("orchestrate workflow", () => {
  it("runs direct approval flow to human merge decision", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

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

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.fixCycleCount).toBe(1);
    expect(adapter.calls.some((call) => call.input?.includes("File: tracked.txt"))).toBe(true);
  }, 30000);

  it("runs one question loop and reaches approval without a fix cycle", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });
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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredActionableChanges },
      { stdout: "fixed", mutate: (repo) => fs.writeFileSync(path.join(repo, "tracked.txt"), "fixed\n") },
      { stdout: "revalidation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.questionCycle).toBe(1);
    expect(run.state.fixCycleCount).toBe(1);
    expect(adapter.calls.filter((call) => call.command === "mock-implementer")).toHaveLength(3);
  }, 30000);

  it("blocks when final Reviewer asks questions again", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredQuestionsReview },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer asked questions after the allowed clarification round");
    expect(run.state.fixCycleCount || 0).toBe(0);
  }, 30000);

  it("does not spawn answer stage for invalid questions", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const invalidQuestions = structuredQuestionsReview.replace('"questions": [', '"blockingFindings": [{ "id": "P1", "severity": "P1", "summary": "Issue", "recommendation": "Fix" }],\n  "questions": [');
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: invalidQuestions },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("does not spawn final review for invalid answers", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const invalidAnswers = structuredAnswers.replace('"questionId": "Q1"', '"questionId": "Q2"');
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: invalidAnswers },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("answer-questions execution failed");
  }, 30000);

  it("stops conservatively on final-review timeout", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Timed Out");
  }, 30000);

  it("resumes from answer-questions without repeating implementation or review", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: structuredAnswers },
      { stdout: structuredApprovedReview },
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

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", "mock-reviewer", expect.any(String)]);
  }, 30000);

  it("resumes from final-review without duplicating completed answer stage", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: structuredApprovedReview },
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

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-reviewer", expect.any(String)]);
  }, 30000);

  it("supports role-swapped Implementer and Reviewer through a question loop", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

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
      { stdout: structuredApprovedReview },
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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stderr: "validation failed", exitCode: 1 },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toContain("validate failed");
    expect(adapter.calls.map((call) => call.command)).not.toContain("mock-reviewer");
  }, 30000);

  it("does not start a fix cycle for Reviewer Unknown", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "looks okay maybe" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls.filter((call) => call.command === "mock-implementer")).toHaveLength(1);
  }, 30000);

  it("stops conservatively on Reviewer timeout", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview, timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Timed Out");
  }, 30000);

  it("stops conservatively on Implementer timeout and never reviews", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "partial", timedOut: true, signal: "SIGTERM", exitCode: null },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("implement execution failed");
    expect(adapter.calls).toHaveLength(1);
  }, 30000);

  it("does not start a blind fix for non-actionable Changes Requested", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "# Review Decision: Changes Requested\n\n## Blocking Findings\nPlease improve it." },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer requested changes without actionable findings");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("does not start a blind fix when structured Changes Requested has no blocking findings", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("blocks invalid structured review data instead of reaching final verification", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: "# Review Decision: Approved\n\n## Structured Review\n\n```json\n{ nope\n```" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(run.state.latestStructuredReviewStatus).toBe("invalid");
    expect(adapter.calls).toHaveLength(3);
  }, 30000);

  it("blocks conflicting Markdown and structured decisions", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredActionableChanges.replace("# Review Decision: Changes Requested", "# Review Decision: Approved") },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Reviewer returned Unknown");
    expect(run.state.latestStructuredReviewStatus).toBe("invalid");
  }, 30000);

  it("blocks no-change fix cycles", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: actionableChanges },
      { stdout: "claimed fixed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    expect(run.reason).toBe("Fix cycle produced no repository diff");
  }, 30000);

  it("rejects unsafe runner configs before spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([{ stdout: "should not run" }], cwd);
    const state = createState({
      agentRunners: {
        implementer: { identity: "Unsafe", command: "gh", args: ["pr", "merge"], inputMode: "stdin" },
        reviewer: { identity: "Mock Reviewer", command: "mock-reviewer", args: [], inputMode: "stdin" },
      },
    });

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating");
    expect(adapter.run).not.toHaveBeenCalled();
  }, 30000);

  it("rejects unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["git push origin main"] });

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects quote-split unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["g''it push origin main"] });

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects shell-wrapped unsafe validation commands before validation spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
    ], cwd);
    const state = createState({ validationCommands: ["sh -c \"git push origin main\""] });

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("runs npm validation commands through the real adapter on Windows-compatible argv", async () => {
    const cwd = createTempDir();
    initRepo(cwd);

    const validation = await runValidationCommands(createState({ validationCommands: ["npm --version"] }), "validate", {
      cwd,
      timeoutMs: 30000,
    });

    expect(validation.passed).toBe(true);
    expect(validation.records[0]?.status).toBe("passed");
    expect(validation.records[0]?.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  }, 30000);

  it("resumes from review without repeating implementation or validation", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const state = createState({
      orchestration: { currentStage: "review", maxFixCycles: 2 },
      validationRuns: [{ stage: "validate", status: "passed", path: ".agent-workflow/runs/x/validation.md" }],
    });

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-reviewer", expect.any(String)]);
  }, 30000);

  it("supports role-swapped Implementer and Reviewer", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestration.implementerIdentity).toBe("Implementer (Claude CLI)");
    expect(run.state.orchestration.reviewerIdentity).toBe("Reviewer (Codex CLI)");
    expect(adapter.calls[0].command).toBe("mock-claude");
    expect(adapter.calls[2].command).toBe("mock-codex");
  }, 30000);

  it("loads BOM state and persists orchestration state", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `\uFEFF${JSON.stringify(createState())}`, "utf8");
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestrationAndPersist(statePath, { cwd, processAdapter: adapter });
    const persisted = readState(statePath);

    expect(run.decision).toBe("Ready for human merge decision");
    expect(persisted.orchestration.currentStage).toBe("human-merge-decision");
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
