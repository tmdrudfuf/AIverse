import type { IssueSnapshotCollection } from "../issue-sync/IssueSyncTypes";
import { CandidateTaskMapper } from "./CandidateTaskMapper";
import type { CandidateTaskCollection } from "./CandidateTaskTypes";

export class CandidateTaskService {
  constructor(private readonly mapper = new CandidateTaskMapper()) {}

  mapIssueCollection(projectId: string, collection: IssueSnapshotCollection): CandidateTaskCollection {
    return this.mapper.mapIssueCollection(projectId, collection);
  }
}
