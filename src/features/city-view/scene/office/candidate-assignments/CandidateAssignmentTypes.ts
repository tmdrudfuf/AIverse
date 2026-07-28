import type { CandidateTask, CandidateTaskPriority, CandidateTaskType } from "../candidate-tasks/CandidateTaskTypes";
import type { IssueSyncStatus } from "../issue-sync/IssueSyncTypes";

export const CANDIDATE_ASSIGNMENT_RULESET_VERSION = "candidate-assignment-v1";

export type EmployeeCapability =
  | "SoftwareDevelopment"
  | "BugFixing"
  | "FeatureDevelopment"
  | "Documentation"
  | "Testing"
  | "CodeReview"
  | "Research"
  | "Maintenance"
  | "ProjectPlanning";

export type CandidateAssignmentStatus =
  | "Recommended"
  | "NeedsReview"
  | "Unassigned"
  | "Unavailable";

export type CandidateAssignmentMatchTier =
  | "Strong"
  | "Moderate"
  | "Weak"
  | "None";

export type CandidateAssignmentReasonCode =
  | "CAPABILITY_MATCH"
  | "ROLE_MATCH"
  | "AVAILABLE_EMPLOYEE"
  | "BUSY_EMPLOYEE"
  | "OFFLINE_EMPLOYEE"
  | "NO_EMPLOYEES"
  | "NO_MATCHING_CAPABILITY"
  | "UNKNOWN_TASK_TYPE"
  | "CLOSED_CANDIDATE_TASK"
  | "CANDIDATE_TASKS_UNAVAILABLE";

export type CandidateAssignmentAlternative = {
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  matchTier: CandidateAssignmentMatchTier;
  matchedCapabilities: EmployeeCapability[];
  reasonCodes: CandidateAssignmentReasonCode[];
};

export type CandidateAssignmentProvenance = {
  candidateTaskId: string;
  originatingIssueId: string;
  issueNumber: number;
};

export type CandidateAssignmentRecommendation = {
  id: string;
  candidateTaskId: string;
  candidateTaskTitle: string;
  projectId: string;
  recommendedEmployeeId?: string;
  recommendedEmployeeName?: string;
  employeeRole?: string;
  assignmentStatus: CandidateAssignmentStatus;
  matchTier: CandidateAssignmentMatchTier;
  matchedCapabilities: EmployeeCapability[];
  unmatchedRequirements: string[];
  warnings: string[];
  taskType: CandidateTaskType;
  proposedPriority: CandidateTaskPriority;
  reasonCodes: CandidateAssignmentReasonCode[];
  generatedAt: string;
  rulesetVersion: string;
  provenance: CandidateAssignmentProvenance;
  alternatives: CandidateAssignmentAlternative[];
  unavailableReason?: string;
};

export type CandidateAssignmentRecommendationCollection = {
  projectId: string;
  sourceCandidateTaskStatus: IssueSyncStatus;
  recommendationStatus: IssueSyncStatus;
  recommendations: CandidateAssignmentRecommendation[];
  recommendationCount: number;
  generatedAt?: string;
  rulesetVersion: string;
  sourceCandidateTaskCount: number;
  errorSummary?: string;
};

export function createCandidateAssignmentCollection(
  input: Omit<CandidateAssignmentRecommendationCollection, "recommendations" | "recommendationCount"> & {
    recommendations: ReadonlyArray<CandidateAssignmentRecommendation>;
  },
): CandidateAssignmentRecommendationCollection {
  const recommendations = input.recommendations.map(copyCandidateAssignmentRecommendation);
  return {
    ...input,
    recommendations,
    recommendationCount: recommendations.length,
  };
}

export function copyCandidateAssignmentRecommendation(
  recommendation: CandidateAssignmentRecommendation,
): CandidateAssignmentRecommendation {
  return {
    ...recommendation,
    matchedCapabilities: [...recommendation.matchedCapabilities],
    unmatchedRequirements: [...recommendation.unmatchedRequirements],
    warnings: [...recommendation.warnings],
    reasonCodes: [...recommendation.reasonCodes],
    provenance: { ...recommendation.provenance },
    alternatives: recommendation.alternatives.map((alternative) => ({
      ...alternative,
      matchedCapabilities: [...alternative.matchedCapabilities],
      reasonCodes: [...alternative.reasonCodes],
    })),
  };
}

export function createRecommendationId(
  candidateTask: CandidateTask,
  employeeId: string | undefined,
  marker: string,
  rulesetVersion = CANDIDATE_ASSIGNMENT_RULESET_VERSION,
) {
  return `${candidateTask.projectId}:assignment:${candidateTask.id}:${employeeId ?? marker}:${rulesetVersion}`;
}
