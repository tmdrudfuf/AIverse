import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { createNotStartedRepositorySyncSnapshot, type RepositorySyncSnapshot } from "./RepositorySyncTypes";

const SHORT_SHA_LENGTH = 7;

export function createRepositorySyncDisplayRows(
  identity: ProjectRegistryRepositoryIdentity | undefined,
  snapshot: RepositorySyncSnapshot | undefined,
): string[] {
  if (!identity) return [];

  const resolved = snapshot ?? createNotStartedRepositorySyncSnapshot(identity);

  if (resolved.syncStatus === "NotStarted") return ["Not started"];
  if (resolved.syncStatus === "Syncing") return ["Syncing..."];

  if (resolved.syncStatus === "Succeeded") {
    const branch = resolved.currentBranch ?? resolved.defaultBranch;
    const branchSegment = branch ? ` · ${branch}` : "";
    const commitSegment = resolved.latestCommit ? ` · ${resolved.latestCommit.sha.slice(0, SHORT_SHA_LENGTH)}` : "";
    return [`Succeeded${branchSegment}${commitSegment}`];
  }

  const reason = resolved.errorSummary ?? "No further detail is available.";
  return [`${resolved.syncStatus}: ${reason}`];
}
