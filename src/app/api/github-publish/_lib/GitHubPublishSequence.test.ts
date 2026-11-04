import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePorcelainFiles, runGitHubPublishSequence } from "./GitHubPublishSequence";
import type { RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";

function createScratchRepoWithRemote() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "github-publish-seq-"));
  const bareRemotePath = path.join(root, "remote.git");
  const repoPath = path.join(root, "repo");
  const run = (args: string[], cwd: string) => {
    const result = require("node:child_process").spawnSync("git", args, { cwd, encoding: "utf8" });
    if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  };
  run(["init", "--bare", bareRemotePath], root);
  fs.mkdirSync(repoPath);
  run(["init"], repoPath);
  run(["config", "user.email", "scratch@example.com"], repoPath);
  run(["config", "user.name", "Scratch"], repoPath);
  fs.writeFileSync(path.join(repoPath, "README.md"), "scratch\n");
  run(["add", "-A"], repoPath);
  run(["commit", "-m", "initial"], repoPath);
  run(["branch", "-M", "main"], repoPath);
  run(["remote", "add", "origin", bareRemotePath], repoPath);
  run(["push", "-u", "origin", "main"], repoPath);
  return repoPath;
}

/** A minimal fake ChildProcess satisfying everything RuntimeBridgeProcessRunner touches. */
function createFakeChildProcess(stdout: string, exitCode: number) {
  const emitter = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { on: () => void; write: () => void; end: () => void };
    exitCode: number | null;
    signalCode: string | null;
    kill: () => boolean;
  };
  emitter.stdout = new EventEmitter();
  emitter.stderr = new EventEmitter();
  emitter.stdin = { on: () => {}, write: () => {}, end: () => {} };
  emitter.exitCode = null;
  emitter.signalCode = null;
  emitter.kill = () => true;
  queueMicrotask(() => {
    emitter.stdout.emit("data", Buffer.from(stdout));
    emitter.exitCode = exitCode;
    emitter.emit("close", exitCode, null);
  });
  return emitter;
}

/** Real `git`, faked `gh` (a real GitHub API call cannot be exercised safely here). */
function createHybridSpawnImpl(ghResponses: Record<string, { stdout: string; exitCode: number }>): RuntimeBridgeSpawnImpl {
  return ((command: string, args: readonly string[], options: unknown) => {
    if (command === "gh") {
      const key = args[0] as string;
      const response = ghResponses[key] ?? { stdout: "", exitCode: 1 };
      return createFakeChildProcess(response.stdout, response.exitCode);
    }
    return spawn(command, args as string[], options as never);
  }) as unknown as RuntimeBridgeSpawnImpl;
}

describe("parsePorcelainFiles", () => {
  // Regression coverage for a real bug found via Spec 150 T023's scratch-
  // repo verification: a modified *tracked* file's porcelain line has a
  // leading status space (" M file") that a pre-slice .trim() used to eat,
  // truncating the filename (README.md -> EADME.md). Untracked files ("??
  // file") have no leading space, which is why the existing sequence tests
  // -- all using brand-new files -- never caught this.
  it("parses a modified tracked file without truncating its name", () => {
    expect(parsePorcelainFiles(" M README.md\n")).toEqual(["README.md"]);
  });

  it("parses an untracked file", () => {
    expect(parsePorcelainFiles("?? hello.txt\n")).toEqual(["hello.txt"]);
  });

  it("parses a staged addition", () => {
    expect(parsePorcelainFiles("A  new.txt\n")).toEqual(["new.txt"]);
  });

  it("handles multiple lines and Windows-style line endings", () => {
    expect(parsePorcelainFiles(" M README.md\r\n?? hello.txt\r\n")).toEqual(["README.md", "hello.txt"]);
  });
});

describe("runGitHubPublishSequence", () => {
  it("commits uncommitted changes, pushes, and opens a PR (published)", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    // Also modify the already-tracked README.md -- regression coverage for
    // the parsePorcelainFiles truncation bug above (brand-new untracked
    // files alone never exercised the " M " leading-space case).
    fs.appendFileSync(path.join(repoPath, "README.md"), "more\n");
    const spawnImpl = createHybridSpawnImpl({
      repo: { stdout: "main", exitCode: 0 },
      pr: { stdout: "https://github.com/example/repo/pull/1\n", exitCode: 0 },
    });

    const result = await runGitHubPublishSequence({ workingDirectory: repoPath, spawnImpl });

    expect(result.status).toBe("published");
    expect(result.branchName).toMatch(/^aiverse\/publish-/);
    expect(result.commitMessage).toContain("2 files changed");
    expect(result.pullRequestUrl).toBe("https://github.com/example/repo/pull/1");
  });

  it("pushes already-committed-but-unpushed work without an extra empty commit", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    require("node:child_process").spawnSync("git", ["add", "-A"], { cwd: repoPath });
    require("node:child_process").spawnSync("git", ["commit", "-m", "already committed"], { cwd: repoPath });
    const spawnImpl = createHybridSpawnImpl({
      repo: { stdout: "main", exitCode: 0 },
      pr: { stdout: "https://github.com/example/repo/pull/2\n", exitCode: 0 },
    });

    const result = await runGitHubPublishSequence({ workingDirectory: repoPath, spawnImpl });

    expect(result.status).toBe("published");
    expect(result.commitMessage).toBeNull(); // nothing was committed BY this sequence
    expect(result.pullRequestUrl).toBe("https://github.com/example/repo/pull/2");
  });

  it("refuses nothing_to_publish without creating any branch when clean and not ahead", async () => {
    const repoPath = createScratchRepoWithRemote();
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const result = await runGitHubPublishSequence({ workingDirectory: repoPath, spawnImpl });

    expect(result.status).toBe("refused");
    expect(result.refusalReason).toBe("nothing_to_publish");
    expect(result.branchName).toBeNull();
  });

  it("reports a failed push with the correct failureStep and the branch that was created", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    // Point origin at a nonexistent path so the real `git push` genuinely fails.
    require("node:child_process").spawnSync("git", ["remote", "set-url", "origin", "/does/not/exist.git"], { cwd: repoPath });
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const result = await runGitHubPublishSequence({ workingDirectory: repoPath, spawnImpl });

    expect(result.status).toBe("failed");
    expect(result.evidence.failureStep).toBe("push");
    expect(result.branchName).toMatch(/^aiverse\/publish-/);
    expect(result.commitMessage).toContain("1 file changed");
  });

  it("reports a failed pull_request step honestly when gh pr create fails", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    const spawnImpl = createHybridSpawnImpl({
      repo: { stdout: "main", exitCode: 0 },
      pr: { stdout: "", exitCode: 1 },
    });

    const result = await runGitHubPublishSequence({ workingDirectory: repoPath, spawnImpl });

    expect(result.status).toBe("failed");
    expect(result.evidence.failureStep).toBe("pull_request");
    expect(result.branchName).toMatch(/^aiverse\/publish-/);
    expect(result.pullRequestUrl).toBeNull();
  });
});
