import { describe, expect, it } from "vitest";

import type { ExternalProjectAdosExecution, ExternalProjectAdosExecutionResult } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import { deriveExternalProjectAdosRunStatus } from "./ExternalProjectAdosRunStatusService";

describe("deriveExternalProjectAdosRunStatus", () => {
  it("derives a prepared status when only preparation evidence exists", () => {
    const status = deriveExternalProjectAdosRunStatus({
      projectId: "external-crm",
      preparation: createPreparation(),
    });

    expect(status).toMatchObject({
      projectId: "external-crm",
      stage: "Prepared",
      status: "Prepared",
      source: "preparation",
      preparationId: "external-crm:external-ados-run-preparation",
      featureBranch: "codex/130-external-project-ados-run-status",
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
  });

  it("prefers latest result evidence over stale persisted status", () => {
    const status = deriveExternalProjectAdosRunStatus({
      projectId: "external-crm",
      preparation: createPreparation(),
      execution: createExecution("Completed"),
      result: createResult("Failed", ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"]),
      persistedStatus: {
        id: "external-crm:external-ados-run-status:stale",
        projectId: "external-crm",
        stage: "Prepared",
        status: "Prepared",
        source: "preparation",
        reasonCodes: [],
        updatedAt: "2026-08-24T00:00:00.000Z",
        validationStarted: false,
        reviewStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        publishStarted: false,
        mergeStarted: false,
        deployStarted: false,
        rulesVersion: "stale",
      },
    });

    expect(status).toMatchObject({
      stage: "Failed",
      status: "Failed",
      source: "result",
      executionId: "external-crm:external-ados-execution",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"],
      updatedAt: "2026-08-25T00:00:00.000Z",
    });
  });

  it.each([
    ["Completed", "Completed", "EXTERNAL_ADOS_EXECUTION_STARTED"],
    ["Blocked", "Blocked", "EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"],
    ["Failed", "Failed", "EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"],
    ["TimedOut", "TimedOut", "EXTERNAL_ADOS_EXECUTION_TIMED_OUT"],
    ["Cancelled", "Cancelled", "EXTERNAL_ADOS_EXECUTION_CANCELLED"],
  ] as const)("derives %s result status with read-only side-effect flags", (executionStatus, stage, reasonCode) => {
    const status = deriveExternalProjectAdosRunStatus({
      projectId: "external-crm",
      preparation: createPreparation(),
      execution: createExecution(executionStatus),
      result: createResult(executionStatus, [reasonCode]),
    });

    expect(status?.stage).toBe(stage);
    expect(status?.reasonCodes).toEqual([reasonCode]);
    expect(status).toMatchObject({
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
  });

  it("derives started status from in-flight execution evidence without a result", () => {
    const status = deriveExternalProjectAdosRunStatus({
      projectId: "external-crm",
      execution: createExecution("Completed", { completed: false }),
    });

    expect(status).toMatchObject({
      stage: "Started",
      status: "Completed",
      source: "execution",
      executionId: "external-crm:external-ados-execution",
    });
  });

  it("adds fallback reason codes for blocked or failed evidence without reasons", () => {
    const status = deriveExternalProjectAdosRunStatus({
      projectId: "external-crm",
      execution: createExecution("Blocked", { started: false, completed: false }),
    });

    expect(status).toMatchObject({
      stage: "Blocked",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"],
    });
  });
});

function createPreparation(): ExternalProjectAdosRunPreparation {
  return {
    id: "external-crm:external-ados-run-preparation",
    projectId: "external-crm",
    developmentRequestDraftId: "external-crm:external-development-request-draft",
    status: "Prepared",
    featureBranch: "codex/130-external-project-ados-run-status",
    authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
    specPath: "specs/130-external-project-ados-run-status/spec.md",
    validationCommands: ["npm test"],
    reviewerCommand: "claude -p",
    executionPolicyVersion: 1,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    sideEffectBoundary: "Local preparation only.",
  };
}

function createExecution(
  status: ExternalProjectAdosExecution["status"],
  evidence: Partial<ExternalProjectAdosExecution["evidence"]> = {},
): ExternalProjectAdosExecution {
  return {
    id: "external-crm:external-ados-execution",
    projectId: "external-crm",
    preparationId: "external-crm:external-ados-run-preparation",
    developmentRequestDraftId: "external-crm:external-development-request-draft",
    status,
    featureBranch: "codex/130-external-project-ados-run-status",
    authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
    specPath: "specs/130-external-project-ados-run-status/spec.md",
    repositoryPath: "C:/repo/external-crm",
    worktreePath: "C:/worktrees/external-crm",
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
      commandDisplay: "claude --dangerously-skip-permissions -p {{prompt}}",
      workingDirectory: "C:/worktrees/external-crm",
      started: true,
      completed: true,
      timedOut: status === "TimedOut",
      cancelled: status === "Cancelled",
      exitCode: status === "Completed" ? 0 : 1,
      durationMs: 25,
      stdoutSummary: "done",
      stderrSummary: "",
      outputTruncated: false,
      ...evidence,
    },
    rulesVersion: "external-ados-execution-v1",
  };
}

function createResult(
  status: ExternalProjectAdosExecutionResult["status"],
  reasonCodes: ExternalProjectAdosExecutionResult["reasonCodes"],
): ExternalProjectAdosExecutionResult {
  return {
    id: "external-crm:external-ados-execution-result",
    projectId: "external-crm",
    preparationId: "external-crm:external-ados-run-preparation",
    executionId: "external-crm:external-ados-execution",
    status,
    reasonCodes,
    started: status === "Completed" || status === "TimedOut",
    duplicateExistingExecution: false,
    implementerStarted: status === "Completed" || status === "TimedOut",
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
