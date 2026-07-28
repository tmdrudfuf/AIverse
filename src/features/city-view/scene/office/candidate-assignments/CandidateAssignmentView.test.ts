import { describe, expect, it } from "vitest";
import type {
  CandidateAssignmentRecommendation,
  CandidateAssignmentRecommendationCollection,
} from "./CandidateAssignmentTypes";
import { createCandidateAssignmentDisplayRows } from "./CandidateAssignmentView";

describe("CandidateAssignmentView", () => {
  it("renders recommended state with count, employee, role, tier, type, title, and issue number", () => {
    const rows = createCandidateAssignmentDisplayRows(collection([recommendation()]));

    expect(rows.statusText).toBe("Succeeded - 1 assignment recommendation");
    expect(rows.topRecommendationText).toBe("Recommended Moderate Bug #12 Fix crash on launch -> GPT Engineer (Engineer)");
  });

  it.each([
    ["NeedsReview", "NeedsReview Moderate Bug #12 Fix crash on launch -> GPT Engineer (Engineer)"],
    ["Unassigned", "Unassigned None Bug #12 Fix crash on launch -> No suitable employee"],
    ["Unavailable", "Unavailable None Bug #12 Fix crash on launch -> No employee data"],
  ] as const)("renders %s state without implying work started", (assignmentStatus, expected) => {
    const hasEmployee = assignmentStatus === "NeedsReview";
    const rows = createCandidateAssignmentDisplayRows(collection([
      recommendation({
        assignmentStatus,
        recommendedEmployeeId: hasEmployee ? "gpt-engineer" : undefined,
        recommendedEmployeeName: hasEmployee ? "GPT Engineer" : undefined,
        employeeRole: hasEmployee ? "Engineer" : undefined,
        matchTier: hasEmployee ? "Moderate" : "None",
      }),
    ]));

    expect(rows.topRecommendationText).toBe(expected);
    expect(rows.topRecommendationText).not.toMatch(/Assigned and working|In progress|Started|Executing/i);
  });

  it("bounds long candidate titles and employee names and reports hidden recommendations", () => {
    const rows = createCandidateAssignmentDisplayRows(collection([
      recommendation({
        candidateTaskTitle: "Investigate a very long synchronization failure title that should fit one row",
        recommendedEmployeeName: "Alexandria Fitzgerald-Worthington",
      }),
      recommendation({ id: "rec-2", candidateTaskId: "candidate-2" }),
      recommendation({ id: "rec-3", candidateTaskId: "candidate-3" }),
    ]));

    expect(rows.statusText).toBe("Succeeded - 3 assignment recommendations");
    expect(rows.topRecommendationText).toContain("Investigate a very long syn...");
    expect(rows.topRecommendationText).toContain("Alexandria Fitzge...");
    expect(rows.topRecommendationText).toContain("+2 more");
  });

  it("renders empty and unavailable collections distinctly", () => {
    expect(createCandidateAssignmentDisplayRows(collection([])).statusText).toBe("Succeeded - 0 assignment recommendations");
    expect(createCandidateAssignmentDisplayRows({
      ...collection([]),
      recommendationStatus: "Unavailable",
      errorSummary: "Candidate tasks unavailable.",
    }).statusText).toBe("Unavailable: Candidate tasks unavailable.");
  });
});

function collection(
  recommendations: CandidateAssignmentRecommendation[],
): CandidateAssignmentRecommendationCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    recommendationStatus: "Succeeded",
    recommendations,
    recommendationCount: recommendations.length,
    generatedAt: "2026-07-27T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    sourceCandidateTaskCount: recommendations.length,
  };
}

function recommendation(
  overrides: Partial<CandidateAssignmentRecommendation> = {},
): CandidateAssignmentRecommendation {
  return {
    id: "rec-1",
    candidateTaskId: "candidate-1",
    candidateTaskTitle: "Fix crash on launch",
    projectId: "daily-proof",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    employeeRole: "Engineer",
    assignmentStatus: "Recommended",
    matchTier: "Moderate",
    matchedCapabilities: ["BugFixing"],
    unmatchedRequirements: [],
    warnings: [],
    taskType: "Bug",
    proposedPriority: "High",
    reasonCodes: ["CAPABILITY_MATCH"],
    generatedAt: "2026-07-27T00:00:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    provenance: {
      candidateTaskId: "candidate-1",
      originatingIssueId: "issue-1",
      issueNumber: 12,
    },
    alternatives: [],
    ...overrides,
  };
}
