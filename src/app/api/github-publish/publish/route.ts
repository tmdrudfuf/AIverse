import crypto from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { isTrustedRuntimeBridgeRequest } from "../../runtime/_lib/RuntimeBridgeOrigin";
import type { RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";
import { GitHubPublishRegistry, getSharedGitHubPublishRegistry } from "../_lib/GitHubPublishRegistry";
import { hasConfiguredRemote, isGitHubWriteAuthorized, isWorkingDirectoryUsable } from "../_lib/GitHubPublishChecks";
import { runGitHubPublishSequence } from "../_lib/GitHubPublishSequence";
import type { GitHubPublishRefusalReason, PublishAuditRecord, PublishResponse } from "../_lib/GitHubPublishTypes";

export const runtime = "nodejs";

function workingDirectoryKey(workingDirectory: string): string {
  return path.resolve(workingDirectory).toLowerCase();
}

const REFUSAL_MESSAGES: Record<GitHubPublishRefusalReason, string> = {
  not_authorized: "GitHub write access is not authorized on this machine (gh auth status did not succeed with the repo scope).",
  no_remote: "This project has no usable, configured GitHub remote.",
  already_running: "A publish attempt is already in progress for this project.",
  nothing_to_publish: "There is nothing to publish: no local changes and nothing ahead of the default branch.",
};

function refusalResponse(reason: GitHubPublishRefusalReason, attemptId: string): PublishResponse {
  return {
    attemptId,
    status: "refused",
    refusalReason: reason,
    branchName: null,
    commitMessage: null,
    pullRequestUrl: null,
    evidence: { stdoutSummary: "", stderrSummary: REFUSAL_MESSAGES[reason], failureStep: null },
  };
}

export type HandlePublishRequestOptions = {
  /** Test-only overrides. `POST` never passes any of these -- production always uses the real checks/registry/spawn. */
  registry?: GitHubPublishRegistry;
  isAuthorizedOverride?: () => Promise<boolean>;
  hasConfiguredRemoteOverride?: (workingDirectory: string) => Promise<boolean>;
  spawnImpl?: RuntimeBridgeSpawnImpl;
};

export async function handlePublishRequest(
  request: NextRequest,
  options: HandlePublishRequestOptions = {},
): Promise<NextResponse<PublishResponse>> {
  if (!isTrustedRuntimeBridgeRequest(request)) {
    return NextResponse.json(refusalResponse("no_remote", crypto.randomUUID()), { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(refusalResponse("no_remote", crypto.randomUUID()), { status: 400 });
  }

  const workingDirectory = (body as { workingDirectory?: unknown })?.workingDirectory;
  if (typeof workingDirectory !== "string" || workingDirectory.length === 0) {
    return NextResponse.json(refusalResponse("no_remote", crypto.randomUUID()), { status: 400 });
  }

  const attemptId = crypto.randomUUID();
  const registry = options.registry ?? getSharedGitHubPublishRegistry();
  const checkAuthorized = options.isAuthorizedOverride ?? (() => isGitHubWriteAuthorized());
  const checkRemote = options.hasConfiguredRemoteOverride ?? ((dir: string) => hasConfiguredRemote(dir));

  const writeAuditAndRefuse = (reason: GitHubPublishRefusalReason): NextResponse<PublishResponse> => {
    const response = refusalResponse(reason, attemptId);
    const now = new Date().toISOString();
    try {
      registry.writeAuditRecord({
        attemptId,
        workingDirectory,
        status: "refused",
        refusalReason: reason,
        branchName: null,
        commitMessage: null,
        pullRequestUrl: null,
        startedAt: now,
        completedAt: now,
        evidence: response.evidence,
      });
    } catch {
      // Best-effort; see the matching comment pattern in the execute route.
    }
    return NextResponse.json(response);
  };

  if (!isWorkingDirectoryUsable(workingDirectory)) {
    return writeAuditAndRefuse("no_remote");
  }

  if (!(await checkAuthorized())) {
    return writeAuditAndRefuse("not_authorized");
  }

  if (!(await checkRemote(workingDirectory))) {
    return writeAuditAndRefuse("no_remote");
  }

  const key = workingDirectoryKey(workingDirectory);
  if (!registry.tryStart(key)) {
    return writeAuditAndRefuse("already_running");
  }

  const startedAt = new Date().toISOString();
  try {
    const sequenceResult = await runGitHubPublishSequence({ workingDirectory, spawnImpl: options.spawnImpl });
    const response: PublishResponse = {
      attemptId,
      status: sequenceResult.status,
      refusalReason: sequenceResult.refusalReason,
      branchName: sequenceResult.branchName,
      commitMessage: sequenceResult.commitMessage,
      pullRequestUrl: sequenceResult.pullRequestUrl,
      evidence: sequenceResult.evidence,
    };

    const auditRecord: PublishAuditRecord = {
      attemptId,
      workingDirectory,
      status: sequenceResult.status,
      refusalReason: sequenceResult.refusalReason,
      branchName: sequenceResult.branchName,
      commitMessage: sequenceResult.commitMessage,
      pullRequestUrl: sequenceResult.pullRequestUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      evidence: sequenceResult.evidence,
    };
    try {
      registry.writeAuditRecord(auditRecord);
    } catch {
      // Best-effort; the response still carries the honest result.
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response: PublishResponse = {
      attemptId,
      status: "failed",
      refusalReason: null,
      branchName: null,
      commitMessage: null,
      pullRequestUrl: null,
      evidence: { stdoutSummary: "", stderrSummary: message, failureStep: null },
    };
    try {
      registry.writeAuditRecord({
        attemptId,
        workingDirectory,
        status: "failed",
        refusalReason: null,
        branchName: null,
        commitMessage: null,
        pullRequestUrl: null,
        startedAt,
        completedAt: new Date().toISOString(),
        evidence: response.evidence,
      });
    } catch {
      // Best-effort.
    }
    return NextResponse.json(response);
  } finally {
    registry.finish(key);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<PublishResponse>> {
  return handlePublishRequest(request);
}
