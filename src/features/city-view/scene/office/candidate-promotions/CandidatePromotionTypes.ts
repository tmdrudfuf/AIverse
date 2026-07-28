import type { CandidateAssignmentRecommendation, CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTask, CandidateTaskPriority, CandidateTaskType } from "../candidate-tasks/CandidateTaskTypes";
import type { IssueSyncStatus } from "../issue-sync/IssueSyncTypes";

export const CANDIDATE_PROMOTION_RULESET_VERSION = "candidate-promotion-v1";
export const CANDIDATE_PROMOTION_DECISION_VERSION = 1;
export const CANDIDATE_PROMOTION_NOTE_MAX_LENGTH = 160;

export type CandidatePromotionStatus =
  | "PendingReview"
  | "Approved"
  | "Rejected"
  | "Deferred"
  | "NeedsReview"
  | "Ineligible"
  | "Unavailable";

export type CandidatePromotionDecisionSource =
  | "Human"
  | "SystemEligibility";

export type CandidatePromotionDecisionReasonCode =
  | "HUMAN_APPROVED"
  | "HUMAN_REJECTED"
  | "HUMAN_DEFERRED"
  | "HUMAN_NEEDS_REVIEW"
  | "HUMAN_RESET"
  | "SYSTEM_PENDING"
  | "INVALID_TRANSITION";

export type CandidatePromotionEligibilityReasonCode =
  | "ELIGIBLE_RECOMMENDED_ASSIGNMENT"
  | "CANDIDATE_TASKS_UNAVAILABLE"
  | "ASSIGNMENTS_UNAVAILABLE"
  | "CANDIDATE_TASK_CLOSED"
  | "MISSING_PROJECT_ID"
  | "MISSING_CANDIDATE_PROVENANCE"
  | "MISSING_ASSIGNMENT_RECOMMENDATION"
  | "STALE_ASSIGNMENT_RECOMMENDATION"
  | "ASSIGNMENT_NEEDS_REVIEW"
  | "ASSIGNMENT_UNASSIGNED"
  | "ASSIGNMENT_UNAVAILABLE"
  | "ASSIGNMENT_NOT_APPROVABLE";

export type CandidatePromotionProvenance = {
  candidateTaskId: string;
  originatingIssueId: string;
  issueNumber: number;
  sourceProvider: string;
  sourceUrl?: string;
};

export type CandidatePromotionEligibility = {
  status: CandidatePromotionStatus;
  isApprovable: boolean;
  reasonCodes: CandidatePromotionEligibilityReasonCode[];
  summary: string;
};

export type CandidatePromotionDecision = {
  id: string;
  projectId: string;
  candidateTaskId: string;
  candidateTaskTitle: string;
  candidateTaskType: CandidateTaskType;
  candidateTaskPriority: CandidateTaskPriority;
  candidateTaskProvenance: CandidatePromotionProvenance;
  assignmentRecommendationId?: string;
  recommendedEmployeeId?: string;
  recommendedEmployeeName?: string;
  promotionStatus: CandidatePromotionStatus;
  eligibility: CandidatePromotionEligibility;
  eligibilityReasonCodes: CandidatePromotionEligibilityReasonCode[];
  decisionReasonCode: CandidatePromotionDecisionReasonCode;
  humanNote?: string;
  decisionSource: CandidatePromotionDecisionSource;
  createdAt: string;
  updatedAt: string;
  decisionVersion: number;
  rulesetVersion: string;
  activeTaskCreated: false;
  executionStarted: false;
};

export type CandidatePromotionReview = {
  id: string;
  projectId: string;
  candidateTaskId: string;
  candidateTaskTitle: string;
  candidateTaskType: CandidateTaskType;
  candidateTaskPriority: CandidateTaskPriority;
  candidateTaskState: CandidateTask["state"];
  candidateTaskProvenance: CandidatePromotionProvenance;
  assignmentRecommendationId?: string;
  recommendedEmployeeId?: string;
  recommendedEmployeeName?: string;
  assignmentStatus?: CandidateAssignmentRecommendation["assignmentStatus"];
  promotionStatus: CandidatePromotionStatus;
  eligibility: CandidatePromotionEligibility;
  decision?: CandidatePromotionDecision;
  availableActions: CandidatePromotionStatus[];
  rulesetVersion: string;
};

export type CandidatePromotionReviewCollection = {
  projectId: string;
  sourceCandidateTaskStatus: IssueSyncStatus;
  sourceAssignmentStatus?: IssueSyncStatus;
  reviewStatus: IssueSyncStatus;
  reviews: CandidatePromotionReview[];
  reviewCount: number;
  selectedIndex: number;
  generatedAt?: string;
  rulesetVersion: string;
  sourceCandidateTaskCount: number;
  sourceAssignmentCount?: number;
  errorSummary?: string;
};

export type CandidatePromotionDecisionInput = {
  projectId: string;
  candidateTaskId: string;
  targetStatus: CandidatePromotionStatus;
  decidedAt: string;
  humanNote?: string;
};

export function createPromotionDecisionId(
  projectId: string,
  candidateTaskId: string,
  rulesetVersion = CANDIDATE_PROMOTION_RULESET_VERSION,
) {
  return `${projectId}:candidate-promotion:${candidateTaskId}:${rulesetVersion}`;
}

export function createCandidatePromotionProvenance(task: CandidateTask): CandidatePromotionProvenance {
  return {
    candidateTaskId: task.id,
    originatingIssueId: task.originatingIssueId,
    issueNumber: task.issueNumber,
    sourceProvider: task.sourceProvider,
    sourceUrl: task.sourceUrl,
  };
}

export function createCandidatePromotionReviewCollection(
  input: Omit<CandidatePromotionReviewCollection, "reviews" | "reviewCount"> & {
    reviews: ReadonlyArray<CandidatePromotionReview>;
  },
): CandidatePromotionReviewCollection {
  const reviews = input.reviews.map(copyCandidatePromotionReview);
  return {
    ...input,
    reviews,
    reviewCount: reviews.length,
  };
}

export function copyCandidatePromotionReview(review: CandidatePromotionReview): CandidatePromotionReview {
  return {
    ...review,
    candidateTaskProvenance: { ...review.candidateTaskProvenance },
    eligibility: copyCandidatePromotionEligibility(review.eligibility),
    decision: review.decision ? copyCandidatePromotionDecision(review.decision) : undefined,
    availableActions: [...review.availableActions],
  };
}

export function copyCandidatePromotionDecision(decision: CandidatePromotionDecision): CandidatePromotionDecision {
  return {
    ...decision,
    candidateTaskProvenance: { ...decision.candidateTaskProvenance },
    eligibility: copyCandidatePromotionEligibility(decision.eligibility),
    eligibilityReasonCodes: [...decision.eligibilityReasonCodes],
  };
}

export function copyCandidatePromotionEligibility(
  eligibility: CandidatePromotionEligibility,
): CandidatePromotionEligibility {
  return {
    ...eligibility,
    reasonCodes: [...eligibility.reasonCodes],
  };
}

export function normalizeHumanNote(note: string | undefined) {
  const trimmed = note?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= CANDIDATE_PROMOTION_NOTE_MAX_LENGTH) return trimmed;
  return trimmed.slice(0, CANDIDATE_PROMOTION_NOTE_MAX_LENGTH).trimEnd();
}

export function findAssignmentForTask(
  assignments: CandidateAssignmentRecommendationCollection | undefined,
  task: CandidateTask,
): CandidateAssignmentRecommendation | undefined {
  return assignments?.recommendations.find((recommendation) => recommendation.candidateTaskId === task.id);
}
