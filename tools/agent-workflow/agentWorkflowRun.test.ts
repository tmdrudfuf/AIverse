import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { determineNextStage, writeState } from "./agentWorkflow.js";
import { formatRunSummary } from "./cli.js";
import { runWorkflowCommand, runWorkflowCommandAndPersist } from "./agentWorkflowRun.js";

type WorkflowState = {
  featureId: string;
  featureName: string;
  currentBranch: string;
  baseBranch: string;
  validationCommands: string[];
  scopeConstraints: string[];
  results: Array<{ stage: string; decision?: string }>;
  agentRunners?: Record<string, unknown>;
  stageAgents?: Record<string, string>;
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "workflow-run-"));
}

function createState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return {
    featureId: "044-agent-workflow-run-command",
    featureName: "Agent Workflow Run Command",
    currentBranch: "codex/agent-workflow-run-command",
    baseBranch: "main",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"],
    scopeConstraints: ["Local runner only.", "Do not push.", "Do not merge."],
    results: [],
    ...overrides,
  };
}

function createSequenceAdapter(outputs: Array<Record<string, unknown>>) {
  const run = vi.fn(async () => {
    const next = outputs.shift();
    if (!next) throw new Error("Unexpected process call");
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      signal: null,
      timedOut: false,
      interrupted: false,
      durationMs: 10,
      ...next,
    };
  });
  return { run };
}

describe("agent workflow run command", () => {
  it("runs exactly one stage by default", async () => {
    const adapter = createSequenceAdapter([{ stdout: "implementation done", exitCode: 0 }]);

    const summary = await runWorkflowCommand(createState(), {
      cwd: createTempDir(),
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(adapter.run).toHaveBeenCalledTimes(1);
    expect(summary.steps).toHaveLength(1);
    expect(summary.steps[0].stage).toBe("implement");
    expect(summary.stopReason).toBe("single-stage-complete");
    expect(summary.nextStage).toBe("review");
  });

  it("continues until blocked and stops before human merge decision", async () => {
    const adapter = createSequenceAdapter([
      { stdout: "implementation done", exitCode: 0 },
      { stdout: "Approved", exitCode: 0 },
      { stdout: "final verification done", exitCode: 0 },
    ]);

    const summary = await runWorkflowCommand(createState(), {
      cwd: createTempDir(),
      untilBlocked: true,
      maxSteps: 6,
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(adapter.run).toHaveBeenCalledTimes(3);
    expect(summary.steps.map((step) => step.stage)).toEqual(["implement", "review", "final-verification"]);
    expect(summary.stopReason).toBe("human-merge-decision");
    expect(summary.nextStage).toBe("human-merge-decision");
  });

  it("stops on failed execution and does not advance stage", async () => {
    const adapter = createSequenceAdapter([{ stderr: "failed Approved", exitCode: 1 }]);

    const summary = await runWorkflowCommand(createState(), {
      cwd: createTempDir(),
      untilBlocked: true,
      processAdapter: adapter,
    });

    expect(summary.stopReason).toBe("failure");
    expect(summary.steps[0].outputState).toBe("non-zero");
    expect(summary.state.results).toHaveLength(0);
    expect(determineNextStage(summary.state)).toBe("implement");
  });

  it("stops on missing agent config before spawning", async () => {
    const adapter = createSequenceAdapter([{ stdout: "should not run" }]);
    const state = createState({ stageAgents: { implement: "missing" } });

    const summary = await runWorkflowCommand(state, {
      cwd: createTempDir(),
      untilBlocked: true,
      processAdapter: adapter,
    });

    expect(adapter.run).not.toHaveBeenCalled();
    expect(summary.stopReason).toBe("missing-agent");
    expect(summary.errorMessage).toContain("No agent runner configured");
  });

  it("honors max-step guard", async () => {
    const adapter = createSequenceAdapter([
      { stdout: "implementation done", exitCode: 0 },
      { stdout: "Changes Requested", exitCode: 0 },
    ]);

    const summary = await runWorkflowCommand(createState(), {
      cwd: createTempDir(),
      untilBlocked: true,
      maxSteps: 2,
      processAdapter: adapter,
    });

    expect(adapter.run).toHaveBeenCalledTimes(2);
    expect(summary.stopReason).toBe("max-steps");
    expect(summary.nextStage).toBe("fix");
  });

  it("persists state and returns output paths in the summary", async () => {
    const cwd = createTempDir();
    const statePath = path.join(cwd, ".agent-workflow", "state.json");
    writeState(statePath, createState());

    const summary = await runWorkflowCommandAndPersist(statePath, {
      cwd,
      processAdapter: createSequenceAdapter([{ stdout: "implementation done", exitCode: 0 }]),
      now: () => "2026-07-08T00:00:00.000Z",
    });

    const persisted = JSON.parse(fs.readFileSync(statePath, "utf8"));
    expect(persisted.results).toHaveLength(1);
    expect(summary.steps[0].recordPath).toContain(".agent-workflow/runs/044-agent-workflow-run-command");
    expect(summary.steps[0].resultPath).toContain(".agent-workflow/runs/044-agent-workflow-run-command");
    expect(formatRunSummary(summary)).toContain("Stage: implement");
  });
});
