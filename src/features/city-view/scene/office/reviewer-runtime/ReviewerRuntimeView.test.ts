import { describe, expect, it } from "vitest";

import type { ImplementerRuntimeResultCollection } from "../implementer-runtime/ImplementerRuntimeTypes";
import { createReviewerRuntimeDisplayRows } from "./ReviewerRuntimeView";
import type { ReviewerRuntimeResultCollection } from "./ReviewerRuntimeTypes";

const PROJECT_ID = "daily-proof";
const WRAP_LENGTH = 78;
const ROW_PREFIX = "[REVIEWER RUNTIME] ";

function createImplementerResults(status: "Completed" | "TimedOut" | "Cancelled" | "Blocked" | "Failed" | undefined): ImplementerRuntimeResultCollection | undefined {
  if (!status) return undefined;
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
        resultAt: "2026-07-31T00:00:01.000Z",
        rulesVersion: "claude-implementer-v1",
      },
    ],
    resultCount: 1,
    rulesVersion: "claude-implementer-v1",
  };
}

function createReviewerResults(
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
  decision: "Approved" | "ChangesRequested" | "Unknown" = "Unknown",
  blockingFindingCount = 0,
): ReviewerRuntimeResultCollection {
  return {
    projectId: PROJECT_ID,
    results: [
      {
        id: "reviewer-result-1",
        projectId: PROJECT_ID,
        runtimeStartId: "runtime-start-1",
        implementerRuntimeId: "implementer-runtime-1",
        reviewerRuntimeId: status === "Completed" || status === "TimedOut" ? "reviewer-runtime-1" : undefined,
        status,
        decision,
        blockingFindingCount,
        nonBlockingFindingCount: 0,
        reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
        started: status === "Completed" || status === "TimedOut",
        duplicateActiveAttempt: false,
        agentStarted: status === "Completed" || status === "TimedOut",
        implementerStarted: true,
        reviewerStarted: status === "Completed" || status === "TimedOut",
        validationStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        resultAt: "2026-07-31T00:00:02.000Z",
        rulesVersion: "codex-reviewer-v1",
      },
    ],
    resultCount: 1,
    rulesVersion: "codex-reviewer-v1",
  };
}

describe("createReviewerRuntimeDisplayRows", () => {
  it("shows Codex unavailable when the Implementer Runtime has not completed", () => {
    const rows = createReviewerRuntimeDisplayRows(undefined, undefined);
    expect(rows.statusText).toContain("unavailable");
    expect(rows.statusText).toContain("Claude Completed");
  });

  it("shows Codex unavailable when the latest Implementer result is Blocked, not Completed", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Blocked"), undefined);
    expect(rows.statusText).toContain("unavailable");
  });

  it("shows Codex Ready once the Implementer Runtime is Completed but Reviewer has not started", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), undefined);
    expect(rows.statusText).toContain("ready");
    expect(rows.statusText).toContain("explicit start required");
    expect(rows.statusText).toContain("not started");
  });

  it("shows Approved with blocking finding count and requires a human remote decision", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "Approved", 0));
    expect(rows.statusText).toContain("Approved");
    expect(rows.statusText).toContain("Blocking Findings: 0");
    expect(rows.statusText).toContain("Human Decision Required");
    expect(rows.statusText).not.toContain("Approved for Merge");
  });

  it("shows Changes Requested with a non-zero blocking finding count and no mutation claim", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "ChangesRequested", 2));
    expect(rows.statusText).toContain("Changes Requested");
    expect(rows.statusText).toContain("Blocking Findings: 2");
    expect(rows.statusText).toContain("no mutation");
  });

  it("shows Decision Unknown distinctly from both Approved and Changes Requested", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "Unknown", 0));
    expect(rows.statusText).toContain("Decision Unknown");
    expect(rows.statusText).not.toContain("Approved");
    expect(rows.statusText).not.toContain("Changes Requested");
  });

  it("shows TimedOut distinctly with no mutation claim", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("TimedOut"));
    expect(rows.statusText).toContain("Timed out");
    expect(rows.statusText).toContain("no mutation");
  });

  it("shows Failed distinctly with no mutation claim", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Failed"));
    expect(rows.statusText).toContain("Failed");
    expect(rows.statusText).toContain("no mutation");
  });

  it("shows Blocked distinctly, prompting requirement resolution", () => {
    const rows = createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Blocked"));
    expect(rows.statusText).toContain("Blocked");
    expect(rows.statusText).toContain("resolve requirements");
  });

  it("every state's row fits within the shared wrap budget with the panel prefix", () => {
    const states: Array<ReturnType<typeof createReviewerRuntimeDisplayRows>> = [
      createReviewerRuntimeDisplayRows(undefined, undefined),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), undefined),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "Approved", 0)),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "ChangesRequested", 3)),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Completed", "Unknown", 0)),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("TimedOut")),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Failed")),
      createReviewerRuntimeDisplayRows(createImplementerResults("Completed"), createReviewerResults("Blocked")),
    ];

    for (const rows of states) {
      expect((ROW_PREFIX + rows.statusText).length).toBeLessThanOrEqual(WRAP_LENGTH);
    }
  });
});
