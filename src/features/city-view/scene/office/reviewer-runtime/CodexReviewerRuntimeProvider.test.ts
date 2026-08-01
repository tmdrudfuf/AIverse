import { describe, expect, it, vi } from "vitest";

import { CodexReviewerRuntimeProvider, REVIEWER_SPAWN_ALLOW_ENV_VAR, isSafeReviewerCommand } from "./CodexReviewerRuntimeProvider";
import type { ReviewerRuntimeProviderCommand } from "./ReviewerRuntimeProvider";

const APPROVED_ARGS = ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"];

function createCommand(overrides: Partial<ReviewerRuntimeProviderCommand> = {}): ReviewerRuntimeProviderCommand {
  return {
    command: "codex",
    arguments: APPROVED_ARGS,
    inputMode: "stdin",
    workingDirectory: "C:/worktrees/076",
    prompt: "You are the independent Reviewer. Do the approved review.",
    timeoutMs: 60000,
    reviewTargetSha: "abc123",
    ...overrides,
  };
}

function createSpawnSyncStub(result: {
  status?: number | null;
  signal?: string | null;
  error?: { code?: string; message?: string };
  stdout?: string;
  stderr?: string;
}) {
  return vi.fn((_command?: string, _args?: ReadonlyArray<string>, _options?: { cwd: string }) => ({
    status: result.status ?? null,
    signal: result.signal ?? null,
    error: result.error,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  }));
}

