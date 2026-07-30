import type { ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import type { ExecutionReadiness, ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import type { HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";

export const RUNTIME_PREFLIGHT_RULES_VERSION = "preflight-v1";

export type RuntimePreflightStatus = "Ready" | "Blocked" | "Failed";

export type RuntimePreflightCheckStatus = "Passed" | "Blocked" | "Failed";

export type RuntimePreflightCheckCategory =
  | "Approval"
  | "Repository"
  | "Worktree"
  | "Branch"
  | "WorkingTree"
  | "Specification"
  | "Implementer"
  | "Reviewer"
  | "ValidationCommands"
  | "MutationScope"
  | "RuntimeEnvironment"
  | "Safety";

export type RuntimePreflightReasonCode =
  | "READY"
  | "MALFORMED_INPUT"
  | "EXECUTION_PLAN_MISSING"
  | "EXECUTION_PLAN_STALE"
  | "READINESS_MISSING"
  | "READINESS_NOT_READY"
  | "APPROVAL_MISSING"
  | "APPROVAL_STALE"
  | "APPROVAL_PLAN_MISMATCH"
  | "APPROVAL_ROLE_CONTEXT_MISMATCH"
  | "APPROVER_NOT_HUMAN"
  | "APPROVAL_ALREADY_STARTED"
  | "REPOSITORY_PATH_MISSING"
  | "REPOSITORY_NOT_DIRECTORY"
  | "REPOSITORY_NOT_GIT"
  | "REPOSITORY_IDENTITY_MISMATCH"
  | "FOREIGN_PROJECT_REPOSITORY"
  | "WORKTREE_PATH_MISSING"
  | "WORKTREE_MISMATCH"
  | "WORKTREE_NOT_DIRECTORY"
  | "WORKTREE_NOT_GIT"
  | "PRIMARY_WORKTREE_NOT_ALLOWED"
  | "BRANCH_DETACHED"
  | "BRANCH_MISMATCH"
  | "PRIMARY_BRANCH_NOT_ALLOWED"
  | "WORKING_TREE_DIRTY"
  | "MERGE_STATE_DETECTED"
  | "REBASE_STATE_DETECTED"
  | "CONFLICTS_DETECTED"
  | "SPEC_PATH_MISSING"
  | "SPEC_PATH_OUTSIDE_REPOSITORY"
  | "SPEC_FEATURE_MISMATCH"
  | "SPEC_ARTIFACT_MISSING"
  | "IMPLEMENTER_UNAVAILABLE"
  | "REVIEWER_UNAVAILABLE"
  | "AGENT_DETECTION_TIMEOUT"
  | "AGENT_DETECTION_FAILED"
  | "UNSAFE_AGENT_COMMAND"
  | "VALIDATION_COMMANDS_CHANGED"
  | "VALIDATION_COMMANDS_MISSING"
  | "UNSAFE_VALIDATION_COMMAND"
  | "MUTATION_SCOPE_CHANGED"
  | "MUTATION_SCOPE_MISSING"
  | "UNSAFE_MUTATION_SCOPE"
  | "RUNTIME_ENVIRONMENT_UNSUPPORTED"
  | "RUNTIME_PROVIDER_FAILED"
  | "PROJECT_MISMATCH";

export type RuntimePreflightCheck = {
  checkId: string;
  category: RuntimePreflightCheckCategory;
  status: RuntimePreflightCheckStatus;
  reason: RuntimePreflightReasonCode;
  message: string;
  expected?: string;
  actual?: string;
};

export type RuntimePreflight = {
  preflightId: string;
  projectId: string;
  executionPlanId: string;
  readinessId?: string;
  approvalId?: string;
  activeSessionId?: string;
  projectTaskId?: string;
  confirmedAssignmentId?: string;
  preparedSessionId?: string;
  employeeId?: string;
  repositoryId?: string;
  status: RuntimePreflightStatus;
  checks: RuntimePreflightCheck[];
  evaluatedAt: string;
  rulesVersion: string;
  executionApproved: boolean;
  runtimePreflightPassed: boolean;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type RuntimePreflightResult = {
  id: string;
  projectId: string;
  executionPlanId: string;
  preflightId: string;
  approvalId?: string;
  readinessId?: string;
  status: RuntimePreflightStatus;
  reasonCodes: RuntimePreflightReasonCode[];
  primaryReason?: RuntimePreflightReasonCode;
  passedCheckCount: number;
  blockedCheckCount: number;
  failedCheckCount: number;
  runtimePreflightPassed: boolean;
  executionApproved: boolean;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  evaluatedAt: string;
  rulesVersion: string;
};

export type RuntimePreflightCollection = {
  projectId: string;
  preflights: RuntimePreflight[];
  preflightCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type RuntimePreflightResultCollection = {
  projectId: string;
  results: RuntimePreflightResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type RuntimePreflightCommand = {
  projectId: string;
  executionPlanId: string;
  approvalId: string;
  evaluatedAt: string;
};

export type RuntimePreflightAgentEvidence = {
  role: "Implementer" | "Reviewer";
  agentLabel?: string;
  configuredCommand?: string;
  configuredArguments?: string[];
  available: boolean;
  detectionTimedOut?: boolean;
  detectionExitCode?: number;
  outputTruncated?: boolean;
  commandSafe: boolean;
};

export type RuntimePreflightEvidence = {
  repository: {
    projectId?: string;
    repositoryId?: string;
    pathExists: boolean;
    isDirectory: boolean;
    isGitRepository: boolean;
    normalizedPath?: string;
  };
  worktree: {
    pathExists: boolean;
    isDirectory: boolean;
    isGitWorktree: boolean;
    normalizedPath?: string;
    isPrimaryWorktree: boolean;
  };
  branch: {
    currentBranch?: string;
    detached: boolean;
  };
  workingTree: {
    clean: boolean;
    stagedChanges: boolean;
    unstagedChanges: boolean;
    untrackedFiles: boolean;
    mergeState: boolean;
    rebaseState: boolean;
    conflicts: boolean;
  };
  specification: {
    pathExists: boolean;
    normalizedPath?: string;
    insideWorktree: boolean;
    featureMatches: boolean;
    requiredArtifactsPresent: boolean;
  };
  implementer: RuntimePreflightAgentEvidence;
  reviewer: RuntimePreflightAgentEvidence;
  validationCommands: {
    commands: string[];
    commandsSafe: boolean;
  };
  mutationScope: {
    scope: string[];
    scopeSafe: boolean;
  };
  runtimeEnvironment: {
    supported: boolean;
    spawnAvailable: boolean;
    safeWorkingDirectory: boolean;
    providerFailed?: boolean;
  };
};

export type RuntimePreflightInput = {
  command: RuntimePreflightCommand;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  evidence?: RuntimePreflightEvidence;
  existingPreflights?: RuntimePreflightCollection;
  existingResults?: RuntimePreflightResultCollection;
};

export type RuntimePreflightOutcome = {
  preflight: RuntimePreflight;
  result: RuntimePreflightResult;
  preflightCollection?: RuntimePreflightCollection;
  resultCollection?: RuntimePreflightResultCollection;
};

export type RuntimePreflightProviderRequest = {
  projectId: string;
  executionPlan: ExecutionPlan;
  approvedCommands: ReadonlyArray<string>;
  approvedMutationScope: ReadonlyArray<string>;
};

export interface RuntimeEnvironmentProvider {
  inspect(request: RuntimePreflightProviderRequest): RuntimePreflightEvidence;
}

export function createRuntimePreflightId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = RUNTIME_PREFLIGHT_RULES_VERSION,
) {
  return `${projectId}:runtime-preflight:${executionPlanId}:${rulesVersion}`;
}

export function createRuntimePreflightResultId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = RUNTIME_PREFLIGHT_RULES_VERSION,
) {
  return `${projectId}:runtime-preflight-result:${executionPlanId}:${rulesVersion}`;
}

export function createRuntimePreflightCheckId(
  preflightId: string,
  category: RuntimePreflightCheckCategory,
  discriminator: string = category,
) {
  return `${preflightId}:check:${category}:${discriminator}`;
}

export function createRuntimePreflightCollection(input: Omit<RuntimePreflightCollection, "preflights" | "preflightCount"> & {
  preflights: ReadonlyArray<RuntimePreflight>;
}): RuntimePreflightCollection {
  const preflights = input.preflights.map(copyRuntimePreflight);
  return {
    ...input,
    preflights,
    preflightCount: preflights.length,
  };
}

export function createRuntimePreflightResultCollection(input: Omit<
  RuntimePreflightResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<RuntimePreflightResult>;
}): RuntimePreflightResultCollection {
  const results = input.results.map(copyRuntimePreflightResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyRuntimePreflight(preflight: RuntimePreflight): RuntimePreflight {
  return {
    ...preflight,
    checks: preflight.checks.map(copyRuntimePreflightCheck),
  };
}

export function copyRuntimePreflightCheck(check: RuntimePreflightCheck): RuntimePreflightCheck {
  return { ...check };
}

export function copyRuntimePreflightResult(result: RuntimePreflightResult): RuntimePreflightResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}

export function copyRuntimePreflightEvidence(evidence: RuntimePreflightEvidence): RuntimePreflightEvidence {
  return {
    repository: { ...evidence.repository },
    worktree: { ...evidence.worktree },
    branch: { ...evidence.branch },
    workingTree: { ...evidence.workingTree },
    specification: { ...evidence.specification },
    implementer: {
      ...evidence.implementer,
      configuredArguments: evidence.implementer.configuredArguments
        ? [...evidence.implementer.configuredArguments]
        : undefined,
    },
    reviewer: {
      ...evidence.reviewer,
      configuredArguments: evidence.reviewer.configuredArguments
        ? [...evidence.reviewer.configuredArguments]
        : undefined,
    },
    validationCommands: { commands: [...evidence.validationCommands.commands], commandsSafe: evidence.validationCommands.commandsSafe },
    mutationScope: { scope: [...evidence.mutationScope.scope], scopeSafe: evidence.mutationScope.scopeSafe },
    runtimeEnvironment: { ...evidence.runtimeEnvironment },
  };
}
