import { describe, expect, it } from "vitest";
import { createCandidateAssignmentCollection, type CandidateAssignmentRecommendation } from "./CandidateAssignmentTypes";

describe("CandidateAssignmentTypes", () => {
  it("defensively copies nested recommendation arrays", () => {
    const recommendation = createRecommendation();
    const collection = createCandidateAssignmentCollection({
      projectId: "daily-proof",
      sourceCandidateTaskStatus: "Succeeded",
      recommendationStatus: "Succeeded",
      recommendations: [recommendation],
      generatedAt: "2026-07-27T00:00:00.000Z",
      rulesetVersion: "candidate-assignment-v1",
      sourceCandidateTaskCount: 1,
    });

    recommendation.matchedCapabilities.push("Research");
    collection.recommendations[0]!.warnings.push("caller mutation");

    const next = createCandidateAssignmentCollection({
      projectId: "daily-proof",
      sourceCandidateTaskStatus: "Succeeded",
      recommendationStatus: "Succeeded",
      recommendations: [createRecommendation()],
      generatedAt: "2026-07-27T00:00:00.000Z",
      rulesetVersion: "candidate-assignment-v1",
      sourceCandidateTaskCount: 1,
    });

    expect(collection.recommendationCount).toBe(1);
    expect(next.recommendations[0]!.matchedCapabilities).toEqual(["SoftwareDevelopment"]);
    expect(next.recommendations[0]!.warnings).toEqual([]);
    expect(next.recommendations[0]!.alternatives[0]!.matchedCapabilities).toEqual(["BugFixing"]);
  });
});

function createRecommendation(): CandidateAssignmentRecommendation {
  return {
    id: "rec-1",
    candidateTaskId: "task-1",
    candidateTaskTitle: "Fix bug",
    projectId: "daily-proof",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    employeeRole: "Engineer",
    assignmentStatus: "Recommended",
    matchTier: "Moderate",
    matchedCapabilities: ["SoftwareDevelopment"],
    unmatchedRequirements: [],
    warnings: [],
    taskType: "Bug",
    proposedPriority: "High",
    reasonCodes: ["CAPABILITY_MATCH"],
    generatedAt: "2026-07-27T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    provenance: {
      candidateTaskId: "task-1",
      originatingIssueId: "issue-1",
      issueNumber: 1,
    },
    alternatives: [{
      employeeId: "gpt-qa",
      employeeName: "GPT QA",
      employeeRole: "QA",
      matchTier: "Moderate",
      matchedCapabilities: ["BugFixing"],
      reasonCodes: ["CAPABILITY_MATCH"],
    }],
  };
}
