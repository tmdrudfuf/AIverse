import type { CandidateAssignmentRecommendation } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTask, CandidateTaskPriority } from "../candidate-tasks/CandidateTaskTypes";
import type { CandidatePromotionDecision, CandidatePromotionProvenance } from "../candidate-promotions/CandidatePromotionTypes";
import type { ProjectTask, TaskPriority } from "../tasks/ProjectTaskTypes";

export const CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION = "candidate-promotion-v1";

export type CandidateProjectTaskPromotionResultStatus =
  | "Promoted"
  | "AlreadyPromoted"
  | "Rejected"
  | "Ineligible"
  | "Unavailable"
  | "Failed";

export type CandidateProjectTaskPromotionReasonCode =
  | "PROMOTED"
  | "ALREADY_PROMOTED"
  | "TASK_SOURCE_UNAVAILABLE"
  | "TASK_NOT_FOUND"
  | "TASK_CLOSED"
  | "MISSING_PROJECT_ID"
  | "MISSING_CANDIDATE_PROVENANCE"
  | "DECISION_NOT_FOUND"
  | "DECISION_NOT_APPROVED"
  | "STALE_DECISION"
  | "ASSIGNMENTS_UNAVAILABLE"
  | "ASSIGNMENT_NOT_FOUND"
  | "ASSIGNMENT_NOT_RECOMMENDED"
  | "STALE_ASSIGNMENT"
  | "TASK_COLLECTION_UNAVAILABLE"
  | "PROJECT_MISMATCH"
  | "MAPPING_FAILED";

export type CandidateProjectTaskPromotionRequest = {
  projectId: string;
  candidateTaskId: string;
  requestedAt: string;
};

export type CandidateProjectTaskPromotionResult = {
  id: string;
  projectId: string;
  candidateTaskId: string;
  promotionDecisionId?: string;
  createdProjectTaskId?: string;
  status: CandidateProjectTaskPromotionResultStatus;
  reasonCodes: CandidateProjectTaskPromotionReasonCode[];
  duplicateExistingTask: boolean;
  promotedAt?: string;
  rulesetVersion: string;
  candidateTaskProvenance?: CandidatePromotionProvenance;
  activeTaskCreated: boolean;
  workStarted: false;
  employeeAssigned: false;
  executionStarted: false;
};

export type CandidateProjectTaskPromotionResultCollection = {
  projectId: string;
  results: CandidateProjectTaskPromotionResult[];
  resultCount: number;
  generatedAt?: string;
  rulesetVersion: string;
};

export type CandidateProjectTaskPromotionInput = {
  request: CandidateProjectTaskPromotionRequest;
  candidateTasks?: {
    projectId: string;
    syncStatus: string;
    tasks: ReadonlyArray<CandidateTask>;
    errorSummary?: string;
  };
  assignments?: {
    projectId: string;
    recommendationStatus: string;
    recommendations: ReadonlyArray<CandidateAssignmentRecommendation>;
    errorSummary?: string;
  };
  decisions: Readonly<Record<string, CandidatePromotionDecision>>;
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<ProjectTask>;
  };
};

export type CandidateProjectTaskPromotionOutcome = {
  result: CandidateProjectTaskPromotionResult;
  taskCollection?: {
    projectId: string;
    tasks: ProjectTask[];
  };
};

export function createPromotedProjectTaskId(
  projectId: string,
  candidateTaskId: string,
  rulesetVersion = CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION,
) {
  return `${projectId}:promoted-task:${candidateTaskId}:${rulesetVersion}`;
}

export function createProjectTaskPromotionResultId(
  projectId: string,
  candidateTaskId: string,
  rulesetVersion = CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION,
) {
  return `${projectId}:project-task-promotion:${candidateTaskId}:${rulesetVersion}`;
}

export function createCandidateProjectTaskPromotionResultCollection(
  input: Omit<CandidateProjectTaskPromotionResultCollection, "results" | "resultCount"> & {
    results: ReadonlyArray<CandidateProjectTaskPromotionResult>;
  },
): CandidateProjectTaskPromotionResultCollection {
  const results = input.results.map(copyCandidateProjectTaskPromotionResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyCandidateProjectTaskPromotionResult(
  result: CandidateProjectTaskPromotionResult,
): CandidateProjectTaskPromotionResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
    candidateTaskProvenance: result.candidateTaskProvenance
      ? { ...result.candidateTaskProvenance }
      : undefined,
  };
}

export function mapCandidatePriorityToTaskPriority(priority: CandidateTaskPriority): TaskPriority {
  if (priority === "High") return "High";
  if (priority === "Medium") return "Medium";
  if (priority === "Low") return "Low";
  return "Medium";
}
