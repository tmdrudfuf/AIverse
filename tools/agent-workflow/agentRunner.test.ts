import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  CLAUDE_FULL_ACCESS_ARGS,
  CODEX_FULL_ACCESS_ARGS,
  DEFAULT_AGENT_RUNNERS,
  DEFAULT_STAGE_AGENTS,
  assertRunnableStage,
  assertSafeCommand,
  createDefaultProcessAdapter,
  createPromptInvocation,
  detectAgentCli,
  isRemoteMutatingCommand,
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
  reviewFindings?: string[];
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

    const result = await detectAgentCli(DEFAULT_AGENT_RUNNERS.implementer, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(true);
    expect(result.agentId).toBe("implementer");
    expect(result.stdout).toContain("codex-cli");
    expect(adapter.run).toHaveBeenCalledWith("codex", ["--version"], expect.objectContaining({ timeoutMs: 30000 }));
    expect(DEFAULT_AGENT_RUNNERS.implementer.args).toEqual(CODEX_FULL_ACCESS_ARGS);
  });

  it("reports a missing Claude-style CLI without throwing", async () => {
    const adapter = createAdapter({ stderr: "not found", exitCode: null, errorMessage: "spawn claude ENOENT" });

    const result = await detectAgentCli(DEFAULT_AGENT_RUNNERS.reviewer, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(false);
    expect(result.agentId).toBe("reviewer");
    expect(result.errorMessage).toContain("ENOENT");
  });

  it("rejects state-configured gh pr merge before detection spawn", async () => {
    const adapter = createAdapter({ stdout: "should not run" });

    await expect(detectAgentCli({
      agentId: "unsafe",
      identity: "Unsafe gh",
      command: "gh",
      args: ["pr", "merge"],
      inputMode: "stdin",
    }, { processAdapter: adapter, cwd: createTempDir() })).rejects.toThrow("Remote-mutating");
    expect(adapter.run).not.toHaveBeenCalled();
  });

  it("rejects state-configured git push before detection spawn", async () => {
    const adapter = createAdapter({ stdout: "should not run" });

    await expect(detectAgentCli({
      agentId: "unsafe",
      identity: "Unsafe git",
      command: "git",
      args: ["push"],
      inputMode: "stdin",
    }, { processAdapter: adapter, cwd: createTempDir() })).rejects.toThrow("Remote-mutating");
    expect(adapter.run).not.toHaveBeenCalled();
  });

  it("still probes safe configured runners with --version", async () => {
    const adapter = createAdapter({ stdout: "safe 1.0.0", exitCode: 0 });

    const result = await detectAgentCli({
      agentId: "safe",
      identity: "Safe CLI",
      command: "safe-cli",
      args: ["run"],
      inputMode: "stdin",
    }, { processAdapter: adapter, cwd: createTempDir() });

    expect(result.installed).toBe(true);
    expect(adapter.run).toHaveBeenCalledWith("safe-cli", ["--version"], expect.any(Object));
  });
});

