import { describe, expect, it } from "vitest";

import { createExternalProjectAdosRunStatusDisplayRows } from "./ExternalProjectAdosRunStatusView";
import type { ExternalProjectAdosRunStatus } from "./ExternalProjectAdosRunStatusTypes";

describe("createExternalProjectAdosRunStatusDisplayRows", () => {
  it("formats branch, worktree, reason, and side-effect boundary", () => {
    const rows = createExternalProjectAdosRunStatusDisplayRows(createStatus("Failed"));

    expect(rows?.statusText).toBe("Failed - Failed");
    expect(rows?.contextText).toContain("branch codex/130-external-project-ados-run-status");
    expect(rows?.contextText).toContain("worktree worktrees/external-crm");
    expect(rows?.reasonText).toBe("reason EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED");
    expect(rows?.boundaryText).toBe(
      "no validation, review, repository mutation, GitHub mutation, publish, merge, or deploy from status inspection",
    );
  });

  it.each(["Prepared", "Started", "Completed", "Blocked", "Failed", "TimedOut", "Cancelled"] as const)(
    "renders %s as a read-only status",
    (stage) => {
      const rows = createExternalProjectAdosRunStatusDisplayRows(createStatus(stage));

      expect(rows?.statusText).toBe(`${stage} - ${stage}`);
      expect(rows?.boundaryText).toContain("from status inspection");
    },
  );
});

function createStatus(stage: ExternalProjectAdosRunStatus["stage"]): ExternalProjectAdosRunStatus {
  return {
    id: "external-crm:external-ados-run-status:external-ados-run-status-v1",
    projectId: "external-crm",
    stage,
    status: stage,
    source: stage === "Prepared" ? "preparation" : "result",
    preparationId: "external-crm:external-ados-run-preparation",
    executionId: stage === "Prepared" ? undefined : "external-crm:external-ados-execution",
    reasonCodes: stage === "Prepared" ? [] : ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"],
    featureBranch: "codex/130-external-project-ados-run-status",
    worktreePath: "C:/worktrees/external-crm",
    updatedAt: "2026-08-25T00:00:00.000Z",
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: "external-ados-run-status-v1",
  };
}
