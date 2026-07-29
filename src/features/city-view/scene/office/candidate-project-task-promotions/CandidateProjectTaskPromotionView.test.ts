import { describe, expect, it } from "vitest";
import type { CandidateProjectTaskPromotionResultCollection } from "./CandidateProjectTaskPromotionTypes";
import { createCandidateProjectTaskPromotionDisplayRows } from "./CandidateProjectTaskPromotionView";

describe("CandidateProjectTaskPromotionView", () => {
  it.each([
    ["Promoted", "Promoted to project task"],
    ["AlreadyPromoted", "Already promoted"],
    ["Rejected", "Promotion blocked"],
    ["Ineligible", "Promotion blocked"],
    ["Unavailable", "Promotion unavailable"],
  ] as const)("renders %s safely", (status, expected) => {
    const rows = createCandidateProjectTaskPromotionDisplayRows(collection([result({ status })]));

    expect(rows.statusText).toBe("1 result");
    expect(rows.resultText).toContain(expected);
    expect(rows.resultText).toContain("Not started");
    expect(rows.resultText).toContain("Unassigned");
    expect(rows.resultText).not.toMatch(/Coding|Executing|Started automatically|Assigned and running/);
  });

  it("prioritizes safety text over long task IDs and shows overflow count", () => {
    const rows = createCandidateProjectTaskPromotionDisplayRows(collection([
      result({ candidateTaskId: "first" }),
      result({ createdProjectTaskId: "daily-proof:promoted-task:very-long-candidate-id:candidate-promotion-v1" }),
    ]));

    expect(rows.resultText).toContain("Not started");
    expect(rows.resultText).toContain("Unassigned");
    expect(rows.resultText).toContain("+1 more");
  });

  it("bounds long blocked-result task references", () => {
    const rows = createCandidateProjectTaskPromotionDisplayRows(collection([
      result({
        status: "Ineligible",
        candidateTaskId: "daily-proof:candidate-task:very-long-candidate-id",
        createdProjectTaskId: undefined,
        reasonCodes: ["STALE_ASSIGNMENT"],
        activeTaskCreated: false,
      }),
    ]));

    expect(rows.resultText).toContain("daily-proof:candidate...");
    expect(rows.resultText).toContain("STALE_ASSIGNMENT");
  });

  it("renders empty state", () => {
    expect(createCandidateProjectTaskPromotionDisplayRows(undefined).statusText).toBe("No promotion attempts");
    expect(createCandidateProjectTaskPromotionDisplayRows(collection([])).statusText).toBe("No promotion attempts");
  });
});

function collection(results: CandidateProjectTaskPromotionResultCollection["results"]): CandidateProjectTaskPromotionResultCollection {
  return {
    projectId: "daily-proof",
    results,
    resultCount: results.length,
    generatedAt: "2026-07-28T00:00:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
  };
}

function result(
  overrides: Partial<CandidateProjectTaskPromotionResultCollection["results"][number]> = {},
): CandidateProjectTaskPromotionResultCollection["results"][number] {
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
    activeTaskCreated: true,
    workStarted: false,
    employeeAssigned: false,
    executionStarted: false,
    ...overrides,
  };
}