describe("CodexReviewerRuntimeProvider", () => {
  it("spawns the exact configured command/argument vector and pipes the prompt over stdin", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0, stdout: "Decision: Approved" });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);
    const command = createCommand();

    await provider.invoke(command);

    expect(spawnSync).toHaveBeenCalledTimes(1);
    const [calledCommand, calledArgs, options] = spawnSync.mock.calls[0]!;
    expect(calledCommand).toBe("codex");
    expect(calledArgs).toEqual(APPROVED_ARGS);
    expect((options as { cwd: string; input?: string }).cwd).toBe(command.workingDirectory);
    expect((options as { input?: string }).input).toBe(command.prompt);
  });

  it("maps a Completed run with Decision: Approved output to status Completed / decision Approved", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0, stdout: "Decision: Approved" });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Completed");
    expect(result.decision).toBe("Approved");
    expect(result.evidence.agentId).toBe("Codex");
    expect(result.evidence.role).toBe("Reviewer");
    expect(result.evidence.reviewTargetSha).toBe("abc123");
  });

  it("parses a blocking finding that appears after the 2000-character evidence-summary truncation boundary, downgrading Approved to ChangesRequested", async () => {
    const padding = "x".repeat(2100);
    const stdout = `Decision: Approved\n${padding}\nFinding: P1 | blocking | safety | src/example.ts:1 | Late finding past the truncation boundary`;
    const spawnSync = createSpawnSyncStub({ status: 0, stdout });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Completed");
    expect(result.decision).toBe("ChangesRequested");
    expect(result.findings).toHaveLength(1);
    expect(result.evidence.outputTruncated).toBe(true);
  });

  it("represents Completed status with a ChangesRequested decision as distinct, truthful fields", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0, stdout: "Decision: Changes Requested" });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Completed");
    expect(result.decision).toBe("ChangesRequested");
  });

  it("maps an ETIMEDOUT/SIGTERM kill to TimedOut with Unknown decision", async () => {
    const spawnSync = createSpawnSyncStub({ status: null, signal: "SIGTERM", error: { code: "ETIMEDOUT" } });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("TimedOut");
    expect(result.decision).toBe("Unknown");
    expect(result.evidence.timedOut).toBe(true);
  });

  it("maps a spawn failure to Failed without leaking the raw error", async () => {
    const spawnSync = createSpawnSyncStub({ status: null, signal: null, error: { code: "ENOENT", message: "spawnSync codex ENOENT /internal" } });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand());

    expect(result.status).toBe("Failed");
    expect(result.decision).toBe("Unknown");
    expect(result.evidence.stderrSummary).not.toContain("/internal");
  });

  it("blocks without spawning when the configured command is unsafe (git push)", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0 });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand({ command: "git", arguments: ["push"] }));

    expect(result.status).toBe("Blocked");
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("blocks without spawning on unsafe redirection", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0 });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand({ arguments: [...APPROVED_ARGS, "> out.txt"] }));

    expect(result.status).toBe("Blocked");
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("blocks without spawning on shell chaining", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0 });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand({ arguments: [...APPROVED_ARGS, "&&", "rm -rf /"] }));

    expect(result.status).toBe("Blocked");
    expect(spawnSync).not.toHaveBeenCalled();
  });

  it("reports Blocked/provider-unavailable in a simulated browser environment without attempting a spawn", async () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {};
    try {
      const provider = new CodexReviewerRuntimeProvider();
      const result = await provider.invoke(createCommand());
      expect(result.status).toBe("Blocked");
      expect(result.evidence.started).toBe(false);
    } finally {
      if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  it("reports Blocked without spawning when the reviewer-specific spawn-allow env var is not set", async () => {
    const original = process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    try {
      const provider = new CodexReviewerRuntimeProvider();
      const result = await provider.invoke(
        createCommand({ command: process.execPath, arguments: ["-e", "process.exit(0)"], workingDirectory: process.cwd() }),
      );
      expect(result.status).toBe("Blocked");
      expect(result.evidence.stderrSummary).toContain(REVIEWER_SPAWN_ALLOW_ENV_VAR);
    } finally {
      if (original === undefined) delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
      else process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = original;
    }
  });

  it("does not spawn merely because the Implementer's own spawn-allow env var is set -- the gates are independent", async () => {
    delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    process.env.AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN = "1";
    try {
      const provider = new CodexReviewerRuntimeProvider();
      const result = await provider.invoke(
        createCommand({ command: process.execPath, arguments: ["-e", "process.exit(0)"], workingDirectory: process.cwd() }),
      );
      expect(result.status).toBe("Blocked");
    } finally {
      delete process.env.AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN;
    }
  });

  it("actually resolves and invokes the real node:child_process spawnSync only once the reviewer spawn-allow env var is explicitly set", async () => {
    const original = process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = "1";
    try {
      const provider = new CodexReviewerRuntimeProvider();
      const result = await provider.invoke(
        createCommand({
          command: process.execPath,
          arguments: ["-e", "process.exit(0)"],
          workingDirectory: process.cwd(),
          inputMode: "argument",
          prompt: "",
        }),
      );
      expect(result.status).toBe("Completed");
      expect(result.evidence.exitCode).toBe(0);
    } finally {
      if (original === undefined) delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
      else process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = original;
    }
  });

  describe("isSafeReviewerCommand", () => {
    it("accepts the approved Codex command line", () => {
      expect(isSafeReviewerCommand(createCommand())).toBe(true);
    });

    it("rejects when the underlying reused isSafeCommandLine check fails", () => {
      expect(isSafeReviewerCommand(createCommand({ command: "gh", arguments: ["pr", "merge"] }))).toBe(false);
    });

    it("rejects when the underlying reused isSafeImplementerCommandLine check fails (encoded PowerShell)", () => {
      expect(isSafeReviewerCommand(createCommand({ command: "powershell", arguments: ["-EncodedCommand", "ZABlAGwA"] }))).toBe(false);
    });

    it("rejects a workingDirectory containing a path traversal segment", () => {
      expect(isSafeReviewerCommand(createCommand({ workingDirectory: "C:/worktrees/076/../../etc" }))).toBe(false);
    });
  });

  it("blocks without spawning when workingDirectory contains a path traversal segment", async () => {
    const spawnSync = createSpawnSyncStub({ status: 0 });
    const provider = new CodexReviewerRuntimeProvider(spawnSync);

    const result = await provider.invoke(createCommand({ workingDirectory: "C:/worktrees/076/../../etc" }));

    expect(result.status).toBe("Blocked");
    expect(spawnSync).not.toHaveBeenCalled();
  });
});
