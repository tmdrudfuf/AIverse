import { describe, expect, it } from "vitest";

import {
  PREPARED_WORK_SESSION_RULESET_VERSION,
  copyPreparedWorkSessionRecord,
  copyPreparedWorkSessionResult,
  createPreparedWorkSessionId,
  createPreparedWorkSessionResultCollection,
  createPreparedWorkSessionResultId,
  type PreparedWorkSessionRecord,
  type PreparedWorkSessionResult,
} from "./PreparedWorkSessionTypes";

describe("PreparedWorkSessionTypes", () => {
  it("creates deterministic prepared-session and result identifiers", () => {
    expect(createPreparedWorkSessionId("daily-proof", "task-12", "assignment-12")).toBe(
      "daily-proof:prepared-work-session:task-12:assignment-12:prepared-session-v1",
    );
    expect(createPreparedWorkSessionResultId("daily-proof", "task-12")).toBe(
      "daily-proof:prepared-work-session-result:task-12:prepared-session-v1",
    );
  });

  it("defensively copies records, results, and result collections", () => {
    const record = createRecord();
    const result = createResult();
    const copiedRecord = copyPreparedWorkSessionRecord(record);
    const copiedResult = copyPreparedWorkSessionResult(result);
    const collection = createPreparedWorkSessionResultCollection({
      projectId: "daily-proof",
      results: [result],
      generatedAt: "2026-01-02T00:00:00.000Z",
      rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    });

    copiedRecord.reasonCodes.push("PROJECT_MISMATCH");
    copiedRecord.assignmentProvenance.issueNumber = 99;
    copiedResult.reasonCodes.push("PROJECT_MISMATCH");
    collection.results[0]!.reasonCodes.push("PROJECT_MISMATCH");

    expect(record.reasonCodes).toEqual(["PREPARED"]);
    expect(record.assignmentProvenance.issueNumber).toBe(12);
    expect(result.reasonCodes).toEqual(["PREPARED"]);
    const reread = createPreparedWorkSessionResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    });
    expect(reread.results[0]?.reasonCodes).toEqual(["PREPARED"]);
  });
});

function createRecord(): PreparedWorkSessionRecord {
  return {
    id: createPreparedWorkSessionId("daily-proof", "task-12", "assignment-12"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    confirmedAssignmentId: "assignment-12",
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Prepared",
    preparationSource: "Human",
    reasonCodes: ["PREPARED"],
    preparedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    taskStatusAtPreparation: "Todo",
    assignmentProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    taskProvenance: {
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      promotionDecisionId: "promotion-12",
      assignmentRecommendationId: "recommendation-12",
    },
    humanPrepared: true,
    workStarted: false,
    active: false,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}

function createResult(): PreparedWorkSessionResult {
  return {
    id: createPreparedWorkSessionResultId("daily-proof", "task-12"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    confirmedAssignmentId: "assignment-12",
    employeeId: "gpt-engineer",
    preparedSessionId: createPreparedWorkSessionId("daily-proof", "task-12", "assignment-12"),
    status: "Prepared",
    reasonCodes: ["PREPARED"],
    prepared: true,
    duplicateExistingPreparation: false,
    humanPrepared: true,
    active: false,
    workStarted: false,
    executionStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
  };
}