describe("CLI agent execution", () => {
  it("runs an implement prompt through the default Implementer role and writes local records", async () => {
    const cwd = createTempDir();
    const adapter = createAdapter({ stdout: "Implementation complete", exitCode: 0, durationMs: 42 });

    const run = await runWorkflowAgent(createState(), {
      cwd,
      stage: "implement",
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(run.executionRecord.stage).toBe("implement");
    expect(run.executionRecord.agentId).toBe("implementer");
    expect(run.executionRecord.command).toBe("codex");
    expect(run.executionRecord.args).toEqual(CODEX_FULL_ACCESS_ARGS);
    expect(run.executionRecord.stdout).toBe("Implementation complete");
    expect(run.executionRecord.exitCode).toBe(0);
    expect(run.executionRecord.durationMs).toBe(42);
    expect(run.recordPath.startsWith(path.join(cwd, ".agent-workflow", "runs"))).toBe(true);
    expect(fs.readFileSync(run.recordPath, "utf8")).toContain("\"agentId\": \"implementer\"");
    expect(adapter.run).toHaveBeenCalledWith("codex", CODEX_FULL_ACCESS_ARGS, expect.objectContaining({
      cwd,
      input: expect.stringContaining("Implement 043-cli-agent-runner-foundation"),
    }));
  });

  it("runs a review prompt through the default Reviewer role without stdin input", async () => {
    const cwd = createTempDir();
    const adapter = createAdapter({ stdout: "Approved", exitCode: 0, durationMs: 25 });
    const state = createState({
      repositoryPath: cwd,
      taskScope: "Spec 046 review scope",
      changedFiles: ["tools/agent-workflow/agentRunner.js"],
      validationEvidence: ["npm test passed"],
      results: [{ stage: "implement", decision: "Unknown" }],
    } as Partial<WorkflowState>);

    const run = await runWorkflowAgent(state, {
      cwd,
      stage: "review",
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(run.executionRecord.agentId).toBe("reviewer");
    expect(run.executionRecord.command).toBe("claude");
    expect(run.executionRecord.args[0]).toBe("--dangerously-skip-permissions");
    expect(run.executionRecord.args[1]).toBe("-p");
    expect(run.executionRecord.args[2]).toContain("Repository path");
    expect(run.executionRecord.args[2]).toContain(cwd);
    expect(run.executionRecord.args[2]).toContain("Spec 046 review scope");
    expect(run.executionRecord.args[2]).toContain("tools/agent-workflow/agentRunner.js");
    expect(run.executionRecord.args[2]).toContain("npm test passed");
    expect(adapter.run).toHaveBeenCalledWith("claude", [
      "--dangerously-skip-permissions",
      "-p",
      expect.stringContaining("Review 043-cli-agent-runner-foundation"),
    ], expect.objectContaining({
      cwd,
      input: undefined,
    }));
  });

  it("builds prompt argument invocations without hardcoding Claude in the workflow", () => {
    const invocation = createPromptInvocation({
      agentId: "reviewer",
      identity: "Reviewer",
      command: "reviewer",
      args: ["--prompt", "{prompt}"],
      inputMode: "argument",
      timeoutMs: 1000,
    }, "Review this branch");

    expect(invocation.args).toEqual(["--prompt", "Review this branch"]);
    expect(invocation.input).toBeUndefined();
  });

  it("supports swapped role assignments through local stage configuration", async () => {
    const adapter = createAdapter({ stdout: "fallback implementation complete", exitCode: 0 });
    const state = createState({
      agentRunners: {
        "claude-implementer": {
          identity: "Implementer (Claude CLI)",
          command: "claude",
          args: ["-p", "{{prompt}}"],
          inputMode: "argument",
        },
      },
      stageAgents: {
        implement: "claude-implementer",
      },
    });

    const run = await runWorkflowAgent(state, {
      cwd: createTempDir(),
      stage: "implement",
      processAdapter: adapter,
    });

    expect(run.executionRecord.agentId).toBe("claude-implementer");
    expect(run.executionRecord.command).toBe("claude");
    expect(adapter.run).toHaveBeenCalledWith("claude", ["-p", expect.stringContaining("Implement 043-cli-agent-runner-foundation")], expect.objectContaining({
      input: undefined,
    }));
  });

  it("keeps full-access flags on legacy codex and claude runner aliases", () => {
    expect(DEFAULT_AGENT_RUNNERS.codex.args).toEqual(CODEX_FULL_ACCESS_ARGS);
    expect(DEFAULT_AGENT_RUNNERS.codex.inputMode).toBe("stdin");
    expect(DEFAULT_AGENT_RUNNERS.claude.args).toEqual(CLAUDE_FULL_ACCESS_ARGS);
    expect(DEFAULT_AGENT_RUNNERS.claude.inputMode).toBe("argument");
  });

  it("keeps user-defined runner configuration ahead of built-in full-access defaults", async () => {
    const adapter = createAdapter({ stdout: "custom implementation complete", exitCode: 0 });
    const state = createState({
      agentRunners: {
        implementer: {
          identity: "Custom Implementer",
          command: "custom-codex",
          args: ["run-local"],
          inputMode: "stdin",
        },
      },
    });

    const run = await runWorkflowAgent(state, {
      cwd: createTempDir(),
      stage: "implement",
      processAdapter: adapter,
    });

    expect(run.executionRecord.agentId).toBe("implementer");
    expect(run.executionRecord.command).toBe("custom-codex");
    expect(run.executionRecord.args).toEqual(["run-local"]);
    expect(adapter.run).toHaveBeenCalledWith("custom-codex", ["run-local"], expect.objectContaining({
      input: expect.stringContaining("Implement 043-cli-agent-runner-foundation"),
    }));
  });

  it("records a Reviewer decision and advances the workflow to fix", async () => {
    const adapter = createAdapter({ stdout: "Changes Requested - tighten path containment", exitCode: 0 });
    const state = createState({ results: [{ stage: "implement", decision: "Unknown" }] });

    const run = await runWorkflowAgent(state, {
      cwd: createTempDir(),
      stage: "review",
      processAdapter: adapter,
      now: () => "2026-07-08T00:00:00.000Z",
    });

    expect(run.executionRecord.agentId).toBe("reviewer");
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

  it("handles unavailable Reviewer without recording a review decision", async () => {
    const run = await runWorkflowAgent(createState({ results: [{ stage: "implement", decision: "Unknown" }] }), {
      cwd: createTempDir(),
      stage: "review",
      processAdapter: createAdapter({
        stderr: "spawn claude ENOENT",
        exitCode: null,
        errorMessage: "spawn claude ENOENT",
      }),
    });

    expect(run.executionRecord.outputState).toBe("non-zero");
    expect(run.executionRecord.errorMessage).toContain("ENOENT");
    expect(run.executionRecord.decision).toBe("Unknown");
    expect(run.state.results).toHaveLength(1);
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
    expect(isRemoteMutatingCommand("gh", ["pr", "create"])).toBe(true);
    expect(isRemoteMutatingCommand("gh", ["pr", "ready"])).toBe(true);
    expect(isRemoteMutatingCommand("gh", ["api", "--method", "POST", "/repos/owner/repo/issues"])).toBe(true);
    expect(isRemoteMutatingCommand("gh", ["repo", "delete"])).toBe(true);
    expect(isRemoteMutatingCommand("git", ["push", "origin", "--delete", "feature"])).toBe(true);
    expect(isRemoteMutatingCommand("gh", ["pr", "view", "123"])).toBe(false);
    expect(() => assertSafeCommand({ command: "gh", args: ["pr", "create"] })).toThrow("Remote-mutating");
    expect(() => assertSafeCommand({ command: "gh", args: ["api", "--method", "PATCH", "/repos/owner/repo"] })).toThrow("Remote-mutating");
  });

  it("resolves timed-out real subprocesses after cleanup", async () => {
    const adapter = createDefaultProcessAdapter();

    const result = await adapter.run(process.execPath, [
      "-e",
      "setInterval(() => {}, 1000)",
    ], {
      cwd: createTempDir(),
      timeoutMs: 50,
      killGraceMs: 50,
    });

    expect(result.timedOut).toBe(true);
    expect(result.exitCode === null || typeof result.exitCode === "number").toBe(true);
    expect(result.signal || result.exitCode).toBeTruthy();
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
      implement: "implementer",
      review: "reviewer",
      fix: "implementer",
      "re-review": "reviewer",
      "final-verification": "implementer",
    }));
    expect(DEFAULT_AGENT_RUNNERS.codex.command).toBe("codex");
    expect(DEFAULT_AGENT_RUNNERS.claude.command).toBe("claude");
    expect(DEFAULT_AGENT_RUNNERS.implementer.args).toEqual([
      "--sandbox",
      "danger-full-access",
      "--ask-for-approval",
      "never",
      "exec",
    ]);
    expect(DEFAULT_AGENT_RUNNERS.reviewer.args).toEqual(["--dangerously-skip-permissions", "-p", "{{prompt}}"]);
    expect(() => assertRunnableStage("human-merge-decision")).toThrow("human-only");
  });
});
