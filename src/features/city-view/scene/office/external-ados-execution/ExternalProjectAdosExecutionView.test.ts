import { describe, expect, it } from "vitest";

import type { ExternalProjectAdosExecution, ExternalProjectAdosExecutionResult } from "./ExternalProjectAdosExecutionTypes";
import { createExternalProjectAdosExecutionDisplayRows } from "./ExternalProjectAdosExecutionView";

describe("ExternalProjectAdosExecutionView", () => {
  it("renders a compact execution row when execution evidence exists", () => {
    const rows = createExternalProjectAdosExecutionDisplayRows(createExecution(), undefined);

    expect(rows).toEqual({
      statusText: "Completed - codex/130-external-project-ados-run-status",
      contextText: "Ky-Project/AIverse-external-project-ados-run-status; base 7570ef9; policy v1; implementer started",
      boundaryText: "Validation, review, repository mutation, GitHub, publish, merge, and deploy not started.",
    });
  });

  it("renders a blocked result row without execution evidence", () => {
    const rows = createExternalProjectAdosExecutionDisplayRows(undefined, createResult());

    expect(rows?.statusText).toContain("Blocked");
    expect(rows?.contextText).toContain("preparation missing");
    expect(rows?.boundaryText).toContain("Provider not invoked");
  });

  it("returns undefined when no bridge state exists", () => {
    expect(createExternalProjectAdosExecutionDisplayRows(undefined, undefined)).toBeUndefined();
  });
});

function createExecution(): ExternalProjectAdosExecution {
  return {
    id: "external-project-draft:external-ados-execution:external-project-draft:external-ados-run-preparation:external-ados-execution-v1",
    projectId: "external-project-draft",
    preparationId: "external-project-draft:external-ados-run-preparation",
    developmentRequestDraftId: "external-project-draft:external-development-request-draft",
    status: "Completed",
    featureBranch: "codex/130-external-project-ados-run-status",
    authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
    specPath: "specs/130-external-project-ados-run-status/spec.md",
    repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-ados-run-status",
    validationCommands: ["npm test"],
    reviewerCommand: "claude -p",
    executionPolicyVersion: 1,
    trustedLocalExecutionApproved: true,
    startedBy: "Local Human",
    startedAt: "2026-08-25T00:00:00.000Z",
    implementerStarted: true,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    evidence: {
      providerId: "claude",
      agentId: "Claude",
      role: "Implementer",
      commandDisplay: "claude -p",
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-ados-run-status",
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      durationMs: 25,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "external-ados-execution-v1",
  };
}

function createResult(): ExternalProjectAdosExecutionResult {
  return {
    id: "external-project-draft:external-ados-execution-result:missing-preparation:external-ados-execution-v1",
    projectId: "external-project-draft",
    status: "Blocked",
    reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PREPARATION_MISSING"],
    started: false,
    duplicateExistingExecution: false,
    implementerStarted: false,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    resultAt: "2026-08-25T00:00:00.000Z",
    rulesVersion: "external-ados-execution-v1",
  };
}
