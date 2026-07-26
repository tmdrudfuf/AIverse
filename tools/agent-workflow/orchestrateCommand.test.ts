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
      { stdout: structuredResolvedApproval },
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
      { stdout: structuredResolvedApproval },
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

    const run = await runOrchestration(state, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", "mock-reviewer", expect.any(String)]);
  }, 30000);

  it("resumes from final-review without duplicating completed answer stage", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

  it("classifies a clean single structured review in stdout as valid even when stderr echoes duplicate example JSON blocks", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.latestStructuredReviewStatus).toBe("valid");
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
    initRepo(cwd);
    const state = createRoleSelectionState();
    const preview = previewOrchestration(state, { cwd, implementerAgentId: "claude" });

    expect(preview.willSpawn).toBe(false);
    expect(preview.roleSource).toBe("cli-override");
    expect(preview.implementer).toMatchObject({ id: "claude", identity: "Claude Mock" });
    expect(preview.reviewer).toMatchObject({ id: "codex", identity: "Codex Mock" });
    expect(state).not.toHaveProperty("orchestration");
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("dry-run resolves --implementer codex to Codex Implementer / Claude Reviewer and spawns nothing", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const state = createRoleSelectionState();
    const preview = previewOrchestration(state, { cwd, implementerAgentId: "codex" });

    expect(preview.willSpawn).toBe(false);
    expect(preview.roleSource).toBe("cli-override");
    expect(preview.implementer).toMatchObject({ id: "codex", identity: "Codex Mock" });
    expect(preview.reviewer).toMatchObject({ id: "claude", identity: "Claude Mock" });
  });

  it("dry-run rejects an unknown --implementer before any spawn", () => {
    const cwd = createTempDir();
    initRepo(cwd);
    expect(() => previewOrchestration(createRoleSelectionState(), { cwd, implementerAgentId: "unknown-agent" }))
      .toThrow("Requested implementer 'unknown-agent' is not configured.");
  });

  it("real orchestration sends the implementation prompt to the resolved Implementer and the review prompt to the resolved Reviewer", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: adapter, implementerAgentId: "claude" });

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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredQuestionsReview },
      { stdout: structuredAnswers },
      { stdout: structuredResolvedApproval },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: adapter, implementerAgentId: "claude", maxFixCycles: 2 });

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
    initRepo(cwd);
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

    const run = await runOrchestration(pinnedState, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(adapter.calls[0].command).toBe("mock-codex");
    expect(run.state.orchestration.resolvedImplementerId).toBe("claude");
    expect(run.state.orchestration.resolvedReviewerId).toBe("codex");
  }, 30000);

  it("accepts a matching --implementer on resume", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(pinnedState, { cwd, processAdapter: adapter, implementerAgentId: "claude" });

    expect(run.decision).toBe("Ready for human merge decision");
  }, 30000);

  it("rejects a conflicting --implementer on resume before any spawn and leaves persisted roles unchanged", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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
    initRepo(cwd);
    const firstAdapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const firstRun = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: firstAdapter, implementerAgentId: "claude" });
    expect(firstRun.decision).toBe("Ready for human merge decision");

    const secondAdapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const secondRun = await runOrchestration(createRoleSelectionState(), { cwd, processAdapter: secondAdapter, implementerAgentId: "codex" });

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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter, maxFixCycles: 2 });

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
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation failed", exitCode: 1 },
    ], cwd);

    const run = await runOrchestration(createState(), { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Blocked");
    const persistedSummary = JSON.parse(fs.readFileSync(path.join(cwd, run.summaryPaths!.json!), "utf8"));
    expect(persistedSummary.run.status).toBe("failed");
    expect(persistedSummary.run.stopReason).toBe("validation-failed");
    expect(persistedSummary.humanGate.ready).toBe(false);
    expect(persistedSummary.review.finalDecision).not.toBe("Approved");
  }, 30000);

  it("writes a partial timed-out summary with no approval claim when the Reviewer times out", async () => {
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
    initRepo(cwd);
    const preview = previewOrchestration(createState(), { cwd });

    expect(preview.summaryPaths.willWrite).toBe(false);
    expect(preview.summaryPaths.json).toContain("run-summary.json");
    expect(preview.summaryPaths.markdown).toContain("run-summary.md");
    expect(fs.existsSync(path.join(cwd, ".agent-workflow"))).toBe(false);
  });

  it("does not duplicate stage-timeline entries when resuming from review", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: approvedReview },
      { stdout: "final validation passed" },
    ], cwd);
    const resumedState = createState({
      orchestration: { currentStage: "review", maxFixCycles: 2, startedAt: "2026-07-26T00:00:00.000Z" },
      orchestrationRuns: [{ stage: "implement", status: "completed", path: "implement.md", resultPath: "implement-result.md" }],
      validationRuns: [{ stage: "validate", status: "passed", path: "validate.md" }],
    });

    const run = await runOrchestration(resumedState, { cwd, processAdapter: adapter });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.orchestrationRuns.filter((r: { stage: string }) => r.stage === "implement")).toHaveLength(1);
    expect(run.state.validationRuns.filter((r: { stage: string }) => r.stage === "validate")).toHaveLength(1);
    expect(run.summary!.stageTimeline.map((entry: { stage: string }) => entry.stage)).toEqual([
      "implement", "validate", "review", "final-verification",
    ]);
  }, 30000);

  it("reports unchanged roles and source after a resumed --implementer run", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(resumedState, { cwd, processAdapter: adapter });

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

  it("Smoke D: full-every-cycle (explicit) reproduces the same stage/command behavior as the default", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "validation passed" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const state = createState({ validationPolicy: { strategy: "full-every-cycle" } });
    const run = await runOrchestration(state, { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.validation.full.attempts).toBe(2);
    expect(run.summary!.validation.commands.every((command: { phase: string }) => command.phase === "full")).toBe(true);
  }, 30000);

  it("Smoke E: dry-run previews the strategy, both command lists, and the next phase without executing anything", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([{ stdout: "should not run" }], cwd);

    const preview = previewOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter });

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
    initRepo(cwd);
    const preview = previewOrchestration(focusedFinalFullState({
      orchestration: { currentStage: "final-verification", startedAt: "2026-07-26T00:00:00.000Z" },
    }), { cwd });
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
    initRepo(cwd);
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

    const run = await runOrchestration(terminalState, { cwd, processAdapter: adapter });

    expect(adapter.run).not.toHaveBeenCalled();
    expect(run.state.orchestration.currentStage).toBe("human-merge-decision");
  }, 30000);

  it("--skip-validation still makes readiness unreachable under focused-final-full", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: structuredApprovedReview },
    ], cwd);

    const run = await runOrchestration(focusedFinalFullState(), { cwd, processAdapter: adapter, skipValidation: true, maxFixCycles: 2 });

    expect(run.summary!.validation.status).toBe("skipped");
    expect(run.summary!.humanGate.ready).toBe(false);
  }, 30000);

  it("--force-full-validation elevates a validate/revalidate occurrence to full, tagged manual-request, without touching fixCycleCount", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([{ stdout: "full validation forced" }], cwd);
    const state = focusedFinalFullState();

    const result = await runValidationCommands(state, "validate", { cwd, processAdapter: adapter, forceFullValidation: true });

    expect(result.passed).toBe(true);
    expect(result.phase).toBe("full");
    expect(result.records[0].phase).toBe("full");
    expect(result.records[0].triggerReason).toBe("manual-request");
    expect(result.records[0].command).toBe("mock full");
    expect(result.state.fixCycleCount || 0).toBe(0);
  });

  it("rejects an unsafe focused validation command before spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([{ stdout: "implemented" }], cwd);
    const state = focusedFinalFullState({
      validationPolicy: {
        strategy: "focused-final-full",
        focusedCommands: ["git push origin main"],
        fullCommands: ["mock full"],
      },
    });

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer"]);
  }, 30000);

  it("rejects an unsafe full validation command before spawn", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    await expect(runOrchestration(state, { cwd, processAdapter: adapter })).rejects.toThrow("Remote-mutating validation commands");
    expect(adapter.calls.map((call) => call.command)).toEqual(["mock-implementer", "mock", "mock-reviewer"]);
  }, 30000);

  it("falls back to full validation at validate/revalidate when focused-final-full is selected with no focused commands configured", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
    const adapter = createSequenceAdapter([
      { stdout: "implemented" },
      { stdout: "full validation ran as fallback" },
      { stdout: structuredApprovedReview },
      { stdout: "final validation passed" },
    ], cwd);

    const state = createState({ validationPolicy: { strategy: "focused-final-full" } });
    const run = await runOrchestration(state, { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.state.validationRuns[0].phase).toBe("full");
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.validation.full.attempts).toBe(2);
  }, 30000);

  it("legacy validationRuns records without a phase field remain valid and are treated as full", async () => {
    const cwd = createTempDir();
    initRepo(cwd);
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

    const run = await runOrchestration(resumedState, { cwd, processAdapter: adapter, maxFixCycles: 2 });

    expect(run.decision).toBe("Ready for human merge decision");
    expect(run.summary!.validation.full.attempts).toBe(2);
    expect(run.summary!.validation.focused.attempts).toBe(0);
    expect(run.summary!.humanGate.ready).toBe(true);
  }, 30000);
});
