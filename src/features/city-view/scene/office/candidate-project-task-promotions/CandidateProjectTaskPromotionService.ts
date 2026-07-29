import { createCandidatePromotionProvenance, createPromotionDecisionId } from "../candidate-promotions/CandidatePromotionTypes";
import type { CandidateTask } from "../candidate-tasks/CandidateTaskTypes";
import type { ProjectTask, TaskActivity, TaskCollection } from "../tasks/ProjectTaskTypes";
import {
  CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION,
  copyCandidateProjectTaskPromotionResult,
  createCandidateProjectTaskPromotionResultCollection,
  createProjectTaskPromotionResultId,
  createPromotedProjectTaskId,
  mapCandidatePriorityToTaskPriority,
  type CandidateProjectTaskPromotionInput,
  type CandidateProjectTaskPromotionOutcome,
  type CandidateProjectTaskPromotionReasonCode,
  type CandidateProjectTaskPromotionResult,
  type CandidateProjectTaskPromotionResultCollection,
  type CandidateProjectTaskPromotionResultStatus,
} from "./CandidateProjectTaskPromotionTypes";

const PROMOTION_ACTIVITY_TYPE: TaskActivity["type"] = "note_added";

export class CandidateProjectTaskPromotionService {
  promote(input: CandidateProjectTaskPromotionInput): CandidateProjectTaskPromotionOutcome {
    const { request } = input;
    const base = createBaseResult(request.projectId, request.candidateTaskId);

    if (!request.projectId || !request.candidateTaskId) {
      return { result: blocked(base, "Failed", ["PROJECT_MISMATCH"]) };
    }

    if (!input.candidateTasks || input.candidateTasks.syncStatus !== "Succeeded") {
      return { result: blocked(base, "Unavailable", ["TASK_SOURCE_UNAVAILABLE"]) };
    }

    if (input.candidateTasks.projectId !== request.projectId) {
      return { result: blocked(base, "Ineligible", ["PROJECT_MISMATCH"]) };
    }

    const task = input.candidateTasks.tasks.find((item) =>
      item.projectId === request.projectId && item.id === request.candidateTaskId
    );
    if (!task) return { result: blocked(base, "Ineligible", ["TASK_NOT_FOUND"]) };
    const provenance = createCandidatePromotionProvenance(task);

    if (!task.projectId) return { result: blocked({ ...base, candidateTaskProvenance: provenance }, "Ineligible", ["MISSING_PROJECT_ID"]) };
    if (!task.originatingIssueId || !Number.isFinite(task.issueNumber)) {
      return { result: blocked({ ...base, candidateTaskProvenance: provenance }, "Ineligible", ["MISSING_CANDIDATE_PROVENANCE"]) };
    }
    if (task.state === "Closed") {
      return { result: blocked({ ...base, candidateTaskProvenance: provenance }, "Ineligible", ["TASK_CLOSED"]) };
    }

    const decisionId = createPromotionDecisionId(request.projectId, request.candidateTaskId);
    const decision = input.decisions[decisionId];
    if (!decision) {
      return { result: blocked({ ...base, candidateTaskProvenance: provenance }, "Rejected", ["DECISION_NOT_FOUND"]) };
    }
    if (decision.projectId !== request.projectId || decision.candidateTaskId !== request.candidateTaskId) {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Ineligible", ["STALE_DECISION"]) };
    }
    if (decision.promotionStatus !== "Approved") {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Rejected", ["DECISION_NOT_APPROVED"]) };
    }

    if (!input.assignments || input.assignments.recommendationStatus !== "Succeeded") {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Unavailable", ["ASSIGNMENTS_UNAVAILABLE"]) };
    }
    if (input.assignments.projectId !== request.projectId) {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Ineligible", ["PROJECT_MISMATCH"]) };
    }

    const assignment = input.assignments.recommendations.find((item) => item.candidateTaskId === request.candidateTaskId);
    if (!assignment) {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Ineligible", ["ASSIGNMENT_NOT_FOUND"]) };
    }
    if (
      assignment.projectId !== request.projectId ||
      assignment.candidateTaskId !== task.id ||
      assignment.provenance.candidateTaskId !== task.id ||
      assignment.provenance.originatingIssueId !== task.originatingIssueId ||
      assignment.provenance.issueNumber !== task.issueNumber
    ) {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Ineligible", ["STALE_ASSIGNMENT"]) };
    }
    if (assignment.assignmentStatus !== "Recommended") {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Ineligible", ["ASSIGNMENT_NOT_RECOMMENDED"]) };
    }

    if (!input.taskCollection || input.taskCollection.projectId !== request.projectId) {
      return { result: blocked({ ...base, promotionDecisionId: decision.id, candidateTaskProvenance: provenance }, "Unavailable", ["TASK_COLLECTION_UNAVAILABLE"]) };
    }

    const promotedTaskId = createPromotedProjectTaskId(request.projectId, request.candidateTaskId);
    const existingTask = input.taskCollection.tasks.find((item) =>
      item.id === promotedTaskId || taskDescriptionHasPromotionMarker(item.description, request.projectId, request.candidateTaskId)
    );
    if (existingTask) {
      return {
        result: {
          ...base,
          promotionDecisionId: decision.id,
          createdProjectTaskId: existingTask.id,
          status: "AlreadyPromoted",
          reasonCodes: ["ALREADY_PROMOTED"],
          duplicateExistingTask: true,
          candidateTaskProvenance: provenance,
          activeTaskCreated: true,
          workStarted: false,
          employeeAssigned: false,
          executionStarted: false,
        },
        taskCollection: copyTaskCollection(input.taskCollection),
      };
    }

    const promotedTask = createPromotedTask({
      candidateTask: task,
      promotedTaskId,
      promotionDecisionId: decision.id,
      assignmentRecommendationId: assignment.id,
      recommendedEmployeeId: assignment.recommendedEmployeeId,
      recommendedEmployeeName: assignment.recommendedEmployeeName,
      requestedAt: request.requestedAt,
    });
    const taskCollection: TaskCollection = {
      projectId: input.taskCollection.projectId,
      tasks: [...input.taskCollection.tasks.map(copyProjectTask), promotedTask],
    };

    return {
      result: {
        ...base,
        promotionDecisionId: decision.id,
        createdProjectTaskId: promotedTask.id,
        status: "Promoted",
        reasonCodes: ["PROMOTED"],
        duplicateExistingTask: false,
        promotedAt: request.requestedAt,
        candidateTaskProvenance: provenance,
        activeTaskCreated: true,
        workStarted: false,
        employeeAssigned: false,
        executionStarted: false,
      },
      taskCollection,
    };
  }

