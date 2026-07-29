import { describe, expect, it } from "vitest";

import {
  CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  createConfirmedEmployeeAssignmentRecordId,
  createConfirmedEmployeeAssignmentResultCollection,
  createConfirmedEmployeeAssignmentResultId,
  type ConfirmedEmployeeAssignmentResult,
} from "./ConfirmedEmployeeAssignmentTypes";

describe("ConfirmedEmployeeAssignmentTypes", () => {
  it("creates deterministic record and result identifiers without timestamps or display names", () => {
    expect(createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-1", "employee-1")).toBe(
      "daily-proof:task-assignment:task-1:employee-1:confirmed-assignment-v1",
    );
    expect(createConfirmedEmployeeAssignmentResultId("daily-proof", "task-1")).toBe(
      "daily-proof:task-assignment-result:task-1:confirmed-assignment-v1",
    );
  });

  it("defensively copies result collections and reason arrays", () => {
    const result = createResult();
    const collection = createConfirmedEmployeeAssignmentResultCollection({
      projectId: "daily-proof",
      results: [result],
      generatedAt: "2026-01-01T00:00:00.000Z",
      rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
    });

    result.reasonCodes.push("PROJECT_MISMATCH");
    collection.results[0]!.reasonCodes.push("EMPLOYEE_CONFLICT");

    const reread = createConfirmedEmployeeAssignmentResultCollection({
      projectId: collection.projectId,
      results: collection.results,
      generatedAt: collection.generatedAt,
      rulesetVersion: collection.rulesetVersion,
    });

    expect(reread.results[0]!.reasonCodes).toEqual(["ASSIGNED", "EMPLOYEE_CONFLICT"]);
    expect(result.reasonCodes).toEqual(["ASSIGNED", "PROJECT_MISMATCH"]);
    expect(collection.resultCount).toBe(1);
  });
});

function createResult(): ConfirmedEmployeeAssignmentResult {
  return {
    id: createConfirmedEmployeeAssignmentResultId("daily-proof", "task-1"),
    projectId: "daily-proof",
    projectTaskId: "task-1",
    candidateTaskId: "candidate-1",
    employeeId: "employee-1",
    assignmentRecordId: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-1", "employee-1"),
    status: "Assigned",
    reasonCodes: ["ASSIGNED"],
    assignedTask: true,
    humanConfirmed: true,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    duplicateExistingAssignment: false,
    resultAt: "2026-01-01T00:00:00.000Z",
    rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  };
}
