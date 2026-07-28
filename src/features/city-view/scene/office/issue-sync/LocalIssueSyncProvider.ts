import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { IssueSyncProvider } from "./IssueSyncProvider";
import { createUnavailableIssueSnapshotCollection, type IssueSnapshotCollection } from "./IssueSyncTypes";

const LOCAL_REPOSITORY_UNAVAILABLE_REASON = "Local repository reads need server-side support.";

export class LocalIssueSyncProvider implements IssueSyncProvider {
  readonly providerId = "local";

  async readIssueSnapshots(identity: ProjectRegistryRepositoryIdentity): Promise<IssueSnapshotCollection> {
    return createUnavailableIssueSnapshotCollection(identity, LOCAL_REPOSITORY_UNAVAILABLE_REASON);
  }
}
