import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handlePublishRequest } from "./route";
import { GitHubPublishRegistry } from "../_lib/GitHubPublishRegistry";
import type { RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "github-publish-route-"));
}

function createScratchRepoWithRemote() {
  const root = createTempDir();
  const bareRemotePath = path.join(root, "remote.git");
  const repoPath = path.join(root, "repo");
  const run = (args: string[], cwd: string) => {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
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

function createHybridSpawnImpl(ghResponses: Record<string, { stdout: string; exitCode: number }>): RuntimeBridgeSpawnImpl {
  return ((command: string, args: readonly string[], options: unknown) => {
    if (command === "gh") {
      const response = ghResponses[args[0] as string] ?? { stdout: "", exitCode: 1 };
      return createFakeChildProcess(response.stdout, response.exitCode);
    }
    return spawn(command, args as string[], options as never);
  }) as unknown as RuntimeBridgeSpawnImpl;
}

const testRegistryAuditDir = createTempDir();
const testRegistry = new GitHubPublishRegistry(testRegistryAuditDir);

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/github-publish/publish", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { host: "localhost" },
  });
}

function auditRecordPath(attemptId: string) {
  return path.join(testRegistryAuditDir, `${attemptId}.json`);
}

/** Mirrors route.ts's own (private) workingDirectoryKey() exactly. */
function workingDirectoryKey(workingDirectory: string) {
  return path.resolve(workingDirectory).toLowerCase();
}

describe("POST /api/github-publish/publish", () => {
  it("publishes a real change against a real scratch repo (gh faked)", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    const spawnImpl = createHybridSpawnImpl({
      repo: { stdout: "main", exitCode: 0 },
      pr: { stdout: "https://github.com/example/repo/pull/1\n", exitCode: 0 },
    });

    const response = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
      spawnImpl,
    });
    const body = await response.json();

    expect(body.status).toBe("published");
    expect(body.pullRequestUrl).toBe("https://github.com/example/repo/pull/1");
    expect(fs.existsSync(auditRecordPath(body.attemptId))).toBe(true);
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });

  it("refuses not_authorized without touching git at all", async () => {
    const repoPath = createScratchRepoWithRemote();

    const response = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => false,
    });
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("not_authorized");
    expect(fs.existsSync(auditRecordPath(body.attemptId))).toBe(true);
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });

  it("refuses no_remote when the project has no configured remote", async () => {
    const repoPath = createTempDir();
    spawnSync("git", ["init"], { cwd: repoPath });

    const response = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
    });
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("no_remote");
    expect(fs.existsSync(auditRecordPath(body.attemptId))).toBe(true);
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });

  it("refuses nothing_to_publish for a clean, non-ahead repo", async () => {
    const repoPath = createScratchRepoWithRemote();
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const response = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
      spawnImpl,
    });
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("nothing_to_publish");
    expect(fs.existsSync(auditRecordPath(body.attemptId))).toBe(true);
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });

  it("reports failed with the push failureStep and the real branchName when the remote is unreachable", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    spawnSync("git", ["remote", "set-url", "origin", path.join(repoPath, "..", "does-not-exist.git")], { cwd: repoPath });
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const response = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
      spawnImpl,
    });
    const body = await response.json();

    expect(body.status).toBe("failed");
    expect(body.evidence.failureStep).toBe("push");
    expect(body.branchName).toMatch(/^aiverse\/publish-/);
    expect(body.commitMessage).toBe("AIverse maintenance update: 1 file changed");
    expect(fs.existsSync(auditRecordPath(body.attemptId))).toBe(true);
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });

  it("refuses already_running for a second concurrent attempt on the same project", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    const spawnImpl = createHybridSpawnImpl({
      repo: { stdout: "main", exitCode: 0 },
      pr: { stdout: "https://github.com/example/repo/pull/2\n", exitCode: 0 },
    });

    const firstPromise = handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
      spawnImpl,
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const secondResponse = await handlePublishRequest(postRequest({ workingDirectory: repoPath }), {
      registry: testRegistry,
      isAuthorizedOverride: async () => true,
      spawnImpl,
    });
    const secondBody = await secondResponse.json();

    expect(secondBody.status).toBe("refused");
    expect(secondBody.refusalReason).toBe("already_running");
    expect(fs.existsSync(auditRecordPath(secondBody.attemptId))).toBe(true);

    const firstBody = await (await firstPromise).json();
    expect(firstBody.status).toBe("published");
    expect(testRegistry.isActive(workingDirectoryKey(repoPath))).toBe(false);
  });
});
