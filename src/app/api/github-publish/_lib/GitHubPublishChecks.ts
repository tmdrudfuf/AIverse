import { runRuntimeBridgeProcess, type RuntimeBridgeSpawnImpl } from "../../runtime/_lib/RuntimeBridgeProcessRunner";

const CHECK_TIMEOUT_MS = 10_000;

/**
 * "GitHub write access authorized" (FR-004) is a live, derived fact --
 * `gh auth status` succeeding with the `repo` scope -- never a new secret
 * the operator types into AIverse (research.md Decision 1).
 */
export async function isGitHubWriteAuthorized(spawnImpl?: RuntimeBridgeSpawnImpl): Promise<boolean> {
  const result = await runRuntimeBridgeProcess("gh", ["auth", "status"], {
    cwd: process.cwd(),
    timeoutMs: CHECK_TIMEOUT_MS,
    spawnImpl,
  }).result;
  if (result.exitCode !== 0) return false;
  const combined = `${result.stdout}\n${result.stderr}`;
  return combined.includes("repo");
}

/** Whether the registered project's local git repo has a configured `origin` remote. */
export async function hasConfiguredRemote(workingDirectory: string, spawnImpl?: RuntimeBridgeSpawnImpl): Promise<boolean> {
  const result = await runRuntimeBridgeProcess("git", ["remote", "get-url", "origin"], {
    cwd: workingDirectory,
    timeoutMs: CHECK_TIMEOUT_MS,
    spawnImpl,
  }).result;
  return result.exitCode === 0 && result.stdout.trim().length > 0;
}