  upsertResult(
    collection: CandidateProjectTaskPromotionResultCollection | undefined,
    result: CandidateProjectTaskPromotionResult,
  ): CandidateProjectTaskPromotionResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createCandidateProjectTaskPromotionResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.promotedAt,
      rulesetVersion: CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION,
    });
  }
}

function createBaseResult(projectId: string, candidateTaskId: string): CandidateProjectTaskPromotionResult {
  return {
    id: createProjectTaskPromotionResultId(projectId, candidateTaskId),
    projectId,
    candidateTaskId,
    status: "Failed",
    reasonCodes: [],
    duplicateExistingTask: false,
    rulesetVersion: CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION,
    activeTaskCreated: false,
    workStarted: false,
    employeeAssigned: false,
    executionStarted: false,
  };
}

function blocked(
  base: CandidateProjectTaskPromotionResult,
  status: CandidateProjectTaskPromotionResultStatus,
  reasonCodes: CandidateProjectTaskPromotionReasonCode[],
) {
  return copyCandidateProjectTaskPromotionResult({
    ...base,
    status,
    reasonCodes,
    duplicateExistingTask: false,
    activeTaskCreated: false,
    workStarted: false,
    employeeAssigned: false,
    executionStarted: false,
  });
}

function createPromotedTask(input: {
  candidateTask: CandidateTask;
  promotedTaskId: string;
  promotionDecisionId: string;
  assignmentRecommendationId: string;
  recommendedEmployeeId?: string;
  recommendedEmployeeName?: string;
  requestedAt: string;
}): ProjectTask {
  const { candidateTask } = input;
  const marker = createPromotionMarker(candidateTask.projectId, candidateTask.id);
  const source = candidateTask.sourceUrl
    ? `Source issue: #${candidateTask.issueNumber} ${candidateTask.sourceUrl}`
    : `Source issue: #${candidateTask.issueNumber}`;
  const recommendation = input.recommendedEmployeeName
    ? `Recommended employee hint: ${input.recommendedEmployeeName} (${input.recommendedEmployeeId ?? "unknown id"}). Not assigned.`
    : "Recommended employee hint: none. Not assigned.";
  const description = [
    candidateTask.summary || candidateTask.title,
    source,
    `Candidate Task: ${candidateTask.id}`,
    `Promotion Decision: ${input.promotionDecisionId}`,
    `Assignment Recommendation: ${input.assignmentRecommendationId}`,
    recommendation,
    marker,
  ].join("\n");
  const activity: TaskActivity = {
    id: `${input.promotedTaskId}:promotion-note`,
    taskId: input.promotedTaskId,
    type: PROMOTION_ACTIVITY_TYPE,
    message: `Promoted from Candidate Task ${candidateTask.id}. Not started. Unassigned.`,
    createdAt: input.requestedAt,
  };

  return {
    id: input.promotedTaskId,
    title: candidateTask.title,
    description,
    status: "Todo",
    priority: mapCandidatePriorityToTaskPriority(candidateTask.estimatedPriority),
    projectId: candidateTask.projectId,
    createdAt: input.requestedAt,
    updatedAt: input.requestedAt,
    activityLog: [activity],
  };
}

function createPromotionMarker(projectId: string, candidateTaskId: string) {
  return `[AIverse Promotion: project=${projectId}; candidateTask=${candidateTaskId}; ruleset=${CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION}]`;
}

function taskDescriptionHasPromotionMarker(description: string, projectId: string, candidateTaskId: string) {
  return description.includes(createPromotionMarker(projectId, candidateTaskId));
}

function copyTaskCollection(collection: { projectId: string; tasks: ReadonlyArray<ProjectTask> }): TaskCollection {
  return {
    projectId: collection.projectId,
    tasks: collection.tasks.map(copyProjectTask),
  };
}

function copyProjectTask(task: ProjectTask): ProjectTask {
  return {
    ...task,
    activityLog: task.activityLog?.map((activity) => ({ ...activity })),
  };
}
