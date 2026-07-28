import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { IssueSnapshotCollection } from "./IssueSyncTypes";

export type IssueSyncProvider = {
  readonly providerId: string;
  readIssueSnapshots(identity: ProjectRegistryRepositoryIdentity): Promise<IssueSnapshotCollection>;
};
