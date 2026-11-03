import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { hasPathTraversal, isSafeImplementerCommand, writeCommandFiles } from "@/features/city-view/scene/office/implementer-runtime/ClaudeImplementerRuntimeProvider";
import { isSafeReviewerCommand } from "@/features/city-view/scene/office/reviewer-runtime/CodexReviewerRuntimeProvider";
import { parseReviewOutput } from "@/features/city-view/scene/office/reviewer-runtime/ReviewDecisionParser";
import { getSharedRuntimeBridgeRunRegistry } from "../_lib/RuntimeBridgeRunRegistry";
import { runRuntimeBridgeProcess } from "../_lib/RuntimeBridgeProcessRunner";
import { isTrustedRuntimeBridgeRequest } from "../_lib/RuntimeBridgeOrigin";
import type {
  RunAuditRecord,
  RuntimeBridgeCommand,
  RuntimeBridgeEvidence,
  RuntimeBridgeExecuteRequest,
  RuntimeBridgeExecuteResponse,
  RuntimeBridgeRefusalReason,
  RuntimeBridgeRole,
} from "../_lib/RuntimeBridgeTypes";

export const runtime = "nodejs";

const IMPLEMENTER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN";
const REVIEWER_SPAWN_ALLOW_ENV_VAR = "AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN";
const OUTPUT_SUMMARY_MAX_LENGTH = 2_000;
const MAX_TIMEOUT_MS = 1_800_000; // 30 minutes -- generous for a single agent invocation, bounded against a malformed/malicious request.

// The only two commands this bridge will ever run for real, independent of
// whatever the caller's `command.command` claims -- a Codex review finding
// (P1-001): without this, any JSON body reaching this endpoint could name
// an arbitrary executable once the env gate is on. Overridable only via
// `handleExecuteRequest`'s own `options` parameter, which `POST` itself
// never passes -- tests use it to substitute a harmless real process
// (never "claude"/"codex") so they can exercise genuine spawn/timeout/exit
// behavior without ever invoking a real agent.
const APPROVED_COMMANDS_BY_ROLE: Record<RuntimeBridgeRole, string> = {
  implementer: "claude",
  reviewer: "codex",
};

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= OUTPUT_SUMMARY_MAX_LENGTH) return { text, truncated: false };
  return { text: `${text.slice(0, OUTPUT_SUMMARY_MAX_LENGTH)}...`, truncated: true };
}

function isRoleEnabled(role: RuntimeBridgeRole): boolean {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// Round-3 review finding (P1-001): a client-supplied runId is joined
// directly into the audit file path (RuntimeBridgeRunRegistry.writeAuditRecord).
// Restricting it to this charset makes a traversal sequence ("../") or any
// path separator impossible by construction -- defense in depth alongside
// the registry's own resolved-path check.
const SAFE_RUN_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * Shape-validates the request body (P2-005) before any of it is trusted --
 * a missing field, wrong type, unknown role, or a non-finite/out-of-range
 * `timeoutMs` must refuse cleanly, never reach a 500 or spawn with a
 * malformed timeout.
 */
function parseExecuteRequest(body: unknown): RuntimeBridgeExecuteRequest | null {
  if (!body || typeof body !== "object") return null;
  const { role, command } = body as Record<string, unknown>;
  if (role !== "implementer" && role !== "reviewer") return null;
  if (!command || typeof command !== "object") return null;

  const c = command as Record<string, unknown>;
  if (!isNonEmptyString(c.command)) return null;
  if (!isStringArray(c.arguments)) return null;
  if (c.inputMode !== "argument" && c.inputMode !== "stdin") return null;
  if (!isNonEmptyString(c.workingDirectory)) return null;
  if (typeof c.prompt !== "string") return null;
  if (typeof c.timeoutMs !== "number" || !Number.isFinite(c.timeoutMs) || c.timeoutMs <= 0 || c.timeoutMs > MAX_TIMEOUT_MS) {
    return null;
  }
  if (c.reviewTargetSha !== undefined && typeof c.reviewTargetSha !== "string") return null;
  const { runId: suppliedRunId } = body as Record<string, unknown>;
  if (suppliedRunId !== undefined && (!isNonEmptyString(suppliedRunId) || !SAFE_RUN_ID_PATTERN.test(suppliedRunId))) {
    return null;
  }
  if (c.files !== undefined) {
    if (!Array.isArray(c.files)) return null;
    const filesValid = c.files.every(
      (file) =>
        file &&
        typeof file === "object" &&
        isNonEmptyString((file as Record<string, unknown>).relativePath) &&
        typeof (file as Record<string, unknown>).content === "string" &&
        ((file as Record<string, unknown>).baseDirectory === undefined ||
          (file as Record<string, unknown>).baseDirectory === "workingDirectory" ||
          (file as Record<string, unknown>).baseDirectory === "applicationRoot"),
    );
    if (!filesValid) return null;
  }

  return {
    role,
    command: command as RuntimeBridgeCommand,
    ...(typeof suppliedRunId === "string" ? { runId: suppliedRunId } : {}),
  };
}

const REFUSAL_MESSAGES: Record<RuntimeBridgeRefusalReason, string> = {
  not_enabled: "Real execution is not enabled for this role on this machine.",
  project_unavailable: "The target working directory does not exist, is not readable, or is unsafe to use.",
  already_running: "A real run is already in progress for this working directory.",
  unsafe_command: "Command rejected by safety validation.",
};

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
      durationMs: 0,
      stdoutSummary: "",
      stderrSummary: REFUSAL_MESSAGES[reason],
      outputTruncated: false,
      commandDisplay,
      workingDirectory,
    },
  };
}

