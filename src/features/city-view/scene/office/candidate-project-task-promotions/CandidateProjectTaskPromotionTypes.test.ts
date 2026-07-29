import { describe, expect, it } from "vitest";
import {
  copyCandidateProjectTaskPromotionResult,
  createCandidateProjectTaskPromotionResultCollection,
  createProjectTaskPromotionResultId,
  createPromotedProjectTaskId,
  mapCandidatePriorityToTaskPriority,
  type CandidateProjectTaskPromotionResult,
} from "./CandidateProjectTaskPromotionTypes";

describe("CandidateProjectTaskPromotionTypes", () => {
  it("creates deterministic promoted task and result identifiers", () => {
    expect(createPromotedProjectTaskId("daily-proof", "candidate-1")).toBe(
      "daily-proof:promoted-task:candidate-1:candidate-promotion-v1",
    );
    expect(createProjectTaskPromotionResultId("daily-proof", "candidate-1")).toBe(
      "daily-proof:project-task-promotion:candidate-1:candidate-promotion-v1",
    );
  });

  it.each([
    ["High", "High"],
    ["Medium", "Medium"],
    ["Low", "Low"],
    ["Normal", "Medium"],
  ] as const)("maps %s Candidate Task priority to %s ProjectTask priority", (candidatePriority, taskPriority) => {
    expect(mapCandidatePriorityToTaskPriority(candidatePriority)).toBe(taskPriority);
  });

  it("defensively copies result arrays and provenance", () => {
    const result = promotedResult();
    const copy = copyCandidateProjectTaskPromotionResult(result);
    copy.reasonCodes.push("PROJECT_MISMATCH");
    copy.candidateTaskProvenance!.issueNumber = 99;

    expect(result.reasonCodes).toEqual(["PROMOTED"]);
    expect(result.candidateTaskProvenance?.issueNumber).toBe(1);
  });

  it("creates immutable-style result collections", () => {
    const source = [promotedResult()];
    const collection = createCandidateProjectTaskPromotionResultCollection({
      projectId: "daily-proof",
      results: source,
      generatedAt: "2026-07-28T00:00:00.000Z",
      rulesetVersion: "candidate-promotion-v1",
    });
    source[0]!.reasonCodes.push("PROJECT_MISMATCH");
    collection.results[0]!.reasonCodes.push("STALE_ASSIGNMENT");
    const fresh = createCandidateProjectTaskPromotionResultCollection({
      projectId: "daily-proof",
      results: [promotedResult()],
      generatedAt: "2026-07-28T00:00:00.000Z",
      rulesetVersion: "candidate-promotion-v1",
    });

    expect(collection.resultCount).toBe(1);
    expect(fresh.results[0]!.reasonCodes).toEqual(["PROMOTED"]);
  });
});

function promotedResult(): CandidateProjectTaskPromotionResult {
  return {
    id: "daily-proof:project-task-promotion:candidate-1:candidate-promotion-v1",
    projectId: "daily-proof",
    candidateTaskId: "candidate-1",
    promotionDecisionId: "daily-proof:candidate-promotion:candidate-1:candidate-promotion-v1",
    createdProjectTaskId: "daily-proof:promoted-task:candidate-1:candidate-promotion-v1",
    status: "Promoted",
    reasonCodes: ["PROMOTED"],
    duplicateExistingTask: false,
    promotedAt: "2026-07-28T00:00:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
    candidateTaskProvenance: {
      candidateTaskId: "candidate-1",
      originatingIssueId: "issue-1",
      issueNumber: 1,
      sourceProvider: "github",
    },
    activeTaskCreated: true,
    workStarted: false,
    employeeAssigned: false,
    executionStarted: false,
  };
}
