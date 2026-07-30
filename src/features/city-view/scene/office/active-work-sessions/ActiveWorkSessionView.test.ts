import { describe, expect, it } from "vitest";

import type { ActiveWorkSessionStartResult, ActiveWorkSessionStartResultCollection } from "./ActiveWorkSessionTypes";
import { createActiveWorkSessionDisplayRows } from "./ActiveWorkSessionView";

describe("ActiveWorkSessionView", () => {
  it("renders active state without claiming agent execution or repository mutation", () => {
    const rows = createActiveWorkSessionDisplayRows(collection([result("Started")]));

    expect(rows.statusText).toBe("1 start result");
    expect(rows.resultText).toContain("Work session active");
    expect(rows.resultText).toContain("Work started");
    expect(rows.resultText).toContain("Agent execution not started");
    expect(rows.resultText).toContain("No repository mutation");
  });

  it("renders already-started, blocked, unavailable, and conflict states", () => {
    expect(createActiveWorkSessionDisplayRows(collection([result("AlreadyStarted")])).resultText).toContain("Already started");
    expect(createActiveWorkSessionDisplayRows(collection([result("Ineligible")])).resultText).toContain("Start blocked");
    expect(createActiveWorkSessionDisplayRows(collection([result("Unavailable")])).resultText).toContain("Start unavailable");
    expect(createActiveWorkSessionDisplayRows(collection([result("Conflict")])).resultText).toContain("Start conflict");
  });

  it("does not claim work started for blocked or failed start results", () => {
    for (const status of ["Ineligible", "Unavailable", "Conflict", "Failed"] as const) {
      const rows = createActiveWorkSessionDisplayRows(collection([result(status)]));

      expect(rows.resultText).toContain("Not started");
      expect(rows.resultText).not.toContain("Work started");
    }
  });

  it("bounds long identifiers and reports additional results", () => {
    const rows = createActiveWorkSessionDisplayRows(collection([
      result("Started", {
        activeSessionId: "daily-proof:work-session:task-12:very-long-prepared-session-id:active-session-v1",
        employeeDisplayName: "Extremely Long Employee Display Name",
      }),
      result("Failed", {
        activeSessionId: undefined,
        projectTaskId: "daily-proof:promoted-task:long-task-id",
        reasonCodes: ["PREPARED_SESSION_REPOSITORY_MUTATION_STARTED"],
      }),
    ]));

    expect(rows.statusText).toBe("2 start results");
    expect(rows.resultText).toContain("Start failed");
    expect(rows.resultText).toContain("+1 more");
    expect(rows.resultText!.length).toBeLessThan(180);
  });

  it("handles absent and empty collections", () => {
    expect(createActiveWorkSessionDisplayRows(undefined).statusText).toBe("No active work-session starts");
    expect(createActiveWorkSessionDisplayRows(collection([])).statusText).toBe("No active work-session starts");
  });
});

function collection(results: ActiveWorkSessionStartResult[]): ActiveWorkSessionStartResultCollection {
  return {
    projectId: "daily-proof",
    results,
    resultCount: results.length,
    generatedAt: "2026-01-04T00:00:00.000Z",
    rulesetVersion: "active-session-v1",
  };
}

function result(
  status: ActiveWorkSessionStartResult["status"],
  overrides: Partial<ActiveWorkSessionStartResult> = {},
): ActiveWorkSessionStartResult {
  return {
    id: "daily-proof:work-session-start-result:task-12:prepared-12:active-session-v1",
    projectId: "daily-proof",
    projectTaskId: "task-12",
    preparedSessionId: "prepared-12",
    confirmedAssignmentId: "assignment-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    activeSessionId: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
    status,
    reasonCodes: status === "Started" ? ["STARTED"] : ["TASK_ALREADY_STARTED"],
    started: status === "Started" || status === "AlreadyStarted",
    duplicateExistingSession: status === "AlreadyStarted",
    humanStarted: status === "Started" || status === "AlreadyStarted",
    active: status === "Started" || status === "AlreadyStarted",
    workStarted: status === "Started" || status === "AlreadyStarted",
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-04T00:00:00.000Z",
    rulesetVersion: "active-session-v1",
    ...overrides,
  };
}
