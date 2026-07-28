import type {
  CandidateAssignmentRecommendation,
  CandidateAssignmentRecommendationCollection,
} from "./CandidateAssignmentTypes";

const ASSIGNMENT_TITLE_MAX_LENGTH = 28;
const ASSIGNMENT_EMPLOYEE_MAX_LENGTH = 18;

export type CandidateAssignmentDisplayRows = {
  statusText: string;
  topRecommendationText?: string;
};

export function createCandidateAssignmentDisplayRows(
  collection: CandidateAssignmentRecommendationCollection | undefined,
): CandidateAssignmentDisplayRows {
  if (!collection) return { statusText: "Not recommended" };

  if (collection.recommendationStatus === "NotStarted") return { statusText: "Waiting for candidate tasks" };
  if (collection.recommendationStatus === "Syncing") return { statusText: "Preparing recommendations..." };

  if (collection.recommendationStatus !== "Succeeded") {
    return {
      statusText: `${collection.recommendationStatus}: ${collection.errorSummary ?? "Candidate tasks unavailable"}`,
    };
  }

  const countText = `${collection.recommendationCount} assignment ${collection.recommendationCount === 1 ? "recommendation" : "recommendations"}`;
  if (collection.recommendations.length === 0) return { statusText: `Succeeded - ${countText}` };

  return {
    statusText: `Succeeded - ${countText}`,
    topRecommendationText: createTopRecommendationText(collection.recommendations[0]!, collection.recommendations.length - 1),
  };
}

function createTopRecommendationText(recommendation: CandidateAssignmentRecommendation, hiddenCount: number) {
  const title = truncateForRow(recommendation.candidateTaskTitle, ASSIGNMENT_TITLE_MAX_LENGTH);
  const employee = recommendation.recommendedEmployeeName
    ? truncateForRow(recommendation.recommendedEmployeeName, ASSIGNMENT_EMPLOYEE_MAX_LENGTH)
    : recommendation.assignmentStatus === "Unavailable"
      ? "No employee data"
      : "No suitable employee";
  const role = recommendation.employeeRole ? ` (${recommendation.employeeRole})` : "";
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";

  return `${recommendation.assignmentStatus} ${recommendation.matchTier} ${recommendation.taskType} #${recommendation.provenance.issueNumber} ${title} -> ${employee}${role}${hiddenText}`;
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}
