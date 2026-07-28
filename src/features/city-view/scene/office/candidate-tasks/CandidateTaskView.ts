import type { CandidateTask, CandidateTaskCollection } from "./CandidateTaskTypes";

const CANDIDATE_TASK_TITLE_MAX_LENGTH = 30;

export type CandidateTaskDisplayRows = {
  statusText: string;
  topTaskText?: string;
};

export function createCandidateTaskDisplayRows(
  collection: CandidateTaskCollection | undefined,
): CandidateTaskDisplayRows {
  if (!collection) return { statusText: "Not mapped" };

  if (collection.syncStatus === "NotStarted") return { statusText: "Waiting for raw issue sync" };
  if (collection.syncStatus === "Syncing") return { statusText: "Mapping after issue sync..." };

  if (collection.syncStatus !== "Succeeded") {
    return {
      statusText: `${collection.syncStatus}: ${collection.errorSummary ?? "Raw issue sync unavailable"}`,
    };
  }

  const countText = `${collection.taskCount} candidate ${collection.taskCount === 1 ? "task" : "tasks"}`;
  if (collection.tasks.length === 0) return { statusText: `Succeeded - ${countText}` };

  return {
    statusText: `Succeeded - ${countText}`,
    topTaskText: createTopTaskText(collection.tasks[0]!),
  };
}

function createTopTaskText(task: CandidateTask) {
  const title = truncateForRow(task.title, CANDIDATE_TASK_TITLE_MAX_LENGTH);
  return `${task.estimatedPriority}/${task.estimatedTaskType} #${task.issueNumber} ${title} (${task.state})`;
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}
