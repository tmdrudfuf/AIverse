import { describe, expect, it } from "vitest";

import {
  copyActiveWorkSessionRecord,
  copyActiveWorkSessionStartResult,
  createActiveWorkSessionId,
  createActiveWorkSessionStartResultCollection,
  createActiveWorkSessionStartResultId,
  type ActiveWorkSessionRecord,
  type ActiveWorkSessionStartResult,
} from "./ActiveWorkSessionTypes";

describe("ActiveWorkSessionTypes", () => {
  it("creates deterministic active-session and result identifiers", () => {
    expect(createActiveWorkSessionId("daily-proof", "task-12", "prepared-12")).toBe(
      "daily-proof:work-session:task-12:prepared-12:active-session-v1",
    );
    expect(createActiveWorkSessionStartResultId("daily-proof", "task-12", "prepared-12")).toBe(
      "daily-proof:work-session-start-result:task-12:prepared-12:active-session-v1",
    );
  });

  it("copies records, results, and collections defensively", () => {
    const record = createRecord();
    const result = createResult();
    const copiedRecord = copyActiveWorkSessionRecord(record);
    const copiedResult = copyActiveWorkSessionStartResult(result);
    const collection = createActiveWorkSessionStartResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesetVersion: "active-session-v1",
    });

    copiedRecord.reasonCodes.push("PROJECT_MISMATCH");
    copiedRecord.activityIds?.push("mutated");
    copiedRecord.assignmentProvenance.issueNumber = 99;
    copiedResult.reasonCodes.push("PROJECT_MISMATCH");
    collection.results[0]?.reasonCodes.push("PROJECT_MISMATCH");

    expect(record.reasonCodes).toEqual(["STARTED"]);
    expect(record.activityIds).toEqual(["activity-1"]);
    expect(record.assignmentProvenance.issueNumber).toBe(12);
    expect(result.reasonCodes).toEqual(["STARTED"]);
    expect(createActiveWorkSessionStartResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesetVersion: "active-session-v1",
    }).results[0]?.reasonCodes).toEqual(["STARTED"]);
  });
});

function createRecord(): ActiveWorkSessionRecord {
  return {
    id: createActiveWorkSessionId("daily-proof", "task-12", "prepared-12"),
    taskId: "task-12",
    projectTaskId: "task-12",
    projectId: "daily-proof",
    preparedSessionId: "prepared-12",
    confirmedAssignmentId: "assignment-12",
    candidateTaskId: "candidate-12",
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    employeeDisplayName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-01-04T00:00:00.000Z",
    startSource: "Human",
    reasonCodes: ["STARTED"],
    rulesetVersion: "active-session-v1",
    taskStatusAtStart: "Todo",
    assignmentProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    preparationProvenance: {
      preparedSessionId: "prepared-12",
      preparedAt: "2026-01-03T00:00:00.000Z",
      rulesetVersion: "prepared-session-v1",
      humanPrepared: true,
    },
    taskProvenance: {
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      assignmentRecommendationId: "recommendation-12",
      promotionDecisionId: "promotion-12",
    },
    humanStarted: true,
    active: true,
    workStarted: true,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    activityIds: ["activity-1"],
  };
}

function createResult(): ActiveWorkSessionStartResult {
  return {
    id: createActiveWorkSessionStartResultId("daily-proof", "task-12", "prepared-12"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    preparedSessionId: "prepared-12",
    confirmedAssignmentId: "assignment-12",
    employeeId: "gpt-engineer",
    activeSessionId: createActiveWorkSessionId("daily-proof", "task-12", "prepared-12"),
    status: "Started",
    reasonCodes: ["STARTED"],
    started: true,
    duplicateExistingSession: false,
    humanStarted: true,
    active: true,
    workStarted: true,
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-04T00:00:00.000Z",
    rulesetVersion: "active-session-v1",
  };
}
