import { describe, expect, it } from "vitest";
import type { CandidatePromotionDecision } from "../candidate-promotions/CandidatePromotionTypes";
import { assignment, assignments, collection, task } from "../candidate-promotions/CandidatePromotionEligibility.test";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import { CandidateProjectTaskPromotionService } from "./CandidateProjectTaskPromotionService";
import { createPromotedProjectTaskId } from "./CandidateProjectTaskPromotionTypes";

describe("CandidateProjectTaskPromotionService", () => {
  it("promotes an approved Candidate Task into one Todo unassigned ProjectTask", () => {
    const outcome = service().promote(validInput());
    const promotedTask = outcome.taskCollection!.tasks.at(-1)!;

    expect(outcome.result).toMatchObject({
      status: "Promoted",
      reasonCodes: ["PROMOTED"],
      createdProjectTaskId: "daily-proof:promoted-task:candidate-1:candidate-promotion-v1",
      activeTaskCreated: true,
      workStarted: false,
      employeeAssigned: false,
      executionStarted: false,
    });
    expect(promotedTask).toMatchObject({
      id: "daily-proof:promoted-task:candidate-1:candidate-promotion-v1",
      title: "Fix a bug",
      status: "Todo",
      priority: "High",
      projectId: "daily-proof",
    });
    expect(promotedTask.assignee).toBeUndefined();
    expect(promotedTask.assigneeId).toBeUndefined();
    expect(promotedTask.description).toContain("Candidate Task: candidate-1");
    expect(promotedTask.description).toContain("Promotion Decision:");
    expect(promotedTask.description).toContain("Recommended employee hint: GPT Engineer");
    expect(promotedTask.description).toContain("[AIverse Promotion: project=daily-proof; candidateTask=candidate-1;");
    expect(promotedTask.activityLog?.[0]?.message).toContain("Not started. Unassigned.");
  });

  it.each([
    ["PendingReview", "DECISION_NOT_APPROVED"],
    ["Rejected", "DECISION_NOT_APPROVED"],
    ["Deferred", "DECISION_NOT_APPROVED"],
    ["NeedsReview", "DECISION_NOT_APPROVED"],
    ["Ineligible", "DECISION_NOT_APPROVED"],
    ["Unavailable", "DECISION_NOT_APPROVED"],
  ] as const)("blocks %s decisions", (promotionStatus, reasonCode) => {
    const blockedDecision = decision({ promotionStatus });
    const outcome = service().promote(validInput({ decisions: { [blockedDecision.id]: blockedDecision } }));

    expect(outcome.result.status).toBe("Rejected");
    expect(outcome.result.reasonCodes).toEqual([reasonCode]);
    expect(outcome.taskCollection).toBeUndefined();
  });

  it.each([
    [task({ state: "Closed" }), "TASK_CLOSED"],
    [task({ originatingIssueId: "" }), "MISSING_CANDIDATE_PROVENANCE"],
    [task({ projectId: "" }), "TASK_NOT_FOUND"],
  ])("blocks invalid Candidate Task state", (candidateTask, reasonCode) => {
    const outcome = service().promote(validInput({
      candidateTasks: collection([candidateTask]),
      assignments: assignments([assignment({ candidateTaskId: candidateTask.id })]),
    }));

    expect(outcome.result.status).toBe("Ineligible");
    expect(outcome.result.reasonCodes).toEqual([reasonCode]);
    expect(outcome.taskCollection).toBeUndefined();
  });

  it.each([
    ["NeedsReview"],
    ["Unassigned"],
    ["Unavailable"],
  ] as const)("blocks %s assignment recommendations", (assignmentStatus) => {
    const outcome = service().promote(validInput({
      assignments: assignments([assignment({ assignmentStatus })]),
    }));

    expect(outcome.result.status).toBe("Ineligible");
    expect(outcome.result.reasonCodes).toEqual(["ASSIGNMENT_NOT_RECOMMENDED"]);
    expect(outcome.taskCollection).toBeUndefined();
  });

  it("blocks missing and stale recommendations", () => {
    expect(service().promote(validInput({ assignments: assignments([]) })).result.reasonCodes).toEqual(["ASSIGNMENT_NOT_FOUND"]);
    expect(service().promote(validInput({
      assignments: assignments([assignment({
        provenance: { candidateTaskId: "candidate-1", originatingIssueId: "other", issueNumber: 1 },
      })]),
    })).result.reasonCodes).toEqual(["STALE_ASSIGNMENT"]);
  });

  it("blocks unavailable source collections", () => {
    const taskSource = service().promote(validInput({
      candidateTasks: { ...collection([]), syncStatus: "Unavailable" },
    }));
    const assignmentSource = service().promote(validInput({
      assignments: { ...assignments([]), recommendationStatus: "Unavailable" },
    }));
    const taskStore = service().promote(validInput({ taskCollection: undefined }));

    expect(taskSource.result).toMatchObject({ status: "Unavailable", reasonCodes: ["TASK_SOURCE_UNAVAILABLE"] });
    expect(assignmentSource.result).toMatchObject({ status: "Unavailable", reasonCodes: ["ASSIGNMENTS_UNAVAILABLE"] });
    expect(taskStore.result).toMatchObject({ status: "Unavailable", reasonCodes: ["TASK_COLLECTION_UNAVAILABLE"] });
  });

  it("is idempotent and does not duplicate promoted tasks", () => {
    const svc = service();
    const first = svc.promote(validInput());
    const second = svc.promote(validInput({ taskCollection: first.taskCollection }));

    expect(first.taskCollection!.tasks).toHaveLength(2);
    expect(second.result).toMatchObject({
      status: "AlreadyPromoted",
      duplicateExistingTask: true,
      createdProjectTaskId: first.result.createdProjectTaskId,
    });
    expect(second.taskCollection!.tasks).toHaveLength(2);
  });

  it("does not overwrite same-title existing tasks and keeps existing order", () => {
    const existingSameTitle = existingTask({ id: "manual-1", title: "Fix a bug", assignee: "Ada", assigneeId: "ada", status: "In Progress" });
    const outcome = service().promote(validInput({ taskCollection: tasks([existingSameTitle]) }));

    expect(outcome.taskCollection!.tasks[0]).toEqual(existingSameTitle);
    expect(outcome.taskCollection!.tasks[1]!.id).toBe(createPromotedProjectTaskId("daily-proof", "candidate-1"));
  });

  it("keeps same titles distinct across Candidate Tasks and projects", () => {
    const candidateTwo = task({ id: "candidate-2", issueNumber: 2, originatingIssueId: "issue-2", title: "Fix a bug" });
    const first = service().promote(validInput());
    const second = service().promote(validInput({
      request: { projectId: "daily-proof", candidateTaskId: "candidate-2", requestedAt: "2026-07-28T01:00:00.000Z" },
      candidateTasks: collection([candidateTwo]),
      assignments: assignments([assignment({
        candidateTaskId: "candidate-2",
        provenance: { candidateTaskId: "candidate-2", originatingIssueId: "issue-2", issueNumber: 2 },
      })]),
      decisions: {
        [decision({ candidateTaskId: "candidate-2" }).id]: decision({ candidateTaskId: "candidate-2" }),
      },
      taskCollection: first.taskCollection,
    }));

    expect(second.taskCollection!.tasks.map((item) => item.title)).toEqual(["Existing task", "Fix a bug", "Fix a bug"]);
    expect(new Set(second.taskCollection!.tasks.map((item) => item.id)).size).toBe(3);
  });

  it("upserts immutable result collections deterministically", () => {
    const svc = service();
    const promoted = svc.promote(validInput()).result;
    const collectionA = svc.upsertResult(undefined, promoted);
    promoted.reasonCodes.push("PROJECT_MISMATCH");
    collectionA.results[0]!.reasonCodes.push("STALE_ASSIGNMENT");
    const collectionB = svc.upsertResult(collectionA, svc.promote(validInput()).result);

    expect(collectionA.resultCount).toBe(1);
    expect(collectionB.resultCount).toBe(1);
    expect(collectionB.results[0]!.reasonCodes).toEqual(["PROMOTED"]);
  });
});

