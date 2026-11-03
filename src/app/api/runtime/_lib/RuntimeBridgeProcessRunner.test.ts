import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runRuntimeBridgeProcess } from "./RuntimeBridgeProcessRunner";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "runtime-bridge-process-"));
}

describe("runRuntimeBridgeProcess", () => {
  it("resolves a natural, successful completion", async () => {
    const handle = runRuntimeBridgeProcess(process.execPath, ["-e", "console.log('done')"], {
      cwd: createTempDir(),
      timeoutMs: 5_000,
    });

    const result = await handle.result;

    expect(result.stdout.trim()).toBe("done");
    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.cancelled).toBe(false);
  });

  it("records a non-zero exit honestly", async () => {
    const handle = runRuntimeBridgeProcess(process.execPath, ["-e", "process.stderr.write('bad'); process.exit(7)"], {
      cwd: createTempDir(),
      timeoutMs: 5_000,
    });

    const result = await handle.result;

    expect(result.exitCode).toBe(7);
    expect(result.stderr).toBe("bad");
    expect(result.timedOut).toBe(false);
  });

  it("terminates a process that exceeds its timeout and reports timedOut", async () => {
    const handle = runRuntimeBridgeProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd: createTempDir(),
      timeoutMs: 50,
      gracePeriodMs: 50,
    });

    const result = await handle.result;

    expect(result.timedOut).toBe(true);
    expect(result.cancelled).toBe(false);
    expect(result.exitCode === null || typeof result.exitCode === "number").toBe(true);
  });

  it("supports cancelling one specific in-flight run independent of timeout", async () => {
    const handle = runRuntimeBridgeProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      cwd: createTempDir(),
      timeoutMs: 10_000,
      gracePeriodMs: 50,
    });

    const accepted = handle.cancel();
    const result = await handle.result;

    expect(accepted).toBe(true);
    expect(result.cancelled).toBe(true);
    expect(result.timedOut).toBe(false);
  });

  it("cancel() on an already-settled run is a no-op that returns false", async () => {
    const handle = runRuntimeBridgeProcess(process.execPath, ["-e", "console.log('done')"], {
      cwd: createTempDir(),
      timeoutMs: 5_000,
    });

    await handle.result;

    expect(handle.cancel()).toBe(false);
  });

  it("writes stdin input when provided", async () => {
    const handle = runRuntimeBridgeProcess(
      process.execPath,
      ["-e", "process.stdin.on('data', (chunk) => process.stdout.write(chunk))"],
      { cwd: createTempDir(), timeoutMs: 5_000, input: "echoed" },
    );

    const result = await handle.result;

    expect(result.stdout).toBe("echoed");
  });
});
