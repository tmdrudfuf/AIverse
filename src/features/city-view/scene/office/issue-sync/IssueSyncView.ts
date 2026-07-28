import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { createNotStartedIssueSnapshotCollection, type IssueSnapshot, type IssueSnapshotCollection } from "./IssueSyncTypes";

const ISSUE_LIST_TITLE_MAX_LENGTH = 34;
const ISSUE_DETAIL_LABEL_MAX_COUNT = 2;
const ISSUE_DETAIL_LABEL_MAX_LENGTH = 8;
const ISSUE_DETAIL_ASSIGNEE_MAX_COUNT = 1;
const ISSUE_DETAIL_ASSIGNEE_MAX_LENGTH = 10;

export type IssueSyncDisplayRows = {
  statusText: string;
  issueListText?: string;
  issueDetailText?: string;
};

export function createIssueSyncDisplayRows(
  identity: ProjectRegistryRepositoryIdentity | undefined,
  collection: IssueSnapshotCollection | undefined,
): IssueSyncDisplayRows {
  if (!identity) return { statusText: "No repository identity" };

  const resolved = collection ?? createNotStartedIssueSnapshotCollection(identity);

  if (resolved.syncStatus === "NotStarted") return { statusText: "Not started" };
  if (resolved.syncStatus === "Syncing") return { statusText: "Syncing..." };

  if (resolved.syncStatus === "Succeeded") {
    const partialSuffix = resolved.isTruncated ? " · partial" : "";
    const statusText = `Succeeded · ${resolved.openCount} open, ${resolved.closedCount} closed${partialSuffix}`;
    if (resolved.issues.length === 0) return { statusText };

    const topIssue = resolved.issues[0];
    const hiddenCount = resolved.issues.length - 1;

    return {
      statusText,
      issueListText: createIssueListText(topIssue, hiddenCount),
      issueDetailText: createIssueDetailText(topIssue),
    };
  }

  const reason = resolved.errorSummary ?? "No further detail is available.";
  return { statusText: `${resolved.syncStatus}: ${reason}` };
}

function createIssueListText(issue: IssueSnapshot, hiddenCount: number): string {
  const title = truncateForRow(issue.title, ISSUE_LIST_TITLE_MAX_LENGTH);
  const entry = `#${issue.number} ${title} (${issue.state})`;
  return hiddenCount > 0 ? `${entry}; +${hiddenCount} more` : entry;
}

function createIssueDetailText(issue: IssueSnapshot): string | undefined {
  const labelsText = createBoundedListText(issue.labels, ISSUE_DETAIL_LABEL_MAX_COUNT, ISSUE_DETAIL_LABEL_MAX_LENGTH);
  const assigneesText = createBoundedListText(
    issue.assignees,
    ISSUE_DETAIL_ASSIGNEE_MAX_COUNT,
    ISSUE_DETAIL_ASSIGNEE_MAX_LENGTH,
  );

  const clauses = [
    labelsText ? `Labels: ${labelsText}` : undefined,
    assigneesText ? `Assignees: ${assigneesText}` : undefined,
  ].filter((clause): clause is string => clause !== undefined);

  return clauses.length > 0 ? clauses.join(" · ") : undefined;
}

function createBoundedListText(items: string[], maxCount: number, maxItemLength: number): string | undefined {
  if (items.length === 0) return undefined;

  const visible = items.slice(0, maxCount).map((item) => truncateForRow(item, maxItemLength));
  const hiddenCount = items.length - visible.length;
  return [...visible, ...(hiddenCount > 0 ? [`+${hiddenCount}`] : [])].join(", ");
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
