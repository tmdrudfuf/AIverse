import { describe, expect, it } from "vitest";
import type { CandidateAssignmentRecommendation, CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTask, CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import { evaluateCandidatePromotionEligibility } from "./CandidatePromotionEligibility";

describe("CandidatePromotionEligibility", () => {
  it("makes an open Candidate Task with a valid Recommended assignment approvable", () => {
    const result = evaluateCandidatePromotionEligibility(collection([task()]), task(), assignments([assignment()]));

    expect(result.eligibility).toMatchObject({
      status: "PendingReview",
      isApprovable: true,
      reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
    });
  });

  it("rejects closed Candidate Tasks", () => {
    const closed = task({ state: "Closed" });
    const result = evaluateCandidatePromotionEligibility(collection([closed]), closed, assignments([assignment({ candidateTaskId: closed.id })]));

    expect(result.eligibility).toMatchObject({
      status: "Ineligible",
      isApprovable: false,
      reasonCodes: ["CANDIDATE_TASK_CLOSED"],
    });
  });

  it("keeps unavailable Candidate Task sources unavailable", () => {
    const result = evaluateCandidatePromotionEligibility({
      ...collection([]),
      syncStatus: "Unavailable",
      errorSummary: "Candidate tasks unavailable.",
    }, task(), undefined);

    expect(result.eligibility).toMatchObject({
      status: "Unavailable",
      reasonCodes: ["CANDIDATE_TASKS_UNAVAILABLE"],
      summary: "Candidate tasks unavailable.",
    });
  });

  it("requires assignment recommendations", () => {
    const result = evaluateCandidatePromotionEligibility(collection([task()]), task(), undefined);

    expect(result.eligibility).toMatchObject({
      status: "NeedsReview",
      reasonCodes: ["MISSING_ASSIGNMENT_RECOMMENDATION"],
    });
  });

  it.each([
    ["NeedsReview", "NeedsReview", "ASSIGNMENT_NEEDS_REVIEW"],
    ["Unassigned", "Ineligible", "ASSIGNMENT_UNASSIGNED"],
    ["Unavailable", "Unavailable", "ASSIGNMENT_UNAVAILABLE"],
  ] as const)("handles %s assignment recommendations conservatively", (assignmentStatus, status, reasonCode) => {
    const result = evaluateCandidatePromotionEligibility(collection([task()]), task(), assignments([
      assignment({ assignmentStatus }),
    ]));

    expect(result.eligibility).toMatchObject({
      status,
      isApprovable: false,
      reasonCodes: [reasonCode],
    });
  });

  it("rejects stale project recommendations", () => {
    const result = evaluateCandidatePromotionEligibility(collection([task()]), task(), {
      ...assignments([assignment()]),
      projectId: "other-project",
    });

    expect(result.eligibility).toMatchObject({
      status: "Ineligible",
      reasonCodes: ["STALE_ASSIGNMENT_RECOMMENDATION"],
    });
  });

  it("rejects malformed Candidate Task provenance", () => {
    const malformed = task({ originatingIssueId: "" });
    const result = evaluateCandidatePromotionEligibility(collection([malformed]), malformed, assignments([assignment()]));

    expect(result.eligibility).toMatchObject({
      status: "Ineligible",
      reasonCodes: ["MISSING_CANDIDATE_PROVENANCE"],
    });
  });
});

export function collection(tasks: CandidateTask[]): CandidateTaskCollection {
  return {
    projectId: "daily-proof",
    sourceProvider: "github",
    syncStatus: "Succeeded",
    tasks,
    taskCount: tasks.length,
    mappedAt: "2026-07-28T00:00:00.000Z",
    sourceIssueCount: tasks.length,
    sourceIssueSyncStatus: "Succeeded",
    sourceIssueSyncedAt: "2026-07-28T00:00:00.000Z",
  };
}

export function task(overrides: Partial<CandidateTask> = {}): CandidateTask {
  return {
    id: "candidate-1",
    originatingIssueId: "issue-1",
    issueNumber: 1,
    projectId: "daily-proof",
    title: "Fix a bug",
    summary: "Fix a bug",
    labels: ["bug"],
    assignees: [],
    state: "Open",
    estimatedPriority: "High",
    estimatedTaskType: "Bug",
    sourceProvider: "github",
    issueCreatedAt: "2026-07-01T00:00:00.000Z",
    issueUpdatedAt: "2026-07-02T00:00:00.000Z",
    mappedAt: "2026-07-28T00:00:00.000Z",
    syncedAt: "2026-07-28T00:00:00.000Z",
    ...overrides,
  };
}

export function assignments(
  recommendations: CandidateAssignmentRecommendation[],
): CandidateAssignmentRecommendationCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    recommendationStatus: "Succeeded",
    recommendations,
    recommendationCount: recommendations.length,
    generatedAt: "2026-07-28T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    sourceCandidateTaskCount: recommendations.length,
  };
}

export function assignment(
  overrides: Partial<CandidateAssignmentRecommendation> = {},
): CandidateAssignmentRecommendation {
  const candidateTaskId = overrides.candidateTaskId ?? "candidate-1";
  return {
    id: `assignment-${candidateTaskId}`,
    candidateTaskId,
    candidateTaskTitle: "Fix a bug",
    projectId: "daily-proof",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    employeeRole: "Engineer",
    assignmentStatus: "Recommended",
    matchTier: "Strong",
    matchedCapabilities: ["BugFixing"],
    unmatchedRequirements: [],
    warnings: [],
    taskType: "Bug",
    proposedPriority: "High",
    reasonCodes: ["CAPABILITY_MATCH"],
    generatedAt: "2026-07-28T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    provenance: {
      candidateTaskId,
      originatingIssueId: "issue-1",
      issueNumber: 1,
    },
    alternatives: [],
    ...overrides,
  };
}
