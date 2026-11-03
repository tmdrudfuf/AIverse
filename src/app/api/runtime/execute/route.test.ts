import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "./route";
import type { RuntimeBridgeExecuteRequest } from "../_lib/RuntimeBridgeTypes";

const IMPLEMENTER_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "runtime-bridge-execute-"));
}

function postRequest(body: RuntimeBridgeExecuteRequest) {
  return new NextRequest("http://localhost/api/runtime/execute", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

    const response = await POST(postRequest(createRequestBody()));
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("not_enabled");
    expect(body.evidence.started).toBe(false);
  });

  it("refuses with project_unavailable when the working directory does not exist", async () => {
    const response = await POST(
      postRequest(
        createRequestBody({
          command: { ...createRequestBody().command, workingDirectory: "C:/this/path/does/not/exist" },
        }),
      ),
    );
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("project_unavailable");
  });

  it("refuses with unsafe_command when the command line fails existing safety validation", async () => {
    const response = await POST(
      postRequest(
        createRequestBody({
          command: { ...createRequestBody().command, arguments: ["-e", "x", "&&", "git push"] },
        }),
      ),
    );
    const body = await response.json();

    expect(body.status).toBe("refused");
    expect(body.refusalReason).toBe("unsafe_command");
  });

  it("genuinely executes and reports completed with real evidence", async () => {
    const response = await POST(postRequest(createRequestBody()));
    const body = await response.json();

    expect(body.status).toBe("completed");
    expect(body.refusalReason).toBeNull();
    expect(body.evidence.started).toBe(true);
    expect(body.evidence.exitCode).toBe(0);
    expect(body.evidence.stdoutSummary.trim()).toBe("ok");
  });

  it("reports failed on a genuine non-zero exit", async () => {
    const response = await POST(
      postRequest(createRequestBody({ command: { ...createRequestBody().command, arguments: ["-e", "process.exit(3)"] } })),
    );
    const body = await response.json();

    expect(body.status).toBe("failed");
    expect(body.evidence.exitCode).toBe(3);
  });

  it("reports timed_out when the process exceeds its time budget", async () => {
    const response = await POST(
      postRequest(
        createRequestBody({
          command: { ...createRequestBody().command, arguments: ["-e", "setInterval(() => {}, 1000)"], timeoutMs: 100 },
        }),
      ),
    );
    const body = await response.json();

    expect(body.status).toBe("timed_out");
    expect(body.evidence.timedOut).toBe(true);
  });

  it("refuses a second concurrent request for the same working directory with already_running", async () => {
    const workingDirectory = createTempDir();
    const longRunning = createRequestBody({
      command: { ...createRequestBody().command, workingDirectory, arguments: ["-e", "setTimeout(() => {}, 300)"], timeoutMs: 5_000 },
    });

    const firstPromise = POST(postRequest(longRunning));
    await new Promise((resolve) => setTimeout(resolve, 20));

    const secondResponse = await POST(
      postRequest(createRequestBody({ command: { ...createRequestBody().command, workingDirectory } })),
    );
    const secondBody = await secondResponse.json();

    expect(secondBody.status).toBe("refused");
    expect(secondBody.refusalReason).toBe("already_running");

    const firstBody = await (await firstPromise).json();
    expect(firstBody.status).toBe("completed");
  });

  it("frees the working directory for a new run once the prior one finishes", async () => {
    const workingDirectory = createTempDir();
    const first = await POST(
      postRequest(createRequestBody({ command: { ...createRequestBody().command, workingDirectory } })),
    );
    expect((await first.json()).status).toBe("completed");

    const second = await POST(
      postRequest(createRequestBody({ command: { ...createRequestBody().command, workingDirectory } })),
    );
    const secondBody = await second.json();

    expect(secondBody.status).toBe("completed");
  });
});
