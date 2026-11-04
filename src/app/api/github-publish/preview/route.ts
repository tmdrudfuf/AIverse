import { NextRequest, NextResponse } from "next/server";

import { isTrustedRuntimeBridgeRequest } from "../../runtime/_lib/RuntimeBridgeOrigin";
import { runRuntimeBridgeProcess, type RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";
import { isWorkingDirectoryUsable } from "../_lib/GitHubPublishChecks";
import { generatePublishMessage } from "../_lib/GitHubPublishMessage";
import { parsePorcelainFiles } from "../_lib/GitHubPublishSequence";
import type { PublishPreview } from "../_lib/GitHubPublishTypes";

export const runtime = "nodejs";

const PREVIEW_TIMEOUT_MS = 15_000;
const EMPTY_PREVIEW: PublishPreview = { changedFiles: [], plannedCommitMessage: generatePublishMessage([]).commitMessage, hasAnythingToPublish: false };

export type HandlePreviewRequestOptions = {
  /** Test-only: substitutes the real `node:child_process.spawn`. */
  spawnImpl?: RuntimeBridgeSpawnImpl;
};

/**
 * Computes the same `{ changedFiles, hasAnythingToPublish }` facts
 * `GitHubPublishSequence` would act on if triggered right now, without
 * creating a branch or touching anything (User Story 2) -- the sequence
 * itself remains the only code path that ever mutates the repo.
 */
export async function handlePreviewRequest(
  request: NextRequest,
  options: HandlePreviewRequestOptions = {},
): Promise<NextResponse<PublishPreview>> {
  if (!isTrustedRuntimeBridgeRequest(request)) {
    return NextResponse.json(EMPTY_PREVIEW, { status: 403 });
  }

  const workingDirectory = request.nextUrl.searchParams.get("workingDirectory");
  if (!workingDirectory || !isWorkingDirectoryUsable(workingDirectory)) {
    return NextResponse.json(EMPTY_PREVIEW, { status: 400 });
  }

  const runGit = (args: string[]) =>
    runRuntimeBridgeProcess("git", args, { cwd: workingDirectory, timeoutMs: PREVIEW_TIMEOUT_MS, spawnImpl: options.spawnImpl }).result;
  const runGh = (args: string[]) =>
    runRuntimeBridgeProcess("gh", args, { cwd: workingDirectory, timeoutMs: PREVIEW_TIMEOUT_MS, spawnImpl: options.spawnImpl }).result;

  const statusResult = await runGit(["status", "--porcelain"]);
  const changedFiles = parsePorcelainFiles(statusResult.stdout);

  const defaultBranchResult = await runGh(["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
  let aheadCount = 0;
  if (defaultBranchResult.exitCode === 0) {
    const defaultBranch = defaultBranchResult.stdout.trim();
    const aheadResult = await runGit(["rev-list", "--count", `origin/${defaultBranch}..HEAD`]);
    aheadCount = Number.parseInt(aheadResult.stdout.trim(), 10) || 0;
  }

  return NextResponse.json({
    changedFiles,
    plannedCommitMessage: generatePublishMessage(changedFiles).commitMessage,
    hasAnythingToPublish: changedFiles.length > 0 || aheadCount > 0,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse<PublishPreview>> {
  return handlePreviewRequest(request);
}
