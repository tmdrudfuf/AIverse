import type { ImplementerRuntimeEvidence, ImplementerRuntimeStatus } from "../implementer-runtime/ImplementerRuntimeTypes";

export const EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION = "external-ados-execution-v1";

export type ExternalProjectAdosExecutionStatus = ImplementerRuntimeStatus;

export type ExternalProjectAdosExecutionReasonCode =
  | "EXTERNAL_ADOS_EXECUTION_STARTED"
  | "EXTERNAL_ADOS_EXECUTION_ALREADY_COMPLETED"
  | "EXTERNAL_ADOS_EXECUTION_PREPARATION_MISSING"
  | "EXTERNAL_ADOS_EXECUTION_PREPARATION_STALE"
  | "EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING"
  | "EXTERNAL_ADOS_EXECUTION_TRUST_NOT_GRANTED"
  | "EXTERNAL_ADOS_EXECUTION_COMMAND_UNSAFE"
  | "EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"
  | "EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"
  | "EXTERNAL_ADOS_EXECUTION_TIMED_OUT"
  | "EXTERNAL_ADOS_EXECUTION_CANCELLED"
  | "EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE";

export type ExternalProjectAdosExecution = {
  id: string;
  projectId: string;
  preparationId: string;
  developmentRequestDraftId: string;
  status: ExternalProjectAdosExecutionStatus;
  // Received from the ImplementerRuntimeProvider's own result evidence (the
  // execution boundary actually invoked), not propagated from an input-side
  // literal - see specs/148-.../runtime-evidence.json.
  durableAdosRunId?: string;
  featureId?: string;
  featureBranch: string;
  authoritativeBaseSha: string;
  specPath: string;
  requirementsFilePath?: string;
  repositoryPath: string;
  worktreePath: string;
  validationCommands: string[];
  reviewerCommand: string;
  executionPolicyVersion: number;
  trustedLocalExecutionApproved: true;
  startedBy: string;
  startedAt: string;
  implementerStarted: boolean;
  validationStarted: false;
  reviewStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  publishStarted: false;
  mergeStarted: false;
  deployStarted: false;
  evidence: ImplementerRuntimeEvidence;
  rulesVersion: string;
};

export type ExternalProjectAdosExecutionResult = {
  id: string;
  projectId: string;
  preparationId?: string;
  executionId?: string;
  durableAdosRunId?: string;
  status: ExternalProjectAdosExecutionStatus;
  reasonCodes: ExternalProjectAdosExecutionReasonCode[];
  started: boolean;
  duplicateExistingExecution: boolean;
  implementerStarted: boolean;
  validationStarted: false;
  reviewStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  publishStarted: false;
  mergeStarted: false;
  deployStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ExternalProjectAdosExecutions = Record<string, ExternalProjectAdosExecution>;

export type ExternalProjectAdosExecutionResults = Record<string, ExternalProjectAdosExecutionResult>;

export function createExternalProjectAdosExecutionId(
  projectId: string,
  preparationId: string,
  rulesVersion = EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION,
) {
  return `${projectId}:external-ados-execution:${preparationId}:${rulesVersion}`;
}

export function createExternalProjectAdosExecutionResultId(
  projectId: string,
  preparationId: string,
  rulesVersion = EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION,
) {
  return `${projectId}:external-ados-execution-result:${preparationId}:${rulesVersion}`;
}

export function copyExternalProjectAdosExecution(
  execution: ExternalProjectAdosExecution,
): ExternalProjectAdosExecution {
  return {
    ...execution,
    validationCommands: [...execution.validationCommands],
    evidence: { ...execution.evidence },
  };
}

/**
 * Completion coordinator (Spec 148 finding 3, independent review): re-derives
 * whether a task's execution reached verified technical publication
 * readiness directly from the execution's own evidence -- the same
 * evidence a real ExternalAdosChildRunImplementerProvider run populated by
 * causally driving the child run and reading back its durable summary. This
 * never accepts a caller-supplied confirmation; a caller with no real
 * execution, or an execution whose provider never performed the child-run
 * boundary, always gets `ready: false`.
 */
export function deriveExecutionPublicationReadiness(
  execution: ExternalProjectAdosExecution | undefined,
): { ready: boolean; reasonCode: string } {
  const readiness = execution?.evidence.childRunTechnicalReadiness;
  if (!readiness) return { ready: false, reasonCode: "EXTERNAL_ADOS_EXECUTION_CHILD_RUN_EVIDENCE_MISSING" };
  if (execution?.durableAdosRunId !== readiness.childRunId) {
    return { ready: false, reasonCode: "EXTERNAL_ADOS_EXECUTION_CHILD_RUN_ID_MISMATCH" };
  }
  return readiness.ready
    ? { ready: true, reasonCode: "EXTERNAL_ADOS_EXECUTION_CHILD_RUN_READY" }
    : { ready: false, reasonCode: "EXTERNAL_ADOS_EXECUTION_CHILD_RUN_NOT_READY" };
}

export function copyExternalProjectAdosExecutionResult(
  result: ExternalProjectAdosExecutionResult,
): ExternalProjectAdosExecutionResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
