import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import {
  RUNTIME_PREFLIGHT_RULES_VERSION,
  copyRuntimePreflight,
  copyRuntimePreflightEvidence,
  copyRuntimePreflightResult,
  createRuntimePreflightCheckId,
  createRuntimePreflightCollection,
  createRuntimePreflightId,
  createRuntimePreflightResultCollection,
  createRuntimePreflightResultId,
  type RuntimePreflight,
  type RuntimePreflightCheck,
  type RuntimePreflightCheckCategory,
  type RuntimePreflightEvidence,
  type RuntimePreflightInput,
  type RuntimePreflightOutcome,
  type RuntimePreflightReasonCode,
  type RuntimePreflightResult,
  type RuntimePreflightStatus,
} from "./RuntimePreflightTypes";

export class RuntimePreflightService {
  runPreflight(input: RuntimePreflightInput): RuntimePreflightOutcome {
    const { command } = input;
    const preflightId = createRuntimePreflightId(command.projectId || "unknown-project", command.executionPlanId || "unknown-plan");

    if (!command.projectId || !command.executionPlanId || !command.approvalId) {
      const preflight = createPreflightSnapshot({
        preflightId,
        projectId: command.projectId || "unknown-project",
        executionPlanId: command.executionPlanId || "unknown-plan",
        evaluatedAt: command.evaluatedAt,
        checks: [
          createCheck(preflightId, "Approval", "Failed", "MALFORMED_INPUT", "Runtime preflight command is malformed."),
        ],
      });
      const result = createResult(preflight, command.evaluatedAt);
      return { preflight, result };
    }

    const evidence = input.evidence ? copyRuntimePreflightEvidence(input.evidence) : undefined;
    const checks = [
      checkExecutionPlan(preflightId, input),
      checkReadiness(preflightId, input),
      checkApproval(preflightId, input),
      checkRepository(preflightId, input, evidence),
      checkWorktree(preflightId, input, evidence),
      checkBranch(preflightId, input, evidence),
      checkWorkingTree(preflightId, evidence),
      checkSpecification(preflightId, input, evidence),
      checkAgent(preflightId, "Implementer", input, evidence),
      checkAgent(preflightId, "Reviewer", input, evidence),
      checkValidationCommands(preflightId, input, evidence),
      checkMutationScope(preflightId, input, evidence),
      checkRuntimeEnvironment(preflightId, evidence),
      checkSafety(preflightId, input, evidence),
    ];
    const preflight = createPreflightSnapshot({
      preflightId,
      projectId: command.projectId,
      executionPlanId: command.executionPlanId,
      evaluatedAt: command.evaluatedAt,
      checks,
      readinessId: input.readiness?.readinessId,
      approvalId: input.approval?.approvalId,
      plan: input.executionPlan,
    });
    const result = createResult(preflight, command.evaluatedAt);
    return {
      preflight,
      result,
      preflightCollection: this.upsertPreflight(input.existingPreflights, preflight),
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }

  upsertPreflight(collection: RuntimePreflightInput["existingPreflights"], preflight: RuntimePreflight) {
    const existing = collection?.preflights ?? [];
    const nextPreflights = existing.some((item) => item.preflightId === preflight.preflightId)
      ? existing.map((item) => (item.preflightId === preflight.preflightId ? preflight : item))
      : [...existing, preflight];
    return createRuntimePreflightCollection({
      projectId: collection?.projectId ?? preflight.projectId,
      preflights: nextPreflights,
      generatedAt: preflight.evaluatedAt,
      rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    });
  }

  upsertResult(collection: RuntimePreflightInput["existingResults"], result: RuntimePreflightResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createRuntimePreflightResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.evaluatedAt,
      rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    });
  }
}

