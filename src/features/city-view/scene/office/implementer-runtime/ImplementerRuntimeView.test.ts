import { describe, expect, it } from "vitest";

import { createImplementerRuntimeDisplayRows } from "./ImplementerRuntimeView";
import type { ImplementerRuntimeResultCollection } from "./ImplementerRuntimeTypes";
import type { RuntimeStartResultCollection } from "../runtime-start/RuntimeStartTypes";

const PROJECT_ID = "daily-proof";
const WRAP_LENGTH = 78;
const ROW_PREFIX = "[IMPLEMENTER RUNTIME] ";

function createRuntimeStartResults(status: "Started" | "AlreadyStarted" | "Blocked" | "Failed" | undefined): RuntimeStartResultCollection | undefined {
  if (!status) return undefined;
  return {
    projectId: PROJECT_ID,
    results: [
      {
        id: "result-1",
        projectId: PROJECT_ID,
        executionPlanId: "plan-1",
        status,
        reasonCodes: ["STARTED"],
        started: status === "Started" || status === "AlreadyStarted",
        duplicateExistingStart: status === "AlreadyStarted",
        executionApproved: true,
        runtimePreflightPassed: true,
        executionStarted: status === "Started" || status === "AlreadyStarted",
        agentStarted: false,
        implementerStarted: false,
        reviewerStarted: false,
        validationStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        resultAt: "2026-07-30T00:00:00.000Z",
        rulesVersion: "start-v1",
      },
    ],
    resultCount: 1,
    rulesVersion: "start-v1",
  };
}

function createImplementerResults(status: "Completed" | "TimedOut" | "Cancelled" | "Blocked" | "Failed"): ImplementerRuntimeResultCollection {
  return {
    projectId: PROJECT_ID,
    results: [
      {
        id: "implementer-result-1",
        projectId: PROJECT_ID,
        runtimeStartId: "runtime-start-1",
        executionPlanId: "plan-1",
        implementerRuntimeId: "implementer-runtime-1",
        status,
        reasonCodes: ["IMPLEMENTER_RUNTIME_STARTED"],
        started: status === "Completed" || status === "TimedOut",
        duplicateActiveAttempt: false,
        agentStarted: status === "Completed" || status === "TimedOut",
        implementerStarted: status === "Completed" || status === "TimedOut",
        reviewerStarted: false,
        validationStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        resultAt: "2026-07-30T00:00:01.000Z",
        rulesVersion: "claude-implementer-v1",
      },
    ],
    resultCount: 1,
    rulesVersion: "claude-implementer-v1",
  };
}

describe("createImplementerRuntimeDisplayRows", () => {
  it("shows Implementer Unavailable when no Runtime Start exists", () => {
    const rows = createImplementerRuntimeDisplayRows(undefined, undefined);
    expect(rows.statusText).toContain("unavailable");
    expect(rows.statusText.toLowerCase()).toContain("start");
  });

  it("shows Implementer Unavailable when Runtime Start results exist but never reached Started/AlreadyStarted", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Blocked"), undefined);
    expect(rows.statusText).toContain("unavailable");
  });

  it("shows Claude Ready with the I start label when Runtime Start exists but no attempt has been made", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), undefined);
    expect(rows.statusText).toContain("ready");
    expect(rows.statusText).toContain("press I to start");
    expect(rows.statusText).toContain("Codex not started");
  });

  it("shows Claude Ready even when Runtime Start's own status is AlreadyStarted", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("AlreadyStarted"), undefined);
    expect(rows.statusText).toContain("ready");
  });

  it("shows Completed with Codex Not Started and no mutation claim", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Completed"));
    expect(rows.statusText).toContain("Completed");
    expect(rows.statusText).toContain("Codex not started");
    expect(rows.statusText).toContain("no mutation");
    expect(rows.statusText).not.toContain("Validation Passed");
    expect(rows.statusText).not.toContain("Codex Approved");
  });

  it("shows Timed Out with Codex Not Started", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("TimedOut"));
    expect(rows.statusText.toLowerCase()).toContain("timed out");
    expect(rows.statusText).toContain("Codex not started");
  });

  it("shows Blocked with Codex Not Started", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Blocked"));
    expect(rows.statusText.toLowerCase()).toContain("blocked");
    expect(rows.statusText.toLowerCase()).toContain("inspect");
    expect(rows.statusText).toContain("Codex not started");
  });

  it("shows Failed with Codex Not Started", () => {
    const rows = createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Failed"));
    expect(rows.statusText.toLowerCase()).toContain("failed");
    expect(rows.statusText).toContain("Codex not started");
  });

  it("never claims validation passed, Codex approval, or a repository change for any state", () => {
    const forbidden = ["Validation Passed", "Codex Approved", "Ready to Merge", "Changes Committed", "PR Created", "Codex Running"];
    const allRows = [
      createImplementerRuntimeDisplayRows(undefined, undefined),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), undefined),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Completed")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("TimedOut")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Blocked")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Failed")),
    ];
    for (const row of allRows) {
      for (const phrase of forbidden) {
        expect(row.statusText).not.toContain(phrase);
      }
    }
  });

  it("keeps every state's row text within the 78-character lower-panel wrap budget including the bracket prefix", () => {
    const allRows = [
      createImplementerRuntimeDisplayRows(undefined, undefined),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), undefined),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Completed")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("TimedOut")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Blocked")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Failed")),
      createImplementerRuntimeDisplayRows(createRuntimeStartResults("Started"), createImplementerResults("Cancelled")),
    ];
    for (const row of allRows) {
      expect(`${ROW_PREFIX}${row.statusText}`.length).toBeLessThanOrEqual(WRAP_LENGTH);
    }
  });
});
