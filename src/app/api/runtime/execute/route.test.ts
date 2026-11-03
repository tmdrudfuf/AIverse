import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleExecuteRequest } from "./route";
import type { RuntimeBridgeExecuteRequest } from "../_lib/RuntimeBridgeTypes";

const IMPLEMENTER_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";

// Every test below stands in for the real "claude"/"codex" command with a
// harmless, always-available real process (this test file's own Node
// binary) via this test-only override -- production's `POST` never passes
// it, so the real allowlist (route.ts's APPROVED_COMMANDS_BY_ROLE) is never
// weakened. See route.ts's own comment on `handleExecuteRequest`'s options.
const TEST_ALLOWED_COMMANDS = { implementer: process.execPath, reviewer: process.execPath };

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "runtime-bridge-execute-"));
}

function postRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost/api/runtime/execute", {
    method: "POST",
    body: JSON.stringify(body),
    // A manually-constructed Request/NextRequest never gets a `Host` header
    // for free the way a real HTTP request does, so tests supply the one a
    // genuine same-origin request would have; `isTrustedRuntimeBridgeRequest`
    // requires it. Explicit `headers` (e.g. a cross-origin test) override it.
    headers: { host: "localhost", ...headers },
  });
}

function callExecute(body: unknown, headers?: Record<string, string>) {
  return handleExecuteRequest(postRequest(body, headers), { allowedCommandsByRole: TEST_ALLOWED_COMMANDS });
}

function createRequestBody(overrides: Partial<RuntimeBridgeExecuteRequest> = {}): RuntimeBridgeExecuteRequest {
  return {
    role: "implementer",
    command: {
      command: process.execPath,
      arguments: ["-e", "console.log('ok')"],
      inputMode: "argument",
      workingDirectory: createTempDir(),
      prompt: "ignored",
      timeoutMs: 5_000,
    },
    ...overrides,
  };
}

