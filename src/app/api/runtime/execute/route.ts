import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { hasPathTraversal, isSafeImplementerCommand, writeCommandFiles } from "@/features/city-view/scene/office/implementer-runtime/ClaudeImplementerRuntimeProvider";
import { isSafeReviewerCommand } from "@/features/city-view/scene/office/reviewer-runtime/CodexReviewerRuntimeProvider";
import { getSharedRuntimeBridgeRunRegistry } from "../_lib/RuntimeBridgeRunRegistry";
import { runRuntimeBridgeProcess } from "../_lib/RuntimeBridgeProcessRunner";
import type {
  RunAuditRecord,
  RuntimeBridgeEvidence,
  RuntimeBridgeExecuteRequest,
  RuntimeBridgeExecuteResponse,
  RuntimeBridgeRefusalReason,
} from "../_lib/RuntimeBridgeTypes";

export const runtime = "nodejs";

const IMPLEMENTER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";
const OUTPUT_SUMMARY_MAX_LENGTH = 2_000;

function truncate(text: string): string {
  return text.length <= OUTPUT_SUMMARY_MAX_LENGTH ? text : `${text.slice(0, OUTPUT_SUMMARY_MAX_LENGTH)}...`;
}

function isRoleEnabled(role: RuntimeBridgeExecuteRequest["role"]): boolean {
  const envVar = role === "implementer" ? IMPLEMENTER_SPAWN_ALLOW_ENV_VAR : REVIEWER_SPAWN_ALLOW_ENV_VAR;
  return process.env[envVar] === "1";
}

function isWorkingDirectoryUsable(workingDirectory: string): boolean {
  if (!workingDirectory || hasPathTraversal(workingDirectory)) return false;
  try {
    return fs.statSync(workingDirectory).isDirectory();
  } catch {
    return false;
  }
}

function workingDirectoryKey(workingDirectory: string): string {
  return path.resolve(workingDirectory).toLowerCase();
}

function substitutePrompt(args: ReadonlyArray<string>, prompt: string, inputMode: "argument" | "stdin"): string[] {
  if (inputMode !== "argument") return [...args];
  const substituted = args.map((arg) => (arg === "{{prompt}}" || arg === "{prompt}" ? prompt : arg));
  return substituted.includes(prompt) ? substituted : [...substituted, prompt];
}

function refusalResponse(
  reason: RuntimeBridgeRefusalReason,
  runId: string,
  commandDisplay: string,
  workingDirectory: string,
): RuntimeBridgeExecuteResponse {
  return {
    runId,
    status: "refused",
    refusalReason: reason,
    evidence: {
      started: false,
      completed: false,
      timedOut: false,
      cancelled: false,
      stdoutSummary: "",
      stderrSummary: "",
      commandDisplay,
      workingDirectory,
    },
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<RuntimeBridgeExecuteResponse>> {
  let body: RuntimeBridgeExecuteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(refusalResponse("unsafe_command", crypto.randomUUID(), "", ""), { status: 400 });
  }

  const { role, command } = body;
  const commandDisplay = [command.command, ...command.arguments].join(" ");
  const runId = crypto.randomUUID();

  if (!isRoleEnabled(role)) {
    return NextResponse.json(refusalResponse("not_enabled", runId, commandDisplay, command.workingDirectory));
  }

  if (!isWorkingDirectoryUsable(command.workingDirectory)) {
    return NextResponse.json(refusalResponse("project_unavailable", runId, commandDisplay, command.workingDirectory));
  }

  const isSafe =
    role === "implementer"
      ? isSafeImplementerCommand(command)
      : isSafeReviewerCommand({ ...command, reviewTargetSha: command.reviewTargetSha ?? "" });
  if (!isSafe) {
    return NextResponse.json(refusalResponse("unsafe_command", runId, commandDisplay, command.workingDirectory));
  }

  if (role === "implementer" && (command.files?.length ?? 0) > 0) {
    const writeResult = await writeCommandFiles(command);
    if (!writeResult.ok) {
      return NextResponse.json(refusalResponse("unsafe_command", runId, commandDisplay, command.workingDirectory));
    }
  }

  const registry = getSharedRuntimeBridgeRunRegistry();
  const key = workingDirectoryKey(command.workingDirectory);

  let liveCancel: () => boolean = () => false;
  const accepted = registry.tryStart(key, runId, { cancel: () => liveCancel() });
  if (!accepted) {
    return NextResponse.json(refusalResponse("already_running", runId, commandDisplay, command.workingDirectory));
  }

  const startedAt = new Date().toISOString();
  const resolvedArgs = substitutePrompt(command.arguments, command.prompt, command.inputMode);
  const handle = runRuntimeBridgeProcess(command.command, resolvedArgs, {
    cwd: command.workingDirectory,
    input: command.inputMode === "stdin" ? command.prompt : undefined,
    timeoutMs: command.timeoutMs,
  });
  liveCancel = handle.cancel;

  const result = await handle.result;
  registry.finish(key);

  const status: RuntimeBridgeExecuteResponse["status"] = result.cancelled
    ? "cancelled"
    : result.timedOut
      ? "timed_out"
      : result.exitCode === 0
        ? "completed"
        : "failed";

  const evidence: RuntimeBridgeEvidence = {
    started: true,
    completed: status === "completed",
    timedOut: result.timedOut,
    cancelled: result.cancelled,
    exitCode: result.exitCode ?? undefined,
    signal: result.signal ?? undefined,
    stdoutSummary: truncate(result.stdout),
    stderrSummary: truncate(result.stderr || result.errorMessage),
    commandDisplay,
    workingDirectory: command.workingDirectory,
  };

  const response: RuntimeBridgeExecuteResponse = { runId, status, refusalReason: null, evidence };

  const auditRecord: RunAuditRecord = {
    runId,
    role,
    status,
    refusalReason: null,
    startedAt,
    completedAt: new Date().toISOString(),
    command: commandDisplay,
    workingDirectory: command.workingDirectory,
    evidence,
  };
  registry.writeAuditRecord(auditRecord);

  return NextResponse.json(response);
}
