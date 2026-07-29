import { describe, expect, it } from "vitest";

import {
  CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  createConfirmedEmployeeAssignmentRecordId,
  createConfirmedEmployeeAssignmentResultId,
  type ConfirmedEmployeeAssignmentResult,
  type ConfirmedEmployeeAssignmentResultCollection,
} from "./ConfirmedEmployeeAssignmentTypes";
import { createConfirmedEmployeeAssignmentDisplayRows } from "./ConfirmedEmployeeAssignmentView";

describe("ConfirmedEmployeeAssignmentView", () => {
  it("renders confirmed assignment with safe non-execution wording", () => {
    const rows = createConfirmedEmployeeAssignmentDisplayRows(createCollection([createResult("Assigned")]));

    expect(rows.statusText).toBe("1");
    expect(rows.resultText).toContain("Assignment confirmed");
    expect(rows.resultText).toContain("Not started");
    expect(rows.resultText).toContain("No work session");
    expect(rows.resultText).not.toMatch(/Working|Executing|Coding now|Running task|Work session active/i);
  });

  it("renders blocked, unavailable, and already assigned states", () => {
    expect(createConfirmedEmployeeAssignmentDisplayRows(createCollection([createResult("AlreadyAssigned")])).resultText)
      .toContain("Already assigned");
    expect(createConfirmedEmployeeAssignmentDisplayRows(createCollection([createResult("Conflict")])).resultText)
      .toContain("Assignment blocked");
    expect(createConfirmedEmployeeAssignmentDisplayRows(createCollection([createResult("Unavailable")])).resultText)
      .toContain("Assignment unavailable");
  });

  it("bounds long employee IDs and reason text with +N more", () => {
    const rows = createConfirmedEmployeeAssignmentDisplayRows(createCollection([
      createResult("Ineligible", { reasonCodes: ["RECOMMENDATION_STALE", "PROJECT_MISMATCH"] }),
      createResult("Conflict", { employeeId: "employee-with-a-very-long-identifier", reasonCodes: ["EMPLOYEE_CONFLICT"] }),
    ]));

    expect(rows.statusText).toBe("2");
    expect(rows.resultText).toContain("employee-with-a...");
    expect(rows.resultText).toContain("+1 more");
    expect(rows.resultText).toContain("EMPLOYEE_CONFLICT");
  });
});

function createCollection(results: ConfirmedEmployeeAssignmentResult[]): ConfirmedEmployeeAssignmentResultCollection {
  return {
    projectId: "daily-proof",
    results,
    resultCount: results.length,
    generatedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  };
}

function createResult(
  status: ConfirmedEmployeeAssignmentResult["status"],
  overrides: Partial<ConfirmedEmployeeAssignmentResult> = {},
): ConfirmedEmployeeAssignmentResult {
  const assigned = status === "Assigned" || status === "AlreadyAssigned";
  return {
    id: createConfirmedEmployeeAssignmentResultId("daily-proof", "task-12"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    employeeId: "gpt-engineer",
    assignmentRecordId: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-12", "gpt-engineer"),
    status,
    reasonCodes: assigned ? [status === "Assigned" ? "ASSIGNED" : "ALREADY_ASSIGNED"] : ["EMPLOYEE_CONFLICT"],
    assignedTask: assigned,
    humanConfirmed: assigned,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    duplicateExistingAssignment: status === "AlreadyAssigned",
    resultAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
    ...overrides,
  };
}
