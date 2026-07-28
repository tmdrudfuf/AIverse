import type { CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTask, CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import { evaluateCandidatePromotionEligibility } from "./CandidatePromotionEligibility";
import {
  CANDIDATE_PROMOTION_DECISION_VERSION,
  CANDIDATE_PROMOTION_RULESET_VERSION,
  copyCandidatePromotionDecision,
  createCandidatePromotionProvenance,
  createCandidatePromotionReviewCollection,
  createPromotionDecisionId,
  normalizeHumanNote,
  type CandidatePromotionDecision,
  type CandidatePromotionDecisionInput,
  type CandidatePromotionDecisionReasonCode,
  type CandidatePromotionReview,
  type CandidatePromotionReviewCollection,
  type CandidatePromotionStatus,
} from "./CandidatePromotionTypes";

export class CandidatePromotionService {
  createReviewCollection(
    candidateTasks: CandidateTaskCollection,
    assignments: CandidateAssignmentRecommendationCollection | undefined,
    decisions: Readonly<Record<string, CandidatePromotionDecision>>,
    selectedIndex = 0,
  ): CandidatePromotionReviewCollection {
    if (candidateTasks.syncStatus !== "Succeeded") {
      return createCandidatePromotionReviewCollection({
        projectId: candidateTasks.projectId,
        sourceCandidateTaskStatus: candidateTasks.syncStatus,
        sourceAssignmentStatus: assignments?.recommendationStatus,
        reviewStatus: candidateTasks.syncStatus,
        reviews: [],
        selectedIndex: 0,
        generatedAt: candidateTasks.mappedAt,
        rulesetVersion: CANDIDATE_PROMOTION_RULESET_VERSION,
        sourceCandidateTaskCount: candidateTasks.taskCount,
        sourceAssignmentCount: assignments?.recommendationCount,
        errorSummary: candidateTasks.errorSummary ?? "Candidate tasks are unavailable for promotion review.",
      });
    }

    const reviews = uniqueCandidateTasks(candidateTasks.tasks)
      .map((task) => this.createReview(candidateTasks, task, assignments, decisions));

    return createCandidatePromotionReviewCollection({
      projectId: candidateTasks.projectId,
      sourceCandidateTaskStatus: candidateTasks.syncStatus,
      sourceAssignmentStatus: assignments?.recommendationStatus,
      reviewStatus: "Succeeded",
      reviews,
      selectedIndex: clamp(selectedIndex, 0, Math.max(reviews.length - 1, 0)),
      generatedAt: candidateTasks.mappedAt,
      rulesetVersion: CANDIDATE_PROMOTION_RULESET_VERSION,
      sourceCandidateTaskCount: candidateTasks.taskCount,
      sourceAssignmentCount: assignments?.recommendationCount,
    });
  }

  applyDecision(
    collection: CandidatePromotionReviewCollection,
    decisions: Readonly<Record<string, CandidatePromotionDecision>>,
    input: CandidatePromotionDecisionInput,
  ): {
    decisions: Record<string, CandidatePromotionDecision>;
    decision?: CandidatePromotionDecision;
    accepted: boolean;
    reason: CandidatePromotionDecisionReasonCode;
  } {
    const review = collection.reviews.find((item) =>
      item.projectId === input.projectId && item.candidateTaskId === input.candidateTaskId
    );
    const nextDecisions = copyDecisionRecord(decisions);

    if (!review || !isTransitionAllowed(review.promotionStatus, input.targetStatus, review.eligibility.isApprovable)) {
      return { decisions: nextDecisions, accepted: false, reason: "INVALID_TRANSITION" };
    }

    const id = createPromotionDecisionId(input.projectId, input.candidateTaskId);
    const previous = nextDecisions[id];
    const reason = getDecisionReasonCode(input.targetStatus);
    const decision: CandidatePromotionDecision = {
      id,
      projectId: review.projectId,
      candidateTaskId: review.candidateTaskId,
      candidateTaskTitle: review.candidateTaskTitle,
      candidateTaskType: review.candidateTaskType,
      candidateTaskPriority: review.candidateTaskPriority,
      candidateTaskProvenance: { ...review.candidateTaskProvenance },
      assignmentRecommendationId: review.assignmentRecommendationId,
      recommendedEmployeeId: review.recommendedEmployeeId,
      recommendedEmployeeName: review.recommendedEmployeeName,
      promotionStatus: input.targetStatus,
      eligibility: {
        ...review.eligibility,
        reasonCodes: [...review.eligibility.reasonCodes],
      },
      eligibilityReasonCodes: [...review.eligibility.reasonCodes],
      decisionReasonCode: reason,
      humanNote: normalizeHumanNote(input.humanNote),
      decisionSource: "Human",
      createdAt: previous?.createdAt ?? input.decidedAt,
      updatedAt: input.decidedAt,
      decisionVersion: CANDIDATE_PROMOTION_DECISION_VERSION,
      rulesetVersion: CANDIDATE_PROMOTION_RULESET_VERSION,
      activeTaskCreated: false,
      executionStarted: false,
    };

    nextDecisions[id] = decision;
    return { decisions: nextDecisions, decision: copyCandidatePromotionDecision(decision), accepted: true, reason };
  }

  private createReview(
    candidateTasks: CandidateTaskCollection,
    task: CandidateTask,
    assignments: CandidateAssignmentRecommendationCollection | undefined,
    decisions: Readonly<Record<string, CandidatePromotionDecision>>,
  ): CandidatePromotionReview {
    const { eligibility, assignment } = evaluateCandidatePromotionEligibility(candidateTasks, task, assignments);
    const decisionId = createPromotionDecisionId(task.projectId, task.id);
    const decision = decisions[decisionId];
    const promotionStatus = getCurrentPromotionStatus(eligibility.status, decision);

    return {
      id: decisionId,
      projectId: task.projectId,
      candidateTaskId: task.id,
      candidateTaskTitle: task.title,
      candidateTaskType: task.estimatedTaskType,
      candidateTaskPriority: task.estimatedPriority,
      candidateTaskState: task.state,
      candidateTaskProvenance: createCandidatePromotionProvenance(task),
      assignmentRecommendationId: assignment?.id,
      recommendedEmployeeId: assignment?.recommendedEmployeeId,
      recommendedEmployeeName: assignment?.recommendedEmployeeName,
      assignmentStatus: assignment?.assignmentStatus,
      promotionStatus,
      eligibility,
      decision: decision ? copyCandidatePromotionDecision(decision) : undefined,
      availableActions: getAvailableActions(promotionStatus, eligibility.isApprovable),
      rulesetVersion: CANDIDATE_PROMOTION_RULESET_VERSION,
    };
  }
}

function getCurrentPromotionStatus(
  eligibilityStatus: CandidatePromotionStatus,
  decision: CandidatePromotionDecision | undefined,
) {
  if (!decision) return eligibilityStatus === "PendingReview" ? "PendingReview" : eligibilityStatus;
  return decision.promotionStatus;
}

export function isTransitionAllowed(
  currentStatus: CandidatePromotionStatus,
  targetStatus: CandidatePromotionStatus,
  isApprovable: boolean,
) {
  if (targetStatus === "Approved" && !isApprovable) return false;
  if (targetStatus === "Ineligible" || targetStatus === "Unavailable") return false;

  const allowed: Record<CandidatePromotionStatus, CandidatePromotionStatus[]> = {
    PendingReview: ["Approved", "Rejected", "Deferred", "NeedsReview"],
    Approved: ["PendingReview", "Rejected", "Deferred"],
    Rejected: ["PendingReview", "Deferred"],
    Deferred: ["Approved", "Rejected", "PendingReview"],
    NeedsReview: ["Approved", "Deferred", "Rejected", "PendingReview"],
    Ineligible: ["PendingReview", "Deferred"],
    Unavailable: ["PendingReview", "Deferred"],
  };

  return currentStatus === targetStatus || allowed[currentStatus].includes(targetStatus);
}

export function getAvailableActions(
  currentStatus: CandidatePromotionStatus,
  isApprovable: boolean,
): CandidatePromotionStatus[] {
  const actions: CandidatePromotionStatus[] = [];
  if (isApprovable) actions.push("Approved");
  if (currentStatus !== "Rejected") actions.push("Rejected");
  if (currentStatus !== "Deferred") actions.push("Deferred");
  if (currentStatus !== "PendingReview") actions.push("PendingReview");
  return actions;
}

function getDecisionReasonCode(status: CandidatePromotionStatus): CandidatePromotionDecisionReasonCode {
  if (status === "Approved") return "HUMAN_APPROVED";
  if (status === "Rejected") return "HUMAN_REJECTED";
  if (status === "Deferred") return "HUMAN_DEFERRED";
  if (status === "NeedsReview") return "HUMAN_NEEDS_REVIEW";
  if (status === "PendingReview") return "HUMAN_RESET";
  return "INVALID_TRANSITION";
}

function uniqueCandidateTasks(tasks: ReadonlyArray<CandidateTask>): CandidateTask[] {
  const seen = new Set<string>();
  const unique: CandidateTask[] = [];
  for (const task of tasks) {
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    unique.push({
      ...task,
      labels: [...task.labels],
      assignees: [...task.assignees],
    });
  }
  return unique;
}

function copyDecisionRecord(
  decisions: Readonly<Record<string, CandidatePromotionDecision>>,
): Record<string, CandidatePromotionDecision> {
  return Object.fromEntries(
    Object.entries(decisions).map(([id, decision]) => [id, copyCandidatePromotionDecision(decision)]),
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
