import { describe, expect, it } from "vitest";
import {
  createFakeClock,
  createFakeCommandRunner,
  createFakeGitAdapter,
} from "./testDependencies.js";
import { collectGitContext } from "./reviewCommand.js";

describe("createFakeCommandRunner", () => {
  it("returns a deterministic success result", async () => {
    const runner = createFakeCommandRunner([{ stdout: "ok", exitCode: 0 }]);
    const result = await runner.run("mock-agent", [], { cwd: "/fake" });
    expect(result.stdout).toBe("ok");
    expect(result.exitCode).toBe(0);
    expect(runner.spawned).toHaveLength(1);
  });

  it("returns a deterministic failure result", async () => {
    const runner = createFakeCommandRunner([{ stdout: "", stderr: "boom", exitCode: 1 }]);
    const result = await runner.run("mock-agent", [], {});
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("boom");
  });

  it("simulates a timeout and records it as killed", async () => {
    const runner = createFakeCommandRunner([{ timedOut: true, exitCode: null, signal: "SIGKILL" }]);
    const result = await runner.run("mock-agent", [], {});
    expect(result.timedOut).toBe(true);
    expect(runner.killed).toHaveLength(1);
    expect(runner.killed[0].reason).toBe("timeout");
  });

  it("simulates an interruption and records it as killed", async () => {
    const runner = createFakeCommandRunner([{ interrupted: true, exitCode: null }]);
    const result = await runner.run("mock-agent", [], {});
    expect(result.interrupted).toBe(true);
    expect(runner.killed[0].reason).toBe("interrupted");
  });

  it("tracks spawn count across multiple calls", async () => {
    const runner = createFakeCommandRunner([
      { stdout: "one", exitCode: 0 },
      { stdout: "two", exitCode: 0 },
    ]);
    await runner.run("a", [], {});
    await runner.run("b", [], {});
    expect(runner.spawned).toHaveLength(2);
    expect(runner.remaining()).toBe(0);
  });

  it("throws a clear error on an unexpected call beyond the scripted sequence", async () => {
    const runner = createFakeCommandRunner([]);
    await expect(runner.run("unexpected", [], {})).rejects.toThrow(/unexpected process call/i);
  });
});

describe("createFakeGitAdapter", () => {
  it("returns a deterministic branch context through collectGitContext", () => {
    const gitAdapter = createFakeGitAdapter({ state: { currentBranch: "feature/x" } });
    const context = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(context.currentBranch).toBe("feature/x");
    expect(context.repositoryPath).toBe("C:/fake/repo");
  });

  it("returns a deterministic merge base", () => {
    const gitAdapter = createFakeGitAdapter({ state: { mergeBase: "c".repeat(40) } });
    const context = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(context.mergeBase).toBe("c".repeat(40));
  });

  it("returns a deterministic dirty snapshot reflecting staged/unstaged state", () => {
    const gitAdapter = createFakeGitAdapter({
      state: {
        statusPorcelain: "M tracked.txt",
        unstagedDiffStat: "1 file changed",
        unstagedDiff: "-old\n+new",
      },
    });
    const context = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(context.hasUnstagedChanges).toBe(true);
    expect(context.statusPorcelain).toBe("M tracked.txt");
    expect(context.unstagedDiff).toContain("+new");
  });

  it("distinguishes committed diff/stat from unstaged diff/stat", () => {
    const gitAdapter = createFakeGitAdapter({
      state: {
        mergeBase: "d".repeat(40),
        committedLog: "abc123 a commit",
        committedDiffStat: "1 file changed, committed",
        committedDiff: "committed-diff-body",
        unstagedDiffStat: "1 file changed, unstaged",
        unstagedDiff: "unstaged-diff-body",
      },
    });
    const context = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(context.committedDiffStat).toBe("1 file changed, committed");
    expect(context.committedDiff).toBe("committed-diff-body");
    expect(context.unstagedDiffStat).toBe("1 file changed, unstaged");
    expect(context.unstagedDiff).toBe("unstaged-diff-body");
  });

  it("supports a configurable verify() result for base-branch resolution", () => {
    const gitAdapter = createFakeGitAdapter({ verifyResults: { main: false, "origin/main": true } });
    const context = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(context.baseBranchRef).toBe("origin/main");
  });

  it("records every git invocation for call-count assertions", () => {
    const gitAdapter = createFakeGitAdapter();
    collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(gitAdapter.calls.length).toBeGreaterThan(0);
    expect(gitAdapter.calls.some((call) => call.args.join(" ") === "status --porcelain")).toBe(true);
  });

  it("allows setState to simulate a tree mutation between two collectGitContext calls", () => {
    const gitAdapter = createFakeGitAdapter();
    const before = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    gitAdapter.setState({ statusPorcelain: "M tracked.txt", unstagedDiff: "+changed" });
    const after = collectGitContext({ cwd: "/fake", baseBranch: "main", gitAdapter });
    expect(before.statusPorcelain).toBe("");
    expect(after.statusPorcelain).toBe("M tracked.txt");
    expect(after.unstagedDiff).toBe("+changed");
  });
});

describe("createFakeClock", () => {
  it("returns monotonically increasing ISO timestamps", () => {
    const clock = createFakeClock("2026-01-01T00:00:00.000Z");
    const first = clock.now();
    const second = clock.now();
    expect(new Date(second).getTime()).toBeGreaterThan(new Date(first).getTime());
  });

  it("supports manual advancement", () => {
    const clock = createFakeClock("2026-01-01T00:00:00.000Z");
    const first = clock.now();
    clock.advance(60000);
    const second = clock.now();
    expect(new Date(second).getTime() - new Date(first).getTime()).toBeGreaterThanOrEqual(60000);
  });
});

describe("production CLI isolation", () => {
  it("is not imported by cli.js", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const cliSource = fs.readFileSync(path.join(__dirname, "cli.js"), "utf8");
    expect(cliSource).not.toMatch(/testDependencies/);
  });
});
