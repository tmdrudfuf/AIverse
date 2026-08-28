import type {
  ExternalProjectAdosExecution,
  ExternalProjectAdosExecutionReasonCode,
  ExternalProjectAdosExecutionResult,
} from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import {
  EXTERNAL_PROJECT_ADOS_RUN_STATUS_RULES_VERSION,
  type ExternalProjectAdosRunStatus,
  type ExternalProjectAdosRunStatusStage,
} from "./ExternalProjectAdosRunStatusTypes";

export type DeriveExternalProjectAdosRunStatusInput = {
  projectId: string;
  preparation?: ExternalProjectAdosRunPreparation;
  execution?: ExternalProjectAdosExecution;
  result?: ExternalProjectAdosExecutionResult;
  persistedStatus?: ExternalProjectAdosRunStatus;
};

export function deriveExternalProjectAdosRunStatus(
  input: DeriveExternalProjectAdosRunStatusInput,
): ExternalProjectAdosRunStatus | undefined {
  if (input.result) return createStatusFromResult(input);
  if (input.execution) return createStatusFromExecution(input);
  if (input.preparation) return createStatusFromPreparation(input.projectId, input.preparation);
  return cloneStatus(input.persistedStatus);
}

function createStatusFromResult(input: DeriveExternalProjectAdosRunStatusInput): ExternalProjectAdosRunStatus {
  const result = input.result!;
  const preparation = input.preparation;
  const execution = input.execution;

  return createStatus({
    projectId: result.projectId || input.projectId,
    stage: result.status,
    status: result.status,
    source: "result",
    preparationId: result.preparationId ?? preparation?.id,
    executionId: result.executionId ?? execution?.id,
    reasonCodes: normalizeReasonCodes(result.status, result.reasonCodes),
    featureBranch: execution?.featureBranch ?? preparation?.featureBranch,
    worktreePath: execution?.worktreePath,
    updatedAt: result.resultAt,
  });
}

function createStatusFromExecution(input: DeriveExternalProjectAdosRunStatusInput): ExternalProjectAdosRunStatus {
  const execution = input.execution!;

  return createStatus({
    projectId: execution.projectId || input.projectId,
    stage: toExecutionStage(execution),
    status: execution.status,
    source: "execution",
    preparationId: execution.preparationId,
    executionId: execution.id,
    reasonCodes: normalizeReasonCodes(execution.status, []),
    featureBranch: execution.featureBranch,
    worktreePath: execution.worktreePath,
    updatedAt: execution.startedAt,
  });
}

function createStatusFromPreparation(
  projectId: string,
  preparation: ExternalProjectAdosRunPreparation,
): ExternalProjectAdosRunStatus {
  return createStatus({
    projectId: preparation.projectId || projectId,
    stage: "Prepared",
    status: preparation.status,
    source: "preparation",
    preparationId: preparation.id,
    reasonCodes: [],
    featureBranch: preparation.featureBranch,
    updatedAt: preparation.updatedAt,
  });
}

function createStatus(input: {
  projectId: string;
  stage: ExternalProjectAdosRunStatusStage;
  status: string;
  source: ExternalProjectAdosRunStatus["source"];
  preparationId?: string;
  executionId?: string;
  reasonCodes: ExternalProjectAdosRunStatus["reasonCodes"];
  featureBranch?: string;
  worktreePath?: string;
  updatedAt: string;
}): ExternalProjectAdosRunStatus {
  return {
    id: `${input.projectId}:external-ados-run-status:${EXTERNAL_PROJECT_ADOS_RUN_STATUS_RULES_VERSION}`,
    projectId: input.projectId,
    stage: input.stage,
    status: input.status,
    source: input.source,
    preparationId: input.preparationId,
    executionId: input.executionId,
    reasonCodes: [...input.reasonCodes],
    featureBranch: input.featureBranch,
    worktreePath: input.worktreePath,
    updatedAt: input.updatedAt,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: EXTERNAL_PROJECT_ADOS_RUN_STATUS_RULES_VERSION,
  };
}

function toExecutionStage(execution: ExternalProjectAdosExecution): ExternalProjectAdosRunStatusStage {
  if (
    execution.status === "Completed" &&
    execution.implementerStarted &&
    !execution.evidence.completed &&
    !execution.evidence.timedOut &&
    !execution.evidence.cancelled
  ) {
    return "Started";
  }
  return execution.status;
}

function normalizeReasonCodes(
  status: ExternalProjectAdosExecutionResult["status"],
  reasonCodes: ReadonlyArray<ExternalProjectAdosExecutionReasonCode>,
): ExternalProjectAdosExecutionReasonCode[] {
  if (reasonCodes.length > 0) return [...reasonCodes];

  switch (status) {
    case "Blocked":
      return ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"];
    case "Failed":
      return ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"];
    case "TimedOut":
      return ["EXTERNAL_ADOS_EXECUTION_TIMED_OUT"];
    case "Cancelled":
      return ["EXTERNAL_ADOS_EXECUTION_CANCELLED"];
    case "Completed":
    default:
      return [];
  }
}

function cloneStatus(status: ExternalProjectAdosRunStatus | undefined): ExternalProjectAdosRunStatus | undefined {
  if (!status) return undefined;
  return {
    ...status,
    reasonCodes: [...status.reasonCodes],
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
  };
}
