import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AGENT_RUNNERS,
  DEFAULT_STAGE_AGENTS,
  assertRunnableStage,
  assertSafeCommand,
  diagnoseAgentRunners,
  detectAgentCli,
  isRemoteMutatingCommand,
  resolveAgentConfig,
  runWorkflowAgent,
} from "./agentRunner.js";
import { determineNextStage, getRunDirectory } from "./agentWorkflow.js";

type WorkflowState = {
  featureId: string;
  featureName: string;
  currentBranch: string;
  baseBranch: string;
  validationCommands: string[];
  scopeConstraints: string[];
  results: Array<{ stage: string; decision?: string; path?: string }>;
  agentRunners?: Record<string, unknown>;
  stageAgents?: Record<string, string>;
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agent-runner-"));
}

function createState(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return {
    featureId: "043-cli-agent-runner-foundation",
    featureName: "CLI Agent Runner Foundation",
    currentBranch: "codex/cli-agent-runner-foundation",
    baseBranch: "main",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"],
    scopeConstraints: ["Local runner only.", "Do not push.", "Do not merge."],
    results: [],
    ...overrides,
  };
}

function createAdapter(result: Record<string, unknown>) {
  const run = vi.fn(async () => ({
    stdout: "",
    stderr: "",
    exitCode: 0,
    signal: null,
    timedOut: false,
    interrupted: false,
    durationMs: 12,
    ...result,
  }));
  return { run };
}

