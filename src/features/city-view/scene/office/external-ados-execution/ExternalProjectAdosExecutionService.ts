import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import { DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG } from "../implementer-runtime/ImplementerRuntimeService";
import type { ImplementerRuntimeProvider, ImplementerRuntimeProviderCommand } from "../implementer-runtime/ImplementerRuntimeProvider";
import { isSafeImplementerCommand } from "../implementer-runtime/ClaudeImplementerRuntimeProvider";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import { EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationService";
import {
  EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION,
  copyExternalProjectAdosExecution,
  copyExternalProjectAdosExecutionResult,
  createExternalProjectAdosExecutionId,
  createExternalProjectAdosExecutionResultId,
  type ExternalProjectAdosExecution,
  type ExternalProjectAdosExecutionReasonCode,
  type ExternalProjectAdosExecutionResult,
  type ExternalProjectAdosExecutionStatus,
} from "./ExternalProjectAdosExecutionTypes";

const EXTERNAL_ADOS_EXECUTION_TIMEOUT_MS = 300000;
const STARTED_BY = "Local Human";

export type StartExternalProjectAdosExecutionInput = {
  projectId: string;
  project?: ProjectPortalProject;
  preparation?: ExternalProjectAdosRunPreparation;
  existingExecution?: ExternalProjectAdosExecution;
  now?: string;
};

export type StartExternalProjectAdosExecutionOutcome = {
  result: ExternalProjectAdosExecutionResult;
  execution?: ExternalProjectAdosExecution;
};

export class ExternalProjectAdosExecutionService {
  constructor(private readonly provider: ImplementerRuntimeProvider) {}

  async start(input: StartExternalProjectAdosExecutionInput): Promise<StartExternalProjectAdosExecutionOutcome> {
    const timestamp = input.now ?? new Date().toISOString();
    const preparationId = input.preparation?.id ?? "missing-preparation";
    const executionId = createExternalProjectAdosExecutionId(input.projectId || "unknown-project", preparationId);

    const blockedReason = validateInput(input);
    if (blockedReason) {
      return {
        result: createResult({
          projectId: input.projectId,
          preparationId: input.preparation?.id,
          status: "Blocked",
          reasonCodes: [blockedReason],
          resultAt: timestamp,
        }),
      };
    }

    const preparation = input.preparation!;
    if (input.existingExecution) {
      const result = createResult({
        projectId: input.projectId,
        preparationId: preparation.id,
        executionId: input.existingExecution.id,
        status: input.existingExecution.status,
        reasonCodes: ["EXTERNAL_ADOS_EXECUTION_ALREADY_COMPLETED"],
        resultAt: timestamp,
        started: input.existingExecution.implementerStarted,
        duplicateExistingExecution: true,
      });
      return {
        execution: copyExternalProjectAdosExecution(input.existingExecution),
        result,
      };
    }

    const providerCommand = createProviderCommand(input.project!, preparation);
    if (!isSafeImplementerCommand(providerCommand)) {
      return {
        result: createResult({
          projectId: input.projectId,
          preparationId: preparation.id,
          status: "Blocked",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_COMMAND_UNSAFE"],
          resultAt: timestamp,
        }),
      };
    }

    let providerResult;
    try {
      providerResult = await this.provider.invoke(providerCommand);
    } catch {
      return {
        result: createResult({
          projectId: input.projectId,
          preparationId: preparation.id,
          status: "Failed",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE"],
          resultAt: timestamp,
        }),
      };
    }

    const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
    if (!spawned) {
      return {
        result: createResult({
          projectId: input.projectId,
          preparationId: preparation.id,
          status: providerResult.status,
          reasonCodes: [statusReasonCode(providerResult.status)],
          resultAt: timestamp,
        }),
      };
    }

    const execution = createExecution({
      input,
      preparation,
      executionId,
      status: providerResult.status,
      evidence: providerResult.evidence,
      startedAt: timestamp,
    });
    return {
      execution,
      result: createResult({
        projectId: input.projectId,
        preparationId: preparation.id,
        executionId,
        status: execution.status,
        reasonCodes: [statusReasonCode(execution.status)],
        resultAt: timestamp,
        started: execution.implementerStarted,
      }),
    };
  }
}

function validateInput(input: StartExternalProjectAdosExecutionInput): ExternalProjectAdosExecutionReasonCode | undefined {
  if (!input.preparation || input.preparation.projectId !== input.projectId) {
    return "EXTERNAL_ADOS_EXECUTION_PREPARATION_MISSING";
  }
  if (input.preparation.status !== "Prepared") return "EXTERNAL_ADOS_EXECUTION_PREPARATION_STALE";
  if (!preparationMatchesTrustedPolicy(input.preparation)) return "EXTERNAL_ADOS_EXECUTION_PREPARATION_STALE";
  const binding = input.project?.localRepositoryBinding;
  if (!binding?.repositoryPath?.trim() || !binding.worktreePath?.trim()) {
    return "EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING";
  }
  if (hasPathTraversal(binding.repositoryPath) || hasPathTraversal(binding.worktreePath)) {
    return "EXTERNAL_ADOS_EXECUTION_TRUST_NOT_GRANTED";
  }
  return undefined;
}

function preparationMatchesTrustedPolicy(preparation: ExternalProjectAdosRunPreparation) {
  return (
    preparation.authoritativeBaseSha === EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.authoritativeBaseSha &&
    Boolean(preparation.featureId?.trim()) &&
    Boolean(preparation.featureBranch?.trim()) &&
    Boolean(preparation.specPath?.trim()) &&
    Boolean(preparation.requirementsFilePath?.trim()) &&
    Boolean(preparation.requirementsFileContent?.trim()) &&
    preparation.reviewerCommand === EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.reviewerCommand &&
    preparation.executionPolicyVersion === EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.executionPolicyVersion &&
    sameOrderedStrings(preparation.validationCommands, EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.validationCommands)
  );
}

function createProviderCommand(
  project: ProjectPortalProject,
  preparation: ExternalProjectAdosRunPreparation,
): ImplementerRuntimeProviderCommand {
  const binding = project.localRepositoryBinding!;
  return {
    command: DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.command,
    arguments: DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.arguments,
    inputMode: DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG.inputMode,
    workingDirectory: binding.worktreePath,
    prompt: createExternalAdosImplementerPrompt(project, preparation, binding.worktreePath),
    files: preparation.requirementsFilePath && preparation.requirementsFileContent
      ? [{
        relativePath: preparation.requirementsFilePath,
        content: preparation.requirementsFileContent,
      }]
      : undefined,
    timeoutMs: EXTERNAL_ADOS_EXECUTION_TIMEOUT_MS,
  };
}

function createExternalAdosImplementerPrompt(
  project: ProjectPortalProject,
  preparation: ExternalProjectAdosRunPreparation,
  worktreePath: string,
) {
  return [
    "ADOS Implementer Handoff",
    "",
    `Project: ${project.name}`,
    `Feature branch: ${preparation.featureBranch}`,
    `Authoritative base SHA: ${preparation.authoritativeBaseSha}`,
    `Spec: ${preparation.featureId}`,
    `Spec path: ${preparation.specPath}`,
    `Requirements file: ${preparation.requirementsFilePath}`,
    `Worktree: ${worktreePath}`,
    `Execution policy version: ${preparation.executionPolicyVersion}`,
    `Validation commands: ${preparation.validationCommands.join(", ")}`,
    `Reviewer: ${preparation.reviewerCommand}`,
    "",
    "Use the provided requirements file as the authoritative requirements source for this run.",
    "Do not replace the detailed requirements with only a short feature title.",
    "Do not rely on this prompt for the detailed request body; read the requirements file.",
    "",
    "Implement the prepared external project ADOS feature in this local worktree only.",
    "Do not run validation from this bridge.",
    "Do not start review.",
    "Do not publish, merge, deploy, push, create a PR, or mutate GitHub.",
  ].join("\n");
}

function createExecution(input: {
  input: StartExternalProjectAdosExecutionInput;
  preparation: ExternalProjectAdosRunPreparation;
  executionId: string;
  status: ExternalProjectAdosExecutionStatus;
  evidence: ExternalProjectAdosExecution["evidence"];
  startedAt: string;
}): ExternalProjectAdosExecution {
  const binding = input.input.project!.localRepositoryBinding!;
  const execution = {
    id: input.executionId,
    projectId: input.input.projectId,
    preparationId: input.preparation.id,
    developmentRequestDraftId: input.preparation.developmentRequestDraftId,
    status: input.status,
    featureId: input.preparation.featureId,
    featureBranch: input.preparation.featureBranch,
    authoritativeBaseSha: input.preparation.authoritativeBaseSha,
    specPath: input.preparation.specPath,
    requirementsFilePath: input.preparation.requirementsFilePath,
    repositoryPath: binding.repositoryPath,
    worktreePath: binding.worktreePath,
    validationCommands: [...input.preparation.validationCommands],
    reviewerCommand: input.preparation.reviewerCommand,
    executionPolicyVersion: input.preparation.executionPolicyVersion,
    trustedLocalExecutionApproved: true,
    startedBy: STARTED_BY,
    startedAt: input.startedAt,
    implementerStarted: input.evidence.started,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    evidence: input.evidence,
    rulesVersion: EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION,
  } satisfies ExternalProjectAdosExecution;
  return copyExternalProjectAdosExecution(execution);
}

function createResult(input: {
  projectId: string;
  preparationId?: string;
  executionId?: string;
  status: ExternalProjectAdosExecutionStatus;
  reasonCodes: ExternalProjectAdosExecutionReasonCode[];
  resultAt: string;
  started?: boolean;
  duplicateExistingExecution?: boolean;
}): ExternalProjectAdosExecutionResult {
  const preparationId = input.preparationId ?? "missing-preparation";
  const result = {
    id: createExternalProjectAdosExecutionResultId(input.projectId || "unknown-project", preparationId),
    projectId: input.projectId || "unknown-project",
    preparationId: input.preparationId,
    executionId: input.executionId,
    status: input.status,
    reasonCodes: input.reasonCodes,
    started: Boolean(input.started),
    duplicateExistingExecution: Boolean(input.duplicateExistingExecution),
    implementerStarted: Boolean(input.started),
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    resultAt: input.resultAt,
    rulesVersion: EXTERNAL_PROJECT_ADOS_EXECUTION_RULES_VERSION,
  } satisfies ExternalProjectAdosExecutionResult;
  return copyExternalProjectAdosExecutionResult(result);
}

function statusReasonCode(status: ExternalProjectAdosExecutionStatus): ExternalProjectAdosExecutionReasonCode {
  switch (status) {
    case "Completed":
      return "EXTERNAL_ADOS_EXECUTION_STARTED";
    case "TimedOut":
      return "EXTERNAL_ADOS_EXECUTION_TIMED_OUT";
    case "Cancelled":
      return "EXTERNAL_ADOS_EXECUTION_CANCELLED";
    case "Blocked":
      return "EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE";
    case "Failed":
    default:
      return "EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED";
  }
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function hasPathTraversal(value: string) {
  return /\.\.[\\/]/.test(value);
}
