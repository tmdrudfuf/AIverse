import { describe, expect, it } from "vitest";

import {
  PREPARED_WORK_SESSION_RULESET_VERSION,
  createPreparedWorkSessionId,
  createPreparedWorkSessionResultId,
  type PreparedWorkSessionResult,
  type PreparedWorkSessionResultCollection,
} from "./PreparedWorkSessionTypes";
import { createPreparedWorkSessionDisplayRows } from "./PreparedWorkSessionView";

describe("PreparedWorkSessionView", () => {
  it("renders prepared sessions with safe non-execution wording", () => {
    const rows = createPreparedWorkSessionDisplayRows(createCollection([createResult("Prepared")]));

    expect(rows.statusText).toBe("1 result");
    expect(rows.resultText).toContain("Prepared GPT Engineer");
    expect(rows.resultText).toContain("Not started");
    expect(rows.resultText).toContain("Inactive");
    expect(rows.resultText).toContain("No agent execution");
    expect(rows.resultText).not.toMatch(/Working|Started automatically|Active session|Executing|Running Codex|Running Claude/i);
  });

  it("renders already prepared, blocked, unavailable, and bounded states", () => {
    expect(createPreparedWorkSessionDisplayRows(createCollection([createResult("AlreadyPrepared")])).resultText)
      .toContain("Already prepared");
    expect(createPreparedWorkSessionDisplayRows(createCollection([createResult("Conflict")])).resultText)
      .toContain("Preparation blocked");
    expect(createPreparedWorkSessionDisplayRows(createCollection([createResult("Unavailable")])).resultText)
      .toContain("Preparation unavailable");

    const rows = createPreparedWorkSessionDisplayRows(createCollection([
      createResult("Prepared"),
      createResult("Conflict", {
        employeeId: "employee-with-a-very-long-identifier",
        employeeDisplayName: undefined,
        reasonCodes: ["CONFIRMED_ASSIGNMENT_STALE"],
      }),
    ]));
    expect(rows.resultText).toContain("employee-with-a...");
    expect(rows.resultText).toContain("+1 more");
  });
});

function createCollection(results: PreparedWorkSessionResult[]): PreparedWorkSessionResultCollection {
  return {
    projectId: "daily-proof",
    results,
    resultCount: results.length,
    generatedAt: "2026-01-03T00:00:00.000Z",
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
  };
}

function createResult(
  status: PreparedWorkSessionResult["status"],
  overrides: Partial<PreparedWorkSessionResult> = {},
): PreparedWorkSessionResult {
  const prepared = status === "Prepared" || status === "AlreadyPrepared";
  return {
    id: createPreparedWorkSessionResultId("daily-proof", "task-12"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    confirmedAssignmentId: "assignment-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    preparedSessionId: createPreparedWorkSessionId("daily-proof", "task-12", "assignment-12"),
    status,
    reasonCodes: prepared ? [status === "Prepared" ? "PREPARED" : "ALREADY_PREPARED"] : ["EMPLOYEE_CONFLICT"],
    prepared,
    duplicateExistingPreparation: status === "AlreadyPrepared",
    humanPrepared: prepared,
    active: false,
    workStarted: false,
    executionStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-03T00:00:00.000Z",
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    ...overrides,
  };
}