describe("CLI agent detection", () => {
  it("detects an installed Codex-style CLI through an injected adapter", async () => {
    const adapter = createAdapter({ stdout: "codex-cli 0.142.3\n", exitCode: 0 });

    const result = await detectAgentCli(DEFAULT_AGENT_RUNNERS.codex, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(true);
    expect(result.agentId).toBe("codex");
    expect(result.stdout).toContain("codex-cli");
    expect(adapter.run).toHaveBeenCalledWith("codex", ["--version"], expect.objectContaining({ timeoutMs: 30000 }));
  });

  it("reports a missing Claude-style CLI without throwing", async () => {
    const adapter = createAdapter({ stderr: "not found", exitCode: null, errorMessage: "spawn claude ENOENT" });

    const result = await detectAgentCli(DEFAULT_AGENT_RUNNERS.claude, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(false);
    expect(result.agentId).toBe("claude");
    expect(result.errorMessage).toContain("ENOENT");
  });

  it("rejects a state-configured 'gh pr merge' runner before spawning during detection", async () => {
    const adapter = createAdapter({ stdout: "gh version 2.0.0", exitCode: 0 });
    const state = createState({
      agentRunners: {
        unsafeMerge: { identity: "Unsafe Merge", command: "gh", args: ["pr", "merge"] },
      },
    });

    const resolved = resolveAgentConfig(state, "unsafeMerge");

    await expect(detectAgentCli(resolved, { processAdapter: adapter, cwd: createTempDir() })).rejects.toThrow(
      "Remote-mutating",
    );
    expect(adapter.run).not.toHaveBeenCalled();
  });

  it("rejects a state-configured 'git push' runner before spawning during detection", async () => {
    const adapter = createAdapter({ stdout: "git version 2.40.0", exitCode: 0 });
    const state = createState({
      agentRunners: {
        unsafePush: { identity: "Unsafe Push", command: "git", args: ["push"] },
      },
    });

    const resolved = resolveAgentConfig(state, "unsafePush");

    await expect(detectAgentCli(resolved, { processAdapter: adapter, cwd: createTempDir() })).rejects.toThrow(
      "Remote-mutating",
    );
    expect(adapter.run).not.toHaveBeenCalled();
  });

  it("still detects a safe state-configured runner normally", async () => {
    const adapter = createAdapter({ stdout: "codex-cli 0.142.3\n", exitCode: 0 });
    const state = createState({
      agentRunners: {
        safeCodex: { identity: "OpenAI Codex CLI", command: "codex", args: [] },
      },
    });

    const resolved = resolveAgentConfig(state, "safeCodex");
    const result = await detectAgentCli(resolved, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(true);
    expect(result.agentId).toBe("safeCodex");
    expect(adapter.run).toHaveBeenCalledWith("codex", ["--version"], expect.objectContaining({ timeoutMs: 30000 }));
  });

  it("diagnoses available, missing, missing-config, and unsafe runners without unsafe spawns", async () => {
    const adapter = createAdapter({ stdout: "ok", exitCode: 0 });
    const state = createState({
      agentRunners: {
        codex: { identity: "OpenAI Codex CLI", command: "codex" },
        unsafe: { identity: "Unsafe", command: "gh", args: ["pr", "merge"] },
      },
      stageAgents: {
        implement: "codex",
        review: "missing",
        fix: "unsafe",
      },
    });

    const diagnostics = await diagnoseAgentRunners(state, {
      cwd: createTempDir(),
      processAdapter: adapter,
      agentIds: ["codex", "missing", "unsafe"],
    });

    expect(diagnostics.find((item) => item.agentId === "codex")).toEqual(expect.objectContaining({
      configured: true,
      safe: true,
      installed: true,
    }));
    expect(diagnostics.find((item) => item.agentId === "missing")).toEqual(expect.objectContaining({
      configured: false,
      safe: false,
      installed: false,
    }));
    expect(diagnostics.find((item) => item.agentId === "unsafe")).toEqual(expect.objectContaining({
      configured: true,
      safe: false,
      installed: false,
    }));
    expect(adapter.run).toHaveBeenCalledTimes(1);
  });
});

describe("CLI agent execution", () => {
  it("runs an implement prompt through the configured Codex runner and writes local records", async () => {
    const cwd = createTempDir();
    const adapter = createAdapter({ stdout: "Implementation complete", exitCode: 0, durationMs: 42 });

    const run = await runWorkflowAgent(createState(), {
      cwd,
      stage: "implement",
      agentId: "codex",
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(run.executionRecord.stage).toBe("implement");
    expect(run.executionRecord.agentId).toBe("codex");
    expect(run.executionRecord.stdout).toBe("Implementation complete");
    expect(run.executionRecord.exitCode).toBe(0);
    expect(run.executionRecord.durationMs).toBe(42);
    expect(run.recordPath.startsWith(path.join(cwd, ".agent-workflow", "runs"))).toBe(true);
    expect(fs.readFileSync(run.recordPath, "utf8")).toContain("\"agentId\": \"codex\"");
    expect(adapter.run).toHaveBeenCalledWith("codex", [], expect.objectContaining({
      cwd,
      input: expect.stringContaining("Implement 043-cli-agent-runner-foundation"),
    }));
  });

  it("records a Claude review decision and advances the workflow to fix", async () => {
    const adapter = createAdapter({ stdout: "Changes Requested - tighten path containment", exitCode: 0 });
    const state = createState({ results: [{ stage: "implement", decision: "Unknown" }] });

    const run = await runWorkflowAgent(state, {
      cwd: createTempDir(),
      stage: "review",
      agentId: "claude",
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(run.executionRecord.agentId).toBe("claude");
    expect(run.executionRecord.decision).toBe("Changes Requested");
    expect(determineNextStage(run.state)).toBe("fix");
  });

  it("captures non-zero exit without fabricating approval", async () => {
    const adapter = createAdapter({ stderr: "review failed Approved", exitCode: 2 });

    const run = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "review",
      agentId: "claude",
      processAdapter: adapter,
    });

    expect(run.executionRecord.outputState).toBe("non-zero");
    expect(run.executionRecord.exitCode).toBe(2);
    expect(run.executionRecord.decision).toBe("Unknown");
    expect(run.state.results).toHaveLength(0);
    expect(run.resultPath).toBeUndefined();
  });

  it("timeout review output that prints Approved does not record approval", async () => {
    const run = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "review",
      agentId: "claude",
      processAdapter: createAdapter({ stdout: "Approved", timedOut: true, signal: "SIGTERM", exitCode: null }),
    });

    expect(run.executionRecord.outputState).toBe("timeout");
    expect(run.executionRecord.decision).toBe("Unknown");
    expect(run.state.results).toHaveLength(0);
    expect(run.resultPath).toBeUndefined();
  });

  it("failed implement does not advance to review", async () => {
    const run = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "implement",
      agentId: "codex",
      processAdapter: createAdapter({ stderr: "implementation failed", exitCode: 1 }),
    });

    expect(run.executionRecord.outputState).toBe("non-zero");
    expect(run.state.results).toHaveLength(0);
    expect(determineNextStage(run.state)).toBe("implement");
  });

  it("successful review still records decisions normally", async () => {
    const run = await runWorkflowAgent(createState({ results: [{ stage: "implement", decision: "Unknown" }] }), {
      cwd: createTempDir(),
      stage: "review",
      agentId: "claude",
      processAdapter: createAdapter({ stdout: "Approved", exitCode: 0 }),
    });

    expect(run.executionRecord.decision).toBe("Approved");
    expect(run.state.results).toHaveLength(2);
    expect(run.state.results[1].decision).toBe("Approved");
    expect(determineNextStage(run.state)).toBe("final-verification");
    expect(run.resultPath).toBeTruthy();
  });

  it("captures timeout, interrupted, and empty output states", async () => {
    const timeout = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "implement",
      agentId: "codex",
      processAdapter: createAdapter({ timedOut: true, signal: "SIGTERM", exitCode: null }),
    });
    const interrupted = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "review",
      agentId: "claude",
      processAdapter: createAdapter({ interrupted: true, signal: "SIGINT", exitCode: null }),
    });
    const empty = await runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "fix",
      agentId: "codex",
      processAdapter: createAdapter({ stdout: "", stderr: "", exitCode: 0 }),
    });

    expect(timeout.executionRecord.outputState).toBe("timeout");
    expect(timeout.executionRecord.timedOut).toBe(true);
    expect(interrupted.executionRecord.outputState).toBe("interrupted");
    expect(interrupted.executionRecord.interrupted).toBe(true);
    expect(empty.executionRecord.outputState).toBe("empty");
  });

  it("refuses human merge decision before spawning", async () => {
    const adapter = createAdapter({ stdout: "should not run" });

    await expect(runWorkflowAgent(createState(), {
      cwd: createTempDir(),
      stage: "human-merge-decision",
      agentId: "codex",
      processAdapter: adapter,
    })).rejects.toThrow("human-only");
    expect(adapter.run).not.toHaveBeenCalled();
  });

  it("refuses remote-mutating command configs before spawning", async () => {
    const adapter = createAdapter({ stdout: "should not run" });
    const state = createState({
      agentRunners: {
        unsafe: { agentId: "unsafe", identity: "Unsafe", command: "git", args: ["push"], inputMode: "stdin" },
      },
    });

    await expect(runWorkflowAgent(state, {
      cwd: createTempDir(),
      stage: "implement",
      agentId: "unsafe",
      processAdapter: adapter,
    })).rejects.toThrow("Remote-mutating");
    expect(adapter.run).not.toHaveBeenCalled();
    expect(isRemoteMutatingCommand("gh", ["pr", "merge"])).toBe(true);
    expect(() => assertSafeCommand({ command: "gh", args: ["pr", "create"] })).toThrow("Remote-mutating");
  });

  it("keeps run records contained for unusual feature ids", async () => {
    for (const featureId of [".", "..", "", " odd/../value "]) {
      const cwd = createTempDir();
      const run = await runWorkflowAgent(createState({ featureId }), {
        cwd,
        stage: "implement",
        agentId: "codex",
        processAdapter: createAdapter({ stdout: "ok", exitCode: 0 }),
        now: () => "2026-07-08T00:00:00.000Z",
      });
      const runRoot = path.join(cwd, ".agent-workflow", "runs");
      const relative = path.relative(runRoot, run.recordPath);

      expect(run.recordPath.startsWith(runRoot)).toBe(true);
      expect(relative).not.toMatch(/^\.\./);
      expect(path.isAbsolute(relative)).toBe(false);
      expect(getRunDirectory({ featureId }, { cwd }).startsWith(runRoot)).toBe(true);
    }
  });

  it("preserves configured stage defaults without hardcoding workflow execution to names", () => {
    expect(DEFAULT_STAGE_AGENTS).toEqual(expect.objectContaining({
      implement: "codex",
      review: "claude",
      fix: "codex",
      "re-review": "claude",
      "final-verification": "codex",
    }));
    expect(() => assertRunnableStage("human-merge-decision")).toThrow("human-only");
  });
});