describe("POST /api/runtime/execute", () => {
  const originalImplementerEnv = process.env[IMPLEMENTER_ENV_VAR];
  const originalReviewerEnv = process.env[REVIEWER_ENV_VAR];

  beforeEach(() => {
    process.env[IMPLEMENTER_ENV_VAR] = "1";
    process.env[REVIEWER_ENV_VAR] = "1";
  });

  afterEach(() => {
    process.env[IMPLEMENTER_ENV_VAR] = originalImplementerEnv;
    process.env[REVIEWER_ENV_VAR] = originalReviewerEnv;
  });

  it("refuses with not_enabled when the role's env var is unset", async () => {
    delete process.env[IMPLEMENTER_ENV_VAR];

    const response = await callExecute(createRequestBody());
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("not_enabled");
    expect(body.evidence.started).toBe(false);
    expect(body.evidence.stderrSummary).toMatch(/not enabled/i);
  });

  it("refuses with project_unavailable when the working directory does not exist", async () => {
    const response = await callExecute(
      createRequestBody({ command: { ...createRequestBody().command, workingDirectory: "C:/this/path/does/not/exist" } }),
    );
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("project_unavailable");
    expect(body.evidence.stderrSummary).toMatch(/does not exist|not readable|unsafe/i);
  });

  it("refuses with unsafe_command when the command line fails existing safety validation", async () => {
    const response = await callExecute(
      createRequestBody({ command: { ...createRequestBody().command, arguments: ["-e", "x", "&&", "git push"] } }),
    );
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("unsafe_command");
    expect(body.evidence.stderrSummary).toMatch(/safety validation/i);
  });

  it("refuses with unsafe_command when command.command is not the approved executable for the role (no test override)", async () => {
    // Deliberately calls handleExecuteRequest directly WITHOUT the test
    // override, proving production's own allowlist (not just the test
    // harness) rejects an arbitrary executable.
    const response = await handleExecuteRequest(postRequest(createRequestBody()));
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("unsafe_command");
  });

  it("refuses a cross-origin request before even parsing the body", async () => {
    const response = await callExecute(createRequestBody(), { origin: "https://evil.example" });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe("refused");
  });

  it("refuses a malformed body (missing command fields) without a 500", async () => {
    const response = await callExecute({ role: "implementer", command: { command: "claude" } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.status).toBe("refused");
  });

  it("refuses a non-finite or out-of-range timeoutMs", async () => {
    const response = await callExecute(
      createRequestBody({ command: { ...createRequestBody().command, timeoutMs: Number.NaN } }),
    );

    expect(response.status).toBe(400);
  });

  it("refuses a client-supplied runId containing path traversal characters", async () => {
    const response = await callExecute(createRequestBody({ runId: "../../../../etc/passwd" }));

    expect(response.status).toBe(400);
  });

  it("accepts a client-supplied runId and uses it as-is in the response", async () => {
    const response = await callExecute(createRequestBody({ runId: "abc-123_XYZ" }));
    const body = await response.json();

    expect(body.runId).toBe("abc-123_XYZ");
  });

  it("genuinely executes and reports completed with real evidence", async () => {
    const response = await callExecute(createRequestBody());
    const body = await response.json();

    expect(body.status).toBe("completed");
    expect(body.refusalReason).toBeNull();
    expect(body.evidence.started).toBe(true);
    expect(body.evidence.exitCode).toBe(0);
    expect(body.evidence.stdoutSummary.trim()).toBe("ok");
  });

  it("reports failed on a genuine non-zero exit", async () => {
    const response = await callExecute(
      createRequestBody({ command: { ...createRequestBody().command, arguments: ["-e", "process.exit(3)"] } }),
    );
    const body = await response.json();

    expect(body.status).toBe("failed");
    expect(body.evidence.exitCode).toBe(3);
  });

  it("reports timed_out when the process exceeds its time budget", async () => {
    const response = await callExecute(
      createRequestBody({
        command: { ...createRequestBody().command, arguments: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 100 },
      }),
    );
    const body = await response.json();

    expect(body.status).toBe("timed_out");
    expect(body.evidence.timedOut).toBe(true);
  });

  it("refuses a second concurrent request for the same working directory with already_running, and a refused request never writes implementer files", async () => {
    const workingDirectory = createTempDir();
    const longRunning = createRequestBody({
      command: { ...createRequestBody().command, workingDirectory, arguments: ["-e", "setTimeout(() => {}, 300)"], timeoutMs: 5_000 },
    });

    const firstPromise = callExecute(longRunning);
    await new Promise((resolve) => setTimeout(resolve, 20));

    const secondResponse = await callExecute(
      createRequestBody({
        command: {
          ...createRequestBody().command,
          workingDirectory,
          files: [{ relativePath: "should-not-be-written.txt", content: "x" }],
        },
      }),
    );
    const secondBody = await secondResponse.json();

    expect(secondBody.status).toBe("refused");
    expect(secondBody.refusalReason).toBe("already_running");
    expect(secondBody.evidence.stderrSummary).toMatch(/already in progress/i);
    expect(fs.existsSync(path.join(workingDirectory, "should-not-be-written.txt"))).toBe(false);

    const firstBody = await (await firstPromise).json();
    expect(firstBody.status).toBe("completed");
  });

  it("frees the working directory for a new run once the prior one finishes", async () => {
    const workingDirectory = createTempDir();
    const first = await callExecute(createRequestBody({ command: { ...createRequestBody().command, workingDirectory } }));
    expect((await first.json()).status).toBe("completed");

    const second = await callExecute(createRequestBody({ command: { ...createRequestBody().command, workingDirectory } }));
    const secondBody = await second.json();

    expect(secondBody.status).toBe("completed");
  });

  it("cancels the real process when the request is aborted mid-run (e.g. the browser tab closes)", async () => {
    const controller = new AbortController();
    const request = new NextRequest("http://localhost/api/runtime/execute", {
      method: "POST",
      body: JSON.stringify(
        createRequestBody({
          command: { ...createRequestBody().command, arguments: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 10_000 },
        }),
      ),
      headers: { host: "localhost" },
      signal: controller.signal,
    });

    const responsePromise = handleExecuteRequest(request, { allowedCommandsByRole: TEST_ALLOWED_COMMANDS });
    await new Promise((resolve) => setTimeout(resolve, 20));
    controller.abort();

    const body = await (await responsePromise).json();

    expect(body.status).toBe("cancelled");
  });

  it("lets the caller supply its own runId so it can be cancelled by a concurrent DELETE while still in flight", async () => {
    const clientRunId = "client-generated-run-id";
    const response = await callExecute(
      createRequestBody({ runId: clientRunId, command: { ...createRequestBody().command, arguments: ["-e", "console.log('ok')"] } }),
    );
    const body = await response.json();

    expect(body.runId).toBe(clientRunId);
  });

  it("reports started: false when the process genuinely never started (e.g. the executable does not exist)", async () => {
    const nonexistentCommand = path.join(createTempDir(), "this-binary-does-not-exist");
    const response = await handleExecuteRequest(
      postRequest(createRequestBody({ command: { ...createRequestBody().command, command: nonexistentCommand } })),
      { allowedCommandsByRole: { implementer: nonexistentCommand } },
    );
    const body = await response.json();

    expect(body.status).toBe("failed");
    expect(body.evidence.started).toBe(false);
  });
});