function createPreflightSnapshot(input: {
  preflightId: string;
  projectId: string;
  executionPlanId: string;
  evaluatedAt: string;
  checks: RuntimePreflightCheck[];
  readinessId?: string;
  approvalId?: string;
  plan?: RuntimePreflightInput["executionPlan"];
}): RuntimePreflight {
  const status = getStatus(input.checks);
  return copyRuntimePreflight({
    preflightId: input.preflightId,
    projectId: input.projectId,
    executionPlanId: input.executionPlanId,
    readinessId: input.readinessId,
    approvalId: input.approvalId,
    activeSessionId: input.plan?.activeSessionId,
    projectTaskId: input.plan?.projectTaskId,
    confirmedAssignmentId: input.plan?.confirmedAssignmentId,
    preparedSessionId: input.plan?.preparedSessionId,
    employeeId: input.plan?.employeeId,
    repositoryId: input.plan?.repositoryId,
    status,
    checks: input.checks,
    evaluatedAt: input.evaluatedAt,
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    executionApproved: Boolean(input.approvalId),
    runtimePreflightPassed: status === "Ready",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function createResult(preflight: RuntimePreflight, evaluatedAt: string): RuntimePreflightResult {
  const blocked = preflight.checks.filter((check) => check.status === "Blocked");
  const failed = preflight.checks.filter((check) => check.status === "Failed");
  const passed = preflight.checks.filter((check) => check.status === "Passed");
  const primaryReason = failed[0]?.reason ?? blocked[0]?.reason ?? "READY";
  const reasonCodes = preflight.status === "Ready"
    ? ["READY" as const]
    : Array.from(new Set([...failed, ...blocked].map((check) => check.reason)));
  return copyRuntimePreflightResult({
    id: createRuntimePreflightResultId(preflight.projectId, preflight.executionPlanId),
    projectId: preflight.projectId,
    executionPlanId: preflight.executionPlanId,
    preflightId: preflight.preflightId,
    approvalId: preflight.approvalId,
    readinessId: preflight.readinessId,
    status: preflight.status,
    reasonCodes,
    primaryReason,
    passedCheckCount: passed.length,
    blockedCheckCount: blocked.length,
    failedCheckCount: failed.length,
    runtimePreflightPassed: preflight.status === "Ready",
    executionApproved: preflight.executionApproved,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt,
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
  });
}

function checkExecutionPlan(preflightId: string, input: RuntimePreflightInput) {
  const plan = input.executionPlan;
  if (!plan) return createCheck(preflightId, "Approval", "Blocked", "EXECUTION_PLAN_MISSING", "Execution Plan is missing.");
  if (plan.projectId !== input.command.projectId || plan.planId !== input.command.executionPlanId) {
    return createCheck(preflightId, "Approval", "Blocked", "EXECUTION_PLAN_STALE", "Execution Plan no longer matches the selected project.");
  }
  if (plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) || plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION) {
    return createCheck(preflightId, "Approval", "Blocked", "EXECUTION_PLAN_STALE", "Execution Plan identity or rules version is stale.");
  }
  if (plan.executionStarted || plan.runtimeStarted || plan.subprocessStarted || plan.repositoryMutationStarted || plan.githubMutationStarted) {
    return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_ALREADY_STARTED", "Execution Plan indicates runtime or mutation already started.");
  }
  return createCheck(preflightId, "Approval", "Passed", "READY", "Execution Plan was revalidated before preflight.");
}

function checkReadiness(preflightId: string, input: RuntimePreflightInput) {
  const readiness = input.readiness;
  const result = input.readinessResult;
  const plan = input.executionPlan;
  if (!readiness || !result) return createCheck(preflightId, "Approval", "Blocked", "READINESS_MISSING", "Current readiness is missing.");
  if (!plan || readiness.projectId !== plan.projectId || result.projectId !== plan.projectId) {
    return createCheck(preflightId, "Approval", "Blocked", "PROJECT_MISMATCH", "Readiness belongs to another project.");
  }
  if (readiness.executionPlanId !== plan.planId || result.executionPlanId !== plan.planId || result.readinessId !== readiness.readinessId) {
    return createCheck(preflightId, "Approval", "Blocked", "READINESS_NOT_READY", "Readiness does not match the current Execution Plan.");
  }
  if (
    readiness.status !== "Ready" ||
    result.status !== "Ready" ||
    result.blockedCheckCount > 0 ||
    result.failedCheckCount > 0
  ) return createCheck(preflightId, "Approval", "Blocked", "READINESS_NOT_READY", "Current readiness is not Ready.");
  if (
    readiness.executionStarted ||
    readiness.agentStarted ||
    readiness.repositoryMutationStarted ||
    readiness.githubMutationStarted ||
    result.executionStarted ||
    result.agentStarted ||
    result.repositoryMutationStarted ||
    result.githubMutationStarted
  ) return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_ALREADY_STARTED", "Readiness indicates runtime or mutation already started.");
  return createCheck(preflightId, "Approval", "Passed", "READY", "Current readiness is Ready without execution.");
}

function checkApproval(preflightId: string, input: RuntimePreflightInput) {
  const plan = input.executionPlan;
  const readiness = input.readiness;
  const approval = input.approval;
  if (!approval) return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_MISSING", "Human Execution Approval is missing.");
  if (!plan || approval.executionPlanId !== plan.planId || approval.approvalId !== input.command.approvalId) {
    return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_PLAN_MISMATCH", "Human Execution Approval does not match the current Execution Plan.");
  }
  if (
    approval.projectId !== plan.projectId ||
    approval.readinessId !== readiness?.readinessId ||
    approval.activeSessionId !== plan.activeSessionId ||
    approval.projectTaskId !== plan.projectTaskId ||
    approval.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    approval.preparedSessionId !== plan.preparedSessionId ||
    approval.employeeId !== plan.employeeId ||
    approval.repositoryId !== plan.repositoryId
  ) return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_STALE", "Human Execution Approval no longer matches the current execution context.");
  if (
    approval.implementerAgent !== plan.implementerAgent ||
    approval.reviewerAgent !== plan.reviewerAgent ||
    !sameOrderedStrings(approval.validationCommands, plan.validationCommands) ||
    !sameOrderedStrings(approval.allowedMutationScope, plan.allowedMutationScope)
  ) return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_ROLE_CONTEXT_MISMATCH", "Approval role, command, or mutation context is stale.");
  if (!approval.executionApproved || getActorBlockReason(approval.approvedBy)) {
    return createCheck(preflightId, "Approval", "Blocked", getActorBlockReason(approval.approvedBy) ?? "APPROVAL_STALE", "Approval actor is not an allowed human.");
  }
  if (approval.executionStarted || approval.agentStarted || approval.repositoryMutationStarted || approval.githubMutationStarted) {
    return createCheck(preflightId, "Approval", "Blocked", "APPROVAL_ALREADY_STARTED", "Approval indicates runtime or mutation already started.");
  }
  return createCheck(preflightId, "Approval", "Passed", "READY", "Human approval is current and does not start execution.");
}

function checkRepository(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const repository = evidence?.repository;
  if (!plan || !repository) return createCheck(preflightId, "Repository", "Failed", "RUNTIME_PROVIDER_FAILED", "Repository runtime evidence is unavailable.");
  if (!repository.pathExists) return createCheck(preflightId, "Repository", "Blocked", "REPOSITORY_PATH_MISSING", "Repository path is missing.");
  if (!repository.isDirectory) return createCheck(preflightId, "Repository", "Blocked", "REPOSITORY_NOT_DIRECTORY", "Repository path is not a directory.");
  if (!repository.isGitRepository) return createCheck(preflightId, "Repository", "Blocked", "REPOSITORY_NOT_GIT", "Repository path is not a Git repository.");
  if (repository.projectId && repository.projectId !== plan.projectId) {
    return createCheck(preflightId, "Repository", "Blocked", "FOREIGN_PROJECT_REPOSITORY", "Repository evidence belongs to another project.");
  }
  if (repository.repositoryId !== plan.repositoryId || repository.normalizedPath !== plan.repositoryPath) {
    return createCheck(preflightId, "Repository", "Blocked", "REPOSITORY_IDENTITY_MISMATCH", "Repository identity does not match the plan.");
  }
  return createCheck(preflightId, "Repository", "Passed", "READY", "Repository identity matches the approved plan.");
}

function checkWorktree(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const worktree = evidence?.worktree;
  if (!plan || !worktree) return createCheck(preflightId, "Worktree", "Failed", "RUNTIME_PROVIDER_FAILED", "Worktree runtime evidence is unavailable.");
  if (!worktree.pathExists) return createCheck(preflightId, "Worktree", "Blocked", "WORKTREE_PATH_MISSING", "Worktree path is missing.");
  if (!worktree.isDirectory) return createCheck(preflightId, "Worktree", "Blocked", "WORKTREE_NOT_DIRECTORY", "Worktree path is not a directory.");
  if (!worktree.isGitWorktree) return createCheck(preflightId, "Worktree", "Blocked", "WORKTREE_NOT_GIT", "Worktree path is not a Git worktree.");
  if (worktree.normalizedPath !== plan.worktreePath) {
    return createCheck(preflightId, "Worktree", "Blocked", "WORKTREE_MISMATCH", "Worktree path does not match the plan.");
  }
  if (worktree.isPrimaryWorktree) {
    return createCheck(preflightId, "Worktree", "Blocked", "PRIMARY_WORKTREE_NOT_ALLOWED", "Primary worktree is not allowed for runtime start.");
  }
  return createCheck(preflightId, "Worktree", "Passed", "READY", "Dedicated worktree evidence matches the plan.");
}

function checkBranch(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const branch = evidence?.branch;
  if (!plan || !branch) return createCheck(preflightId, "Branch", "Failed", "RUNTIME_PROVIDER_FAILED", "Branch runtime evidence is unavailable.");
  if (branch.detached) return createCheck(preflightId, "Branch", "Blocked", "BRANCH_DETACHED", "Runtime worktree is detached.");
  if (branch.currentBranch !== plan.branchName) {
    return createCheck(preflightId, "Branch", "Blocked", "BRANCH_MISMATCH", "Current branch does not match the approved plan.");
  }
  if (branch.currentBranch === "main") {
    return createCheck(preflightId, "Branch", "Blocked", "PRIMARY_BRANCH_NOT_ALLOWED", "Main branch is not allowed for runtime start.");
  }
  return createCheck(preflightId, "Branch", "Passed", "READY", "Current branch matches the approved feature branch.");
}

function checkWorkingTree(preflightId: string, evidence: RuntimePreflightEvidence | undefined) {
  const tree = evidence?.workingTree;
  if (!tree) return createCheck(preflightId, "WorkingTree", "Failed", "RUNTIME_PROVIDER_FAILED", "Working tree evidence is unavailable.");
  if (tree.mergeState) return createCheck(preflightId, "WorkingTree", "Blocked", "MERGE_STATE_DETECTED", "Merge state is present.");
  if (tree.rebaseState) return createCheck(preflightId, "WorkingTree", "Blocked", "REBASE_STATE_DETECTED", "Rebase state is present.");
  if (tree.conflicts) return createCheck(preflightId, "WorkingTree", "Blocked", "CONFLICTS_DETECTED", "Unresolved conflicts are present.");
  if (!tree.clean || tree.stagedChanges || tree.unstagedChanges || tree.untrackedFiles) {
    return createCheck(preflightId, "WorkingTree", "Blocked", "WORKING_TREE_DIRTY", "Working tree is not clean.");
  }
  return createCheck(preflightId, "WorkingTree", "Passed", "READY", "Working tree is clean before runtime start.");
}

function checkSpecification(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const spec = evidence?.specification;
  if (!plan || !spec) return createCheck(preflightId, "Specification", "Failed", "RUNTIME_PROVIDER_FAILED", "Specification evidence is unavailable.");
  if (!spec.normalizedPath || !spec.pathExists) {
    return createCheck(preflightId, "Specification", "Blocked", "SPEC_PATH_MISSING", "Specification path is missing.");
  }
  if (!spec.insideWorktree || spec.normalizedPath.includes("..")) {
    return createCheck(preflightId, "Specification", "Blocked", "SPEC_PATH_OUTSIDE_REPOSITORY", "Specification path escapes the worktree.");
  }
  if (spec.normalizedPath !== plan.specPath || !spec.featureMatches) {
    return createCheck(preflightId, "Specification", "Blocked", "SPEC_FEATURE_MISMATCH", "Specification path does not match the approved feature.");
  }
  if (!spec.requiredArtifactsPresent) {
    return createCheck(preflightId, "Specification", "Blocked", "SPEC_ARTIFACT_MISSING", "Required Spec Kit artifacts are missing.");
  }
  return createCheck(preflightId, "Specification", "Passed", "READY", "Specification evidence matches the approved plan.");
}

function checkAgent(
  preflightId: string,
  role: "Implementer" | "Reviewer",
  input: RuntimePreflightInput,
  evidence: RuntimePreflightEvidence | undefined,
) {
  const plan = input.executionPlan;
  const agent = role === "Implementer" ? evidence?.implementer : evidence?.reviewer;
  const category = role;
  if (!plan || !agent) return createCheck(preflightId, category, "Failed", "RUNTIME_PROVIDER_FAILED", `${role} runtime evidence is unavailable.`);
  const expectedLabel = role === "Implementer" ? plan.implementerAgent : plan.reviewerAgent;
  if (agent.agentLabel !== expectedLabel) {
    return createCheck(preflightId, category, "Blocked", "APPROVAL_ROLE_CONTEXT_MISMATCH", `${role} mapping changed after approval.`);
  }
  if (!agent.commandSafe) return createCheck(preflightId, category, "Blocked", "UNSAFE_AGENT_COMMAND", `${role} command is unsafe.`);
  if (agent.detectionTimedOut) return createCheck(preflightId, category, "Blocked", "AGENT_DETECTION_TIMEOUT", `${role} detection timed out.`);
  if (!agent.available) {
    return createCheck(preflightId, category, "Blocked", role === "Implementer" ? "IMPLEMENTER_UNAVAILABLE" : "REVIEWER_UNAVAILABLE", `${role} is unavailable.`);
  }
  if (typeof agent.detectionExitCode === "number" && agent.detectionExitCode !== 0) {
    return createCheck(preflightId, category, "Blocked", "AGENT_DETECTION_FAILED", `${role} detection failed.`);
  }
  return createCheck(preflightId, category, "Passed", "READY", `${role} is available and command-safe.`);
}

function checkValidationCommands(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const commands = evidence?.validationCommands.commands ?? [];
  if (!plan || !evidence) return createCheck(preflightId, "ValidationCommands", "Failed", "RUNTIME_PROVIDER_FAILED", "Validation command evidence is unavailable.");
  if (commands.length === 0 || commands.some((command) => command.trim().length === 0)) {
    return createCheck(preflightId, "ValidationCommands", "Blocked", "VALIDATION_COMMANDS_MISSING", "Validation commands are missing.");
  }
  if (!sameOrderedStrings(commands, plan.validationCommands)) {
    return createCheck(preflightId, "ValidationCommands", "Blocked", "VALIDATION_COMMANDS_CHANGED", "Validation commands changed after approval.");
  }
  if (!evidence.validationCommands.commandsSafe || commands.some(isUnsafeCommandLine)) {
    return createCheck(preflightId, "ValidationCommands", "Blocked", "UNSAFE_VALIDATION_COMMAND", "Validation command contract is unsafe.");
  }
  return createCheck(preflightId, "ValidationCommands", "Passed", "READY", "Validation command contract matches and was not executed.");
}

function checkMutationScope(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  const scope = evidence?.mutationScope.scope ?? [];
  if (!plan || !evidence) return createCheck(preflightId, "MutationScope", "Failed", "RUNTIME_PROVIDER_FAILED", "Mutation scope evidence is unavailable.");
  if (scope.length === 0 || scope.some((entry) => entry.trim().length === 0)) {
    return createCheck(preflightId, "MutationScope", "Blocked", "MUTATION_SCOPE_MISSING", "Mutation scope is missing.");
  }
  if (!sameOrderedStrings(scope, plan.allowedMutationScope)) {
    return createCheck(preflightId, "MutationScope", "Blocked", "MUTATION_SCOPE_CHANGED", "Mutation scope changed after approval.");
  }
  if (!evidence.mutationScope.scopeSafe || scope.some(isUnsafeMutationScope)) {
    return createCheck(preflightId, "MutationScope", "Blocked", "UNSAFE_MUTATION_SCOPE", "Mutation scope is unsafe.");
  }
  return createCheck(preflightId, "MutationScope", "Passed", "READY", "Mutation scope remains bounded and non-remote.");
}

function checkRuntimeEnvironment(preflightId: string, evidence: RuntimePreflightEvidence | undefined) {
  const runtime = evidence?.runtimeEnvironment;
  if (!runtime) return createCheck(preflightId, "RuntimeEnvironment", "Failed", "RUNTIME_PROVIDER_FAILED", "Runtime environment evidence is unavailable.");
  if (runtime.providerFailed) return createCheck(preflightId, "RuntimeEnvironment", "Failed", "RUNTIME_PROVIDER_FAILED", "Runtime provider could not complete preflight.");
  if (!runtime.supported || !runtime.spawnAvailable || !runtime.safeWorkingDirectory) {
    return createCheck(preflightId, "RuntimeEnvironment", "Blocked", "RUNTIME_ENVIRONMENT_UNSUPPORTED", "Runtime environment is not supported.");
  }
  return createCheck(preflightId, "RuntimeEnvironment", "Passed", "READY", "Runtime environment evidence is compatible.");
}

function checkSafety(preflightId: string, input: RuntimePreflightInput, evidence: RuntimePreflightEvidence | undefined) {
  const plan = input.executionPlan;
  if (!plan || !evidence) return createCheck(preflightId, "Safety", "Failed", "RUNTIME_PROVIDER_FAILED", "Safety evidence is unavailable.");
  const configuredAgentCommands = [
    joinCommand(evidence.implementer.configuredCommand, evidence.implementer.configuredArguments),
    joinCommand(evidence.reviewer.configuredCommand, evidence.reviewer.configuredArguments),
  ].filter(Boolean);
  if (
    configuredAgentCommands.some(isUnsafeCommandLine) ||
    evidence.validationCommands.commands.some(isUnsafeCommandLine) ||
    evidence.mutationScope.scope.some(isUnsafeMutationScope)
  ) return createCheck(preflightId, "Safety", "Blocked", "UNSAFE_AGENT_COMMAND", "A configured command or scope is unsafe.");
  return createCheck(preflightId, "Safety", "Passed", "READY", "No execution, validation command, repository mutation, or GitHub mutation was started.");
}

function getStatus(checks: ReadonlyArray<RuntimePreflightCheck>): RuntimePreflightStatus {
  if (checks.some((check) => check.status === "Failed")) return "Failed";
  if (checks.some((check) => check.status === "Blocked")) return "Blocked";
  return "Ready";
}

function createCheck(
  preflightId: string,
  category: RuntimePreflightCheckCategory,
  status: RuntimePreflightCheck["status"],
  reason: RuntimePreflightReasonCode,
  message: string,
  expected?: string,
  actual?: string,
): RuntimePreflightCheck {
  return {
    checkId: createRuntimePreflightCheckId(preflightId, category, `${reason}:${message}`),
    category,
    status,
    reason,
    message,
    expected,
    actual,
  };
}

function getActorBlockReason(actor: string | undefined): RuntimePreflightReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation)/.test(normalized)) return "APPROVER_NOT_HUMAN";
  return undefined;
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function joinCommand(command: string | undefined, args: ReadonlyArray<string> | undefined) {
  return [command, ...(args ?? [])].filter(Boolean).join(" ");
}

function isUnsafeCommandLine(command: string) {
  const normalized = command.trim().toLowerCase();
  if (!normalized) return true;
  if (/(^|\s)(git\s+push|git\s+commit|git\s+checkout|git\s+switch|git\s+reset|git\s+clean|git\s+merge|git\s+rebase|git\s+cherry-pick)(\s|$)/.test(normalized)) {
    return true;
  }
  if (/(^|\s)(gh\s+pr\s+(create|merge|ready)|gh\s+issue\s+edit|gh\s+repo\s+edit)(\s|$)/.test(normalized)) {
    return true;
  }
  if (/(rm\s+-rf|del\s+\/s|format\s|shutdown|invoke-webrequest|curl\s+.*github|powershell\s+.*git\s+push)/.test(normalized)) {
    return true;
  }
  return false;
}

function isUnsafeMutationScope(entry: string) {
  const normalized = entry.toLowerCase();
  if (normalized.startsWith("no-")) return false;
  return /(github|remote|push|runtime|subprocess|execution|codex|claude|primary-worktree)/.test(normalized);
}
