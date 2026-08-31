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

export function copyExternalProjectAdosExecutionResult(
  result: ExternalProjectAdosExecutionResult,
): ExternalProjectAdosExecutionResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
