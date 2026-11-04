import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { handlePreviewRequest } from "./route";
import type { RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "github-publish-preview-"));
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

function getRequest(workingDirectory: string | null) {
  const url = workingDirectory
    ? `http://localhost/api/github-publish/preview?workingDirectory=${encodeURIComponent(workingDirectory)}`
    : "http://localhost/api/github-publish/preview";
  return new NextRequest(url, { headers: { host: "localhost" } });
}

describe("GET /api/github-publish/preview", () => {
  it("reports uncommitted changed files and a generated commit message", async () => {
    const repoPath = createScratchRepoWithRemote();
    fs.writeFileSync(path.join(repoPath, "hello.txt"), "hi\n");
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const response = await handlePreviewRequest(getRequest(repoPath), { spawnImpl });
    const body = await response.json();

    expect(body.changedFiles).toEqual(["hello.txt"]);
    expect(body.plannedCommitMessage).toBe("AIverse maintenance update: 1 file changed");
    expect(body.hasAnythingToPublish).toBe(true);
  });

  it("reports nothing to publish for a clean, non-ahead repo", async () => {
    const repoPath = createScratchRepoWithRemote();
    const spawnImpl = createHybridSpawnImpl({ repo: { stdout: "main", exitCode: 0 } });

    const response = await handlePreviewRequest(getRequest(repoPath), { spawnImpl });
    const body = await response.json();

    expect(body.changedFiles).toEqual([]);
    expect(body.hasAnythingToPublish).toBe(false);
  });

  it("refuses a missing workingDirectory with 400", async () => {
    const response = await handlePreviewRequest(getRequest(null));

    expect(response.status).toBe(400);
  });

  it("refuses untrusted origins with 403", async () => {
    const repoPath = createScratchRepoWithRemote();
    const request = new NextRequest(
      `http://localhost/api/github-publish/preview?workingDirectory=${encodeURIComponent(repoPath)}`,
      { headers: { host: "example.com" } },
    );

    const response = await handlePreviewRequest(request);

    expect(response.status).toBe(403);
  });
});
