import type { CandidateAssignmentRecommendation, CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTask, CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import {
  type CandidatePromotionEligibility,
  findAssignmentForTask,
} from "./CandidatePromotionTypes";

export function evaluateCandidatePromotionEligibility(
  candidateTasks: CandidateTaskCollection,
  task: CandidateTask,
  assignments: CandidateAssignmentRecommendationCollection | undefined,
): {
  eligibility: CandidatePromotionEligibility;
  assignment?: CandidateAssignmentRecommendation;
} {
  if (candidateTasks.syncStatus !== "Succeeded") {
    return {
      eligibility: unavailable("CANDIDATE_TASKS_UNAVAILABLE", candidateTasks.errorSummary ?? "Candidate tasks are unavailable."),
    };
  }

  if (!task.projectId) {
    return { eligibility: ineligible("MISSING_PROJECT_ID", "Candidate task is missing a project identifier.") };
  }

  if (!task.originatingIssueId || !Number.isFinite(task.issueNumber)) {
    return { eligibility: ineligible("MISSING_CANDIDATE_PROVENANCE", "Candidate task provenance is incomplete.") };
  }

  if (task.state === "Closed") {
    return { eligibility: ineligible("CANDIDATE_TASK_CLOSED", "Closed candidate tasks cannot be approved for promotion.") };
  }

  if (!assignments) {
    return { eligibility: needsReview("MISSING_ASSIGNMENT_RECOMMENDATION", "Assignment recommendations are not available yet.") };
  }

  if (assignments.recommendationStatus !== "Succeeded") {
    return {
      eligibility: unavailable("ASSIGNMENTS_UNAVAILABLE", assignments.errorSummary ?? "Assignment recommendations are unavailable."),
    };
  }

  if (assignments.projectId !== task.projectId) {
    return { eligibility: ineligible("STALE_ASSIGNMENT_RECOMMENDATION", "Assignment recommendation belongs to another project.") };
  }

  const assignment = findAssignmentForTask(assignments, task);
  if (!assignment) {
    return {
      eligibility: needsReview("MISSING_ASSIGNMENT_RECOMMENDATION", "No assignment recommendation exists for this Candidate Task."),
    };
  }

  if (
    assignment.projectId !== task.projectId ||
    assignment.candidateTaskId !== task.id ||
    assignment.provenance.candidateTaskId !== task.id ||
    assignment.provenance.issueNumber !== task.issueNumber
  ) {
    return { eligibility: ineligible("STALE_ASSIGNMENT_RECOMMENDATION", "Assignment recommendation provenance does not match the Candidate Task.") };
  }

  if (assignment.assignmentStatus === "Recommended") {
    return {
      assignment,
      eligibility: {
        status: "PendingReview",
        isApprovable: true,
        reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
        summary: "Ready for human promotion review.",
      },
    };
  }

  if (assignment.assignmentStatus === "NeedsReview") {
    return {
      assignment,
      eligibility: needsReview("ASSIGNMENT_NEEDS_REVIEW", "Assignment recommendation needs human review before promotion approval."),
    };
  }

  if (assignment.assignmentStatus === "Unassigned") {
    return {
      assignment,
      eligibility: ineligible("ASSIGNMENT_UNASSIGNED", assignment.unavailableReason ?? "No suitable employee is recommended."),
    };
  }

  if (assignment.assignmentStatus === "Unavailable") {
    return {
      assignment,
      eligibility: unavailable("ASSIGNMENT_UNAVAILABLE", assignment.unavailableReason ?? "Assignment recommendation is unavailable."),
    };
  }

  return {
    assignment,
    eligibility: ineligible("ASSIGNMENT_NOT_APPROVABLE", "Assignment recommendation is not approvable."),
  };
}

function needsReview(
  reasonCode: CandidatePromotionEligibility["reasonCodes"][number],
  summary: string,
): CandidatePromotionEligibility {
  return { status: "NeedsReview", isApprovable: false, reasonCodes: [reasonCode], summary };
}

function ineligible(
  reasonCode: CandidatePromotionEligibility["reasonCodes"][number],
  summary: string,
): CandidatePromotionEligibility {
  return { status: "Ineligible", isApprovable: false, reasonCodes: [reasonCode], summary };
}

function unavailable(
  reasonCode: CandidatePromotionEligibility["reasonCodes"][number],
  summary: string,
): CandidatePromotionEligibility {
  return { status: "Unavailable", isApprovable: false, reasonCodes: [reasonCode], summary };
}