function service() {
  return new CandidateProjectTaskPromotionService();
}

function validInput(overrides: Partial<Parameters<CandidateProjectTaskPromotionService["promote"]>[0]> = {}) {
  const approvedDecision = decision();
  return {
    request: { projectId: "daily-proof", candidateTaskId: "candidate-1", requestedAt: "2026-07-28T00:00:00.000Z" },
    candidateTasks: collection([task()]),
    assignments: assignments([assignment()]),
    decisions: { [approvedDecision.id]: approvedDecision },
    taskCollection: tasks([existingTask()]),
    ...overrides,
  };
}

function decision(overrides: Partial<CandidatePromotionDecision> = {}): CandidatePromotionDecision {
  const candidateTaskId = overrides.candidateTaskId ?? "candidate-1";
  return {
    id: `daily-proof:candidate-promotion:${candidateTaskId}:candidate-promotion-v1`,
    projectId: "daily-proof",
    candidateTaskId,
    candidateTaskTitle: "Fix a bug",
    candidateTaskType: "Bug",
    candidateTaskPriority: "High",
    candidateTaskProvenance: {
      candidateTaskId,
      originatingIssueId: candidateTaskId === "candidate-2" ? "issue-2" : "issue-1",
      issueNumber: candidateTaskId === "candidate-2" ? 2 : 1,
      sourceProvider: "github",
    },
    assignmentRecommendationId: `assignment-${candidateTaskId}`,
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    promotionStatus: "Approved",
    eligibility: {
      status: "PendingReview",
      isApprovable: true,
      reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
      summary: "Ready for human promotion review.",
    },
    eligibilityReasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
    decisionReasonCode: "HUMAN_APPROVED",
    decisionSource: "Human",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    decisionVersion: 1,
    rulesetVersion: "candidate-promotion-v1",
    activeTaskCreated: false,
    executionStarted: false,
    ...overrides,
  };
}

function tasks(projectTasks: ProjectTask[]): TaskCollection {
  return { projectId: "daily-proof", tasks: projectTasks.map((item) => ({ ...item, activityLog: item.activityLog?.map((activity) => ({ ...activity })) })) };
}

function existingTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "existing-task",
    title: "Existing task",
    description: "Already tracked.",
    status: "Todo",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    activityLog: [],
    ...overrides,
  };
}
