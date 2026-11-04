import { runRuntimeBridgeProcess, type RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";
import { generatePublishMessage } from "./GitHubPublishMessage";
import type { GitHubPublishEvidence, GitHubPublishFailureStep } from "./GitHubPublishTypes";

const OUTPUT_SUMMARY_MAX_LENGTH = 2_000;

export type GitHubPublishSequenceOptions = {
  workingDirectory: string;
  timeoutMs?: number;
  /** Test-only: substitutes the real `node:child_process.spawn`. Reused from RuntimeBridgeProcessRunner's own injection point. */
  spawnImpl?: RuntimeBridgeSpawnImpl;
};

export type GitHubPublishSequenceResult = {
  status: "published" | "refused" | "failed";
  refusalReason: "nothing_to_publish" | null;
  branchName: string | null;
  commitMessage: string | null;
  pullRequestUrl: string | null;
  evidence: GitHubPublishEvidence;
};

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length <= OUTPUT_SUMMARY_MAX_LENGTH ? trimmed : `${trimmed.slice(0, OUTPUT_SUMMARY_MAX_LENGTH)}...`;
}

function parsePorcelainFiles(porcelainOutput: string): string[] {
  return porcelainOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

/**
 * The fixed branch/commit/push/open-PR sequence (research.md Decision 4).
 * Assumes the caller has already confirmed GitHub write access is
 * authorized and the project has a configured remote (research.md
 * Decision 2 -- this module never decides those two refusal reasons
 * itself, the route does, before ever calling this).
 */
export async function runGitHubPublishSequence(
  options: GitHubPublishSequenceOptions,
): Promise<GitHubPublishSequenceResult> {
  const { workingDirectory, timeoutMs = 60_000, spawnImpl } = options;

  const runGit = async (args: string[]) =>
    runRuntimeBridgeProcess("git", args, { cwd: workingDirectory, timeoutMs, spawnImpl }).result;
  const runGh = async (args: string[]) =>
    runRuntimeBridgeProcess("gh", args, { cwd: workingDirectory, timeoutMs, spawnImpl }).result;

  const failed = (
    failureStep: GitHubPublishFailureStep,
    branchName: string | null,
    commitMessage: string | null,
    stdout: string,
    stderr: string,
  ): GitHubPublishSequenceResult => ({
    status: "failed",
    refusalReason: null,
    branchName,
    commitMessage,
    pullRequestUrl: null,
    evidence: { stdoutSummary: truncate(stdout), stderrSummary: truncate(stderr), failureStep },
  });

  const defaultBranchResult = await runGh(["repo", "view", "--json", "defaultBranchRef", "--jq", ".defaultBranchRef.name"]);
  if (defaultBranchResult.exitCode !== 0) {
    return failed("branch", null, null, defaultBranchResult.stdout, defaultBranchResult.stderr || defaultBranchResult.errorMessage);
  }
  const defaultBranch = defaultBranchResult.stdout.trim();

  const statusResult = await runGit(["status", "--porcelain"]);
  const hasUncommitted = statusResult.stdout.trim().length > 0;

  const aheadResult = await runGit(["rev-list", "--count", `origin/${defaultBranch}..HEAD`]);
  const aheadCount = Number.parseInt(aheadResult.stdout.trim(), 10) || 0;

  if (!hasUncommitted && aheadCount === 0) {
    return {
      status: "refused",
      refusalReason: "nothing_to_publish",
      branchName: null,
      commitMessage: null,
      pullRequestUrl: null,
      evidence: { stdoutSummary: "", stderrSummary: "", failureStep: null },
    };
  }

  const branchName = `aiverse/publish-${Date.now()}`;
  const branchResult = await runGit(["checkout", "-b", branchName]);
  if (branchResult.exitCode !== 0) {
    return failed("branch", null, null, branchResult.stdout, branchResult.stderr || branchResult.errorMessage);
  }

  let commitMessage: string | null = null;
  if (hasUncommitted) {
    const changedFiles = parsePorcelainFiles(statusResult.stdout);
    commitMessage = generatePublishMessage(changedFiles).commitMessage;
    const addResult = await runGit(["add", "-A"]);
    if (addResult.exitCode !== 0) {
      return failed("commit", branchName, null, addResult.stdout, addResult.stderr || addResult.errorMessage);
    }
    const commitResult = await runGit(["commit", "-m", commitMessage]);
    if (commitResult.exitCode !== 0) {
      return failed("commit", branchName, null, commitResult.stdout, commitResult.stderr || commitResult.errorMessage);
    }
  }

  const pushResult = await runGit(["push", "-u", "origin", branchName]);
  if (pushResult.exitCode !== 0) {
    return failed("push", branchName, commitMessage, pushResult.stdout, pushResult.stderr || pushResult.errorMessage);
  }

  const diffResult = await runGit(["diff", "--name-only", `origin/${defaultBranch}...${branchName}`]);
  const prFiles = diffResult.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  const generated = generatePublishMessage(prFiles);

  const prResult = await runGh([
    "pr",
    "create",
    "--draft",
    "--base",
    defaultBranch,
    "--head",
    branchName,
    "--title",
    generated.prTitle,
    "--body",
    generated.prBody,
  ]);
  if (prResult.exitCode !== 0) {
    return failed("pull_request", branchName, commitMessage, prResult.stdout, prResult.stderr || prResult.errorMessage);
  }

  return {
    status: "published",
    refusalReason: null,
    branchName,
    commitMessage,
    pullRequestUrl: prResult.stdout.trim(),
    evidence: { stdoutSummary: truncate(prResult.stdout), stderrSummary: "", failureStep: null },
  };
}
