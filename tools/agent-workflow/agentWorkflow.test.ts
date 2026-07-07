import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  determineNextStage,
  generatePrompt,
  getRunDirectory,
  listForbiddenExecutablePatterns,
  recordAgentResult,
  writeGeneratedPrompt,
} from "./agentWorkflow.js";

type WorkflowState = {
  featureId: string;
  featureName: string;
  currentBranch: string;
  baseBranch: string;
  expectedCommit?: string;
  validationCommands: string[];
  scopeConstraints: string[];
  primaryWorktreePath?: string;
  results: Array<{
    stage: string;
    decision?: string;
    path?: string;
  }>;
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflow-"));
}

function createState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return {
    featureId: "041-agent-review-orchestration",
    featureName: "Agent Review Orchestration",
    currentBranch: "codex/agent-review-orchestration",
    baseBranch: "main",
    expectedCommit: "abc123",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"],
    scopeConstraints: ["Local scripts/templates/docs only.", "Do not push.", "Do not merge."],
    results: [],
    ...overrides,
  };
}

describe("agent workflow prompt generation", () => {
  it("generates an implement prompt from a minimal workflow state", () => {
    const generated = generatePrompt(createState());

    expect(generated.stage).toBe("implement");
    expect(generated.prompt).toContain("Implement 041-agent-review-orchestration");
    expect(generated.prompt).toContain("codex/agent-review-orchestration");
    expect(generated.prompt).toContain("npm test");
    expect(generated.prompt).toContain("Do not push.");
    expect(generated.prompt).toContain("Do not merge pull requests.");
  });

  it("generates a review prompt after an implementation result is recorded", () => {
    const state = createState({
      results: [{ stage: "implement", decision: "Unknown" }],
    });

    const generated = generatePrompt(state);

    expect(generated.stage).toBe("review");
    expect(generated.prompt).toContain("Review 041-agent-review-orchestration");
    expect(generated.prompt).toContain("Approved");
    expect(generated.prompt).toContain("Changes Requested");
  });

  it("generates a fix prompt when review result contains Changes Requested", () => {
    const state = createState({
      results: [{ stage: "review", decision: "Changes Requested" }],
    });

    expect(determineNextStage(state)).toBe("fix");
    expect(generatePrompt(state).prompt).toContain("Fix Review Findings");
  });

  it("generates a re-review prompt after a fix result is recorded", () => {
    const state = createState({
      results: [{ stage: "fix", decision: "Unknown" }],
    });

    expect(generatePrompt(state).stage).toBe("re-review");
  });

  it("generates a final verification prompt when review result contains Approved", () => {
    const state = createState({
      results: [{ stage: "re-review", decision: "Approved" }],
    });

    const generated = generatePrompt(state);

    expect(generated.stage).toBe("final-verification");
    expect(generated.prompt).toContain("Final Verification");
  });

  it("routes final verification to a human merge decision prompt", () => {
    const state = createState({
      results: [{ stage: "final-verification", decision: "Approved" }],
    });

    const generated = generatePrompt(state);

    expect(generated.stage).toBe("human-merge-decision");
    expect(generated.prompt).toContain("Human Merge Decision");
  });

  it("includes no-push/no-merge rules, validation commands, and human-only command labels", () => {
    const generated = generatePrompt(createState());

    expect(generated.prompt).toContain("npm run build");
    expect(generated.prompt).toContain("Do not push.");
    expect(generated.prompt).toContain("Do not merge pull requests.");
    expect(generated.prompt).toContain("HUMAN-ONLY: git push");
    expect(generated.prompt).toContain("HUMAN-ONLY: gh pr merge");
  });

  it("includes primary worktree non-interference instructions when provided", () => {
    const generated = generatePrompt(
      createState({
        primaryWorktreePath: "C:\\Users\\tmdru\\Desktop\\Ky-Project\\AIverse",
      }),
    );

    expect(generated.prompt).toContain("do not modify, checkout, reset, stash, clean, or otherwise interfere");
    expect(generated.prompt).toContain("C:\\Users\\tmdru\\Desktop\\Ky-Project\\AIverse");
  });
});

describe("agent workflow result records", () => {
  it("stores run output paths under .agent-workflow/runs", () => {
    const cwd = createTempDir();
    const state = createState();
    const recorded = recordAgentResult(
      state,
      {
        stage: "implement",
        agent: "Claude",
        resultText: "Implementation complete.",
      },
      {
        cwd,
        recordedAt: "2026-07-08T00:00:00.000Z",
        now: () => "2026-07-08T00:00:00.000Z",
      },
    );

    expect(recorded.result.path).toMatch(/^\.agent-workflow\/runs\/041-agent-review-orchestration\//);
    expect(recorded.outputPath.startsWith(path.join(cwd, ".agent-workflow", "runs"))).toBe(true);
    expect(fs.readFileSync(recorded.outputPath, "utf8")).toBe("Implementation complete.");
  });

  it("rejects run roots outside .agent-workflow/runs", () => {
    expect(() => getRunDirectory(createState(), { cwd: createTempDir(), runRoot: "tmp/runs" })).toThrow(
      ".agent-workflow/runs",
    );
  });

  it("prefers Changes Requested over Approved when both appear", () => {
    const recorded = recordAgentResult(
      createState(),
      {
        stage: "review",
        agent: "Codex",
        resultText: "Approved? No. Changes Requested - fix the test.",
      },
      {
        cwd: createTempDir(),
        recordedAt: "2026-07-08T00:00:00.000Z",
        now: () => "2026-07-08T00:00:00.000Z",
      },
    );

    expect(recorded.result.decision).toBe("Changes Requested");
    expect(determineNextStage(recorded.state)).toBe("fix");
  });

  it("writes generated prompts only under the run directory", () => {
    const cwd = createTempDir();
    const written = writeGeneratedPrompt(createState(), {
      cwd,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(written.outputPath.startsWith(path.join(cwd, ".agent-workflow", "runs"))).toBe(true);
    expect(fs.readFileSync(written.outputPath, "utf8")).toContain("Implement 041-agent-review-orchestration");
  });
});

describe("agent workflow safety", () => {
  it("does not call network or external AI tools while generating prompts and recording results", () => {
    const fetchSpy = vi.fn(() => {
      throw new Error("fetch should not be called");
    });
    vi.stubGlobal("fetch", fetchSpy);

    const cwd = createTempDir();
    const state = createState();
    generatePrompt(state);
    recordAgentResult(
      state,
      {
        stage: "review",
        agent: "Codex",
        resultText: "Approved",
      },
      {
        cwd,
        recordedAt: "2026-07-08T00:00:00.000Z",
        now: () => "2026-07-08T00:00:00.000Z",
      },
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps remote-mutating commands as human-only suggestions", () => {
    const prompt = generatePrompt(createState()).prompt;

    for (const pattern of listForbiddenExecutablePatterns()) {
      expect(prompt).toContain(`HUMAN-ONLY: ${pattern}`);
    }
  });

  it("contains no child process, network module, or external AI execution imports", () => {
    const source = fs.readFileSync(path.join(__dirname, "agentWorkflow.js"), "utf8");
    const cliSource = fs.readFileSync(path.join(__dirname, "cli.js"), "utf8");
    const combined = `${source}\n${cliSource}`;

    expect(combined).not.toContain("child_process");
    expect(combined).not.toContain("require(\"http\")");
    expect(combined).not.toContain("require(\"https\")");
    expect(combined).not.toContain("fetch(");
    expect(combined).not.toContain("openai");
    expect(combined).not.toContain("anthropic");
  });
});
