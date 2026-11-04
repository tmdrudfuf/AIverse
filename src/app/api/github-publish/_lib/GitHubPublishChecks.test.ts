import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { hasConfiguredRemote, isGitHubWriteAuthorized } from "./GitHubPublishChecks";
import type { RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";

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

function fakeSpawn(stdout: string, exitCode: number): RuntimeBridgeSpawnImpl {
  return (() => createFakeChildProcess(stdout, exitCode)) as unknown as RuntimeBridgeSpawnImpl;
}

describe("isGitHubWriteAuthorized", () => {
  it("is true when gh auth status exits 0 and reports the repo scope", async () => {
    const authorized = await isGitHubWriteAuthorized(fakeSpawn("Token scopes: 'repo', 'workflow'", 0));
    expect(authorized).toBe(true);
  });

  it("is false when gh auth status fails", async () => {
    const authorized = await isGitHubWriteAuthorized(fakeSpawn("not logged in", 1));
    expect(authorized).toBe(false);
  });

  it("is false when logged in but without the repo scope", async () => {
    const authorized = await isGitHubWriteAuthorized(fakeSpawn("Token scopes: 'gist'", 0));
    expect(authorized).toBe(false);
  });
});

describe("hasConfiguredRemote", () => {
  it("is true when git remote get-url origin succeeds", async () => {
    const result = await hasConfiguredRemote("C:/scratch", fakeSpawn("https://github.com/example/repo.git", 0));
    expect(result).toBe(true);
  });

  it("is false when there is no origin remote", async () => {
    const result = await hasConfiguredRemote("C:/scratch", fakeSpawn("", 1));
    expect(result).toBe(false);
  });
});