export type HandleExecuteRequestOptions = {
  /** Test-only: substitutes the approved command for one role. `POST` never passes this. */
  allowedCommandsByRole?: Partial<Record<RuntimeBridgeRole, string>>;
};

export async function handleExecuteRequest(
  request: NextRequest,
  options: HandleExecuteRequestOptions = {},
): Promise<NextResponse<RuntimeBridgeExecuteResponse>> {
  if (!isTrustedRuntimeBridgeRequest(request)) {
    return NextResponse.json(refusalResponse("unsafe_command", crypto.randomUUID(), "", ""), { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(refusalResponse("unsafe_command", crypto.randomUUID(), "", ""), { status: 400 });
  }

  const parsed = parseExecuteRequest(rawBody);
  if (!parsed) {
    return NextResponse.json(refusalResponse("unsafe_command", crypto.randomUUID(), "", ""), { status: 400 });
  }

  const { role, command } = parsed;
  const commandDisplay = [command.command, ...command.arguments].join(" ");
  const runId = parsed.runId ?? crypto.randomUUID();

  if (!isRoleEnabled(role)) {
    return NextResponse.json(refusalResponse("not_enabled", runId, commandDisplay, command.workingDirectory));
  }

  if (!isWorkingDirectoryUsable(command.workingDirectory)) {
    return NextResponse.json(refusalResponse("project_unavailable", runId, commandDisplay, command.workingDirectory));
  }

  const approvedCommand = options.allowedCommandsByRole?.[role] ?? APPROVED_COMMANDS_BY_ROLE[role];
  if (command.command !== approvedCommand) {
    return NextResponse.json(refusalResponse("unsafe_command", runId, commandDisplay, command.workingDirectory));
  }

  const isSafe =
    role === "implementer"
      ? isSafeImplementerCommand(command)
      : isSafeReviewerCommand({ ...command, reviewTargetSha: command.reviewTargetSha ?? "" });
  if (!isSafe) {
    return NextResponse.json(refusalResponse("unsafe_command", runId, commandDisplay, command.workingDirectory));
  }

  // Concurrency guard MUST come before any file write or spawn (P1-003): a
  // request later refused as already_running must have no side effect on
  // the project at all.
  const registry = getSharedRuntimeBridgeRunRegistry();
  const key = workingDirectoryKey(command.workingDirectory);
  // Round-3 review finding (N-002, non-blocking): a cancel request that
  // arrives during the file-write phase (before `handle.cancel` exists)
  // must not be silently dropped -- `liveCancel` records it so it can be
  // honored the moment the real handle is created, instead of only taking
  // effect for a cancel that arrives after spawn.
  let cancelRequestedEarly = false;
  let liveCancel: () => boolean = () => {
    cancelRequestedEarly = true;
    return true;
  };
  const accepted = registry.tryStart(key, runId, { cancel: () => liveCancel() });
  if (!accepted) {
    return NextResponse.json(refusalResponse("already_running", runId, commandDisplay, command.workingDirectory));
  }

  // Round-2 review finding (P2-002): if the browser tab closes or the
  // request is otherwise aborted mid-run, the real process must not keep
  // running against the project unsupervised. `request.signal` is Next.js's
  // own abort signal for exactly this.
  const onAbort = () => liveCancel();
  request.signal.addEventListener("abort", onAbort);

  const startedAt = new Date().toISOString();
  try {
    if (role === "implementer" && (command.files?.length ?? 0) > 0) {
      const writeResult = await writeCommandFiles(command);
      if (!writeResult.ok) {
        return NextResponse.json(refusalResponse("unsafe_command", runId, commandDisplay, command.workingDirectory));
      }
    }

    const resolvedArgs = substitutePrompt(command.arguments, command.prompt, command.inputMode);
    const handle = runRuntimeBridgeProcess(command.command, resolvedArgs, {
      cwd: command.workingDirectory,
      input: command.inputMode === "stdin" ? command.prompt : undefined,
      timeoutMs: command.timeoutMs,
    });
    liveCancel = handle.cancel;
    if (cancelRequestedEarly) handle.cancel();

    const result = await handle.result;

    const status: RuntimeBridgeExecuteResponse["status"] = result.cancelled
      ? "cancelled"
      : result.timedOut
        ? "timed_out"
        : result.exitCode === 0
          ? "completed"
          : "failed";

    const stdoutSummary = truncate(result.stdout);
    const stderrSummary = truncate(result.stderr || result.errorMessage);

    const evidence: RuntimeBridgeEvidence = {
      // Round-2 review finding (P2-004): a spawn that never actually
      // started (Node's 'error' event -- ENOENT, a broken Windows .cmd
      // shim, etc.) must not be reported as started.
      started: result.errorMessage === "",
      completed: status === "completed",
      timedOut: result.timedOut,
      cancelled: result.cancelled,
      exitCode: result.exitCode ?? undefined,
      signal: result.signal ?? undefined,
      durationMs: result.durationMs,
      stdoutSummary: stdoutSummary.text,
      stderrSummary: stderrSummary.text,
      outputTruncated: stdoutSummary.truncated || stderrSummary.truncated,
      commandDisplay,
      workingDirectory: command.workingDirectory,
    };

    const response: RuntimeBridgeExecuteResponse = { runId, status, refusalReason: null, evidence };
    if (role === "reviewer") {
      const reviewParsed = status === "completed" ? parseReviewOutput(result.stdout, result.exitCode ?? undefined) : { decision: "Unknown" as const, findings: [] };
      response.decision = reviewParsed.decision;
      response.findings = reviewParsed.findings;
    }

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
  } catch (error) {
    // Round-2 review finding (P3-005, non-blocking): a synchronous throw
    // (e.g. an invalid argument spawn rejects on) must still produce an
    // honest, audited "failed" result rather than an unhandled 500 with no
    // audit trail at all.
    const message = error instanceof Error ? error.message : String(error);
    const evidence: RuntimeBridgeEvidence = {
      started: false,
      completed: false,
      timedOut: false,
      cancelled: false,
      durationMs: 0,
      stdoutSummary: "",
      stderrSummary: message,
      outputTruncated: false,
      commandDisplay,
      workingDirectory: command.workingDirectory,
    };
    try {
      registry.writeAuditRecord({
        runId,
        role,
        status: "failed",
        refusalReason: null,
        startedAt,
        completedAt: new Date().toISOString(),
        command: commandDisplay,
        workingDirectory: command.workingDirectory,
        evidence,
      });
    } catch {
      // Round-3 review finding (N-001, non-blocking): recording a failure
      // must never itself produce an unhandled 500 -- the response below
      // still carries the honest result even if the audit write failed.
    }
    return NextResponse.json({ runId, status: "failed", refusalReason: null, evidence });
  } finally {
    // P1-002: guaranteed even if the try block throws (e.g. a synchronous
    // spawn failure), so a working directory is never left permanently
    // already_running.
    request.signal.removeEventListener("abort", onAbort);
    registry.finish(key);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<RuntimeBridgeExecuteResponse>> {
  return handleExecuteRequest(request);
}
