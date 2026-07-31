import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import { RUNTIME_PREFLIGHT_RULES_VERSION, createRuntimePreflightId } from "../runtime-preflight/RuntimePreflightTypes";
import { RUNTIME_START_RULES_VERSION, createRuntimeStartId } from "../runtime-start/RuntimeStartTypes";
import { createImplementerPrompt } from "./ImplementerPrompt";
import type { ImplementerRuntimeProvider, ImplementerRuntimeProviderCommand } from "./ImplementerRuntimeProvider";
import {
  IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
  IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT,
  IMPLEMENTER_RUNTIME_RULES_VERSION,
  copyImplementerRuntime,
  copyImplementerRuntimeResult,
  createImplementerRuntimeCollection,
  createImplementerRuntimeId,
  createImplementerRuntimeResultCollection,
  createImplementerRuntimeResultId,
  type ImplementerRuntime,
  type ImplementerRuntimeInput,
  type ImplementerRuntimeOutcome,
  type ImplementerRuntimeReasonCode,
  type ImplementerRuntimeResult,
} from "./ImplementerRuntimeTypes";

export type ImplementerRuntimeCommandConfig = {
  command: string;
  arguments: ReadonlyArray<string>;
  inputMode: "argument" | "stdin";
  timeoutMs: number;
};

export const DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG: ImplementerRuntimeCommandConfig = {
  command: "claude",
  arguments: ["--dangerously-skip-permissions", "-p", "{{prompt}}"],
  inputMode: "argument",
  timeoutMs: 300000,
};

export class ImplementerRuntimeService {
  constructor(
    private readonly provider: ImplementerRuntimeProvider,
    private readonly commandConfig: ImplementerRuntimeCommandConfig = DEFAULT_IMPLEMENTER_RUNTIME_COMMAND_CONFIG,
  ) {}

  async startImplementer(input: ImplementerRuntimeInput): Promise<ImplementerRuntimeOutcome> {
    const { command } = input;
    const implementerRuntimeId = createImplementerRuntimeId(
      command.projectId || "unknown-project",
      command.runtimeStartId || "unknown-runtime-start",
    );

    const malformedReason = validateCommand(command);
    if (malformedReason) {
      return this.createBlockedOutcome(input, implementerRuntimeId, malformedReason, "Failed");
    }

    const contextReason = validateContext(input);
    if (contextReason) {
      return this.createBlockedOutcome(input, implementerRuntimeId, contextReason);
    }

    const roleReason = validateRoleBinding(input);
    if (roleReason) {
      return this.createBlockedOutcome(input, implementerRuntimeId, roleReason);
    }

    const existingRuntime = input.existingRuntimes?.runtimes.find(
      (runtime) => runtime.implementerRuntimeId === implementerRuntimeId,
    );
    if (existingRuntime) {
      const result = createResult({
        input,
        implementerRuntimeId,
        status: existingRuntime.status,
        reasonCodes: ["IMPLEMENTER_RUNTIME_ALREADY_COMPLETED"],
        runtime: existingRuntime,
      });
      return {
        result,
        runtime: copyImplementerRuntime(existingRuntime),
        runtimeCollection: this.upsertRuntime(input.existingRuntimes, existingRuntime),
        resultCollection: this.upsertResult(input.existingResults, result),
      };
    }

    if (!isSafeConfiguredCommand(this.commandConfig)) {
      return this.createBlockedOutcome(input, implementerRuntimeId, "IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
    }

    const plan = input.executionPlan!;
    const runtimeStart = input.runtimeStart!;
    const prompt = createImplementerPrompt({
      projectId: plan.projectId,
      runtimeStartId: runtimeStart.runtimeStartId,
      featureId: plan.featureId,
      specificationPath: plan.specPath,
      taskId: plan.projectTaskId,
      worktreePath: plan.worktreePath,
      branch: plan.branchName,
      implementerRoleLabel: plan.implementerAgent,
      reviewerRoleLabel: plan.reviewerAgent,
      approvedImplementerAgent: IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT,
      approvedReviewerAgent: IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT,
      validationCommands: plan.validationCommands,
      mutationScope: plan.allowedMutationScope,
    });

    const providerCommand: ImplementerRuntimeProviderCommand = {
      command: this.commandConfig.command,
      arguments: this.commandConfig.arguments,
      inputMode: this.commandConfig.inputMode,
      workingDirectory: plan.worktreePath,
      prompt: prompt.text,
      timeoutMs: this.commandConfig.timeoutMs,
    };

    let providerResult;
    try {
      providerResult = await this.provider.invoke(providerCommand);
    } catch {
      return this.createBlockedOutcome(input, implementerRuntimeId, "IMPLEMENTER_RUNTIME_INTERNAL_FAILURE", "Failed");
    }

    const runtime = createRuntime(input, implementerRuntimeId, prompt.promptId, providerResult);
    const result = createResult({
      input,
      implementerRuntimeId,
      status: runtime.status,
      reasonCodes: [statusReasonCode(runtime.status)],
      runtime,
    });

    return {
      result,
      runtime,
      runtimeCollection: this.upsertRuntime(input.existingRuntimes, runtime),
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }

  upsertRuntime(collection: ImplementerRuntimeInput["existingRuntimes"], runtime: ImplementerRuntime) {
    const existing = collection?.runtimes ?? [];
    const nextRuntimes = existing.some((item) => item.implementerRuntimeId === runtime.implementerRuntimeId)
      ? existing.map((item) => (item.implementerRuntimeId === runtime.implementerRuntimeId ? runtime : item))
      : [...existing, runtime];
    return createImplementerRuntimeCollection({
      projectId: collection?.projectId ?? runtime.projectId,
      runtimes: nextRuntimes,
      generatedAt: runtime.startedAt,
      rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    });
  }

  upsertResult(collection: ImplementerRuntimeInput["existingResults"], result: ImplementerRuntimeResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createImplementerRuntimeResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    });
  }

  private createBlockedOutcome(
    input: ImplementerRuntimeInput,
    implementerRuntimeId: string,
    reason: ImplementerRuntimeReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): ImplementerRuntimeOutcome {
    const result = createResult({
      input,
      implementerRuntimeId,
      status,
      reasonCodes: [reason],
    });
    return {
      result,
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }
}

function validateCommand(command: ImplementerRuntimeInput["command"]): ImplementerRuntimeReasonCode | undefined {
  if (
    !command.projectId ||
    !command.runtimeStartId ||
    !command.executionPlanId ||
    !command.approvedImplementerAgent ||
    !command.approvedReviewerAgent ||
    !command.startedBy ||
    !command.requestedAt
  ) {
    return "IMPLEMENTER_RUNTIME_MALFORMED";
  }
  if (getActorBlockReason(command.startedBy)) return "IMPLEMENTER_RUNTIME_INVALID_ACTOR";
  return undefined;
}

function validateContext(input: ImplementerRuntimeInput): ImplementerRuntimeReasonCode | undefined {
  const plan = input.executionPlan;
  const readiness = input.readiness;
  const readinessResult = input.readinessResult;
  const approval = input.approval;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;
  const runtimeStart = input.runtimeStart;
  const runtimeStartResult = input.runtimeStartResult;
  const { command } = input;

  if (!plan) return "IMPLEMENTER_RUNTIME_PLAN_INVALID";
  if (plan.projectId !== command.projectId || plan.planId !== command.executionPlanId) {
    return "IMPLEMENTER_RUNTIME_PLAN_INVALID";
  }
  if (
    plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) ||
    plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION
  ) {
    return "IMPLEMENTER_RUNTIME_PLAN_INVALID";
  }

  if (!readiness || !readinessResult || readiness.status !== "Ready" || readinessResult.status !== "Ready") {
    return "IMPLEMENTER_RUNTIME_READINESS_NOT_READY";
  }
  if (readiness.projectId !== plan.projectId || readinessResult.projectId !== plan.projectId) {
    return "IMPLEMENTER_RUNTIME_PROJECT_MISMATCH";
  }
  if (readiness.executionPlanId !== plan.planId || readinessResult.executionPlanId !== plan.planId) {
    return "IMPLEMENTER_RUNTIME_READINESS_NOT_READY";
  }

  if (!approval) return "IMPLEMENTER_RUNTIME_APPROVAL_MISSING";
  if (approval.projectId !== plan.projectId) return "IMPLEMENTER_RUNTIME_PROJECT_MISMATCH";
  if (approval.executionPlanId !== plan.planId) return "IMPLEMENTER_RUNTIME_APPROVAL_STALE";
  if (!approval.executionApproved) return "IMPLEMENTER_RUNTIME_APPROVAL_STALE";
  if (getActorBlockReason(approval.approvedBy)) return "IMPLEMENTER_RUNTIME_INVALID_ACTOR";

  if (!preflight || !preflightResult) return "IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY";
  if (preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId) {
    return "IMPLEMENTER_RUNTIME_PROJECT_MISMATCH";
  }
  if (
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.status !== "Ready" ||
    preflightResult.status !== "Ready" ||
    !preflight.runtimePreflightPassed ||
    !preflightResult.runtimePreflightPassed
  ) {
    return "IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY";
  }

  if (!runtimeStart || !runtimeStartResult) return "IMPLEMENTER_RUNTIME_START_MISSING";
  if (runtimeStart.projectId !== plan.projectId || runtimeStartResult.projectId !== plan.projectId) {
    return "IMPLEMENTER_RUNTIME_PROJECT_MISMATCH";
  }
  if (runtimeStart.runtimeStartId !== command.runtimeStartId) return "IMPLEMENTER_RUNTIME_START_STALE";
  if (
    runtimeStart.runtimeStartId !== createRuntimeStartId(plan.projectId, plan.planId) ||
    runtimeStart.rulesVersion !== RUNTIME_START_RULES_VERSION
  ) {
    return "IMPLEMENTER_RUNTIME_START_STALE";
  }
  if (runtimeStartResult.status !== "Started" && runtimeStartResult.status !== "AlreadyStarted") {
    return "IMPLEMENTER_RUNTIME_START_STALE";
  }
  if (
    runtimeStart.executionPlanId !== plan.planId ||
    runtimeStart.humanExecutionApprovalId !== approval.approvalId ||
    runtimeStart.runtimePreflightId !== preflight.preflightId ||
    runtimeStart.taskId !== plan.projectTaskId ||
    runtimeStart.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    runtimeStart.preparedSessionId !== plan.preparedSessionId ||
    runtimeStart.activeSessionId !== plan.activeSessionId ||
    runtimeStart.employeeId !== plan.employeeId ||
    runtimeStart.repositoryId !== plan.repositoryId
  ) {
    return "IMPLEMENTER_RUNTIME_START_STALE";
  }
  if (runtimeStart.worktreePath !== plan.worktreePath || runtimeStart.repositoryRoot !== plan.repositoryPath) {
    return "IMPLEMENTER_RUNTIME_WORKTREE_MISMATCH";
  }
  if (runtimeStart.branch !== plan.branchName) return "IMPLEMENTER_RUNTIME_BRANCH_MISMATCH";
  if (runtimeStart.specificationPath !== plan.specPath) return "IMPLEMENTER_RUNTIME_SPEC_MISMATCH";
  if (
    !sameOrderedStrings(runtimeStart.validationCommands, plan.validationCommands) ||
    !sameOrderedStrings(approval.validationCommands, plan.validationCommands)
  ) {
    return "IMPLEMENTER_RUNTIME_MUTATION_SCOPE_MISMATCH";
  }
  if (
    !sameOrderedStrings(runtimeStart.mutationScope, plan.allowedMutationScope) ||
    !sameOrderedStrings(approval.allowedMutationScope, plan.allowedMutationScope)
  ) {
    return "IMPLEMENTER_RUNTIME_MUTATION_SCOPE_MISMATCH";
  }
  if (!runtimeStart.executionStarted) return "IMPLEMENTER_RUNTIME_START_STALE";
  if (
    runtimeStart.agentStarted ||
    runtimeStart.implementerStarted ||
    runtimeStart.reviewerStarted ||
    runtimeStart.validationStarted ||
    runtimeStart.repositoryMutationStarted ||
    runtimeStart.githubMutationStarted
  ) {
    return "IMPLEMENTER_RUNTIME_START_STALE";
  }

  return undefined;
}

function validateRoleBinding(input: ImplementerRuntimeInput): ImplementerRuntimeReasonCode | undefined {
  const { command } = input;
  const plan = input.executionPlan;
  const approval = input.approval;
  const preflight = input.preflight;
  const runtimeStart = input.runtimeStart;
  if (!plan || !approval || !preflight || !runtimeStart) return "IMPLEMENTER_RUNTIME_ROLE_MISMATCH";

  // The generic pipeline role labels ("Implementer"/"Reviewer") must be
  // internally consistent across every upstream record -- this mirrors
  // RuntimeStartService's own RUNTIME_START_ROLE_CONTEXT_MISMATCH check,
  // reused here as a precondition, not reimplemented.
  if (
    plan.implementerAgent !== approval.implementerAgent ||
    plan.reviewerAgent !== approval.reviewerAgent ||
    plan.implementerAgent !== runtimeStart.implementer ||
    plan.reviewerAgent !== runtimeStart.reviewer
  ) {
    return "IMPLEMENTER_RUNTIME_ROLE_MISMATCH";
  }

  // The approved binding travels as explicit request data -- never derived
  // from the generic labels above, and never consulting the repository's
  // default agent-role mapping (see plan.md, Architecture Decision 3).
  // Because IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT and
  // IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT are themselves distinct
  // constants, passing both checks below already guarantees the two
  // supplied values differ from one another -- so no separate "same agent
  // in both roles" check is needed; any such input necessarily fails at
  // least one of these two.
  const implementerAgent = command.approvedImplementerAgent;
  const reviewerAgent = command.approvedReviewerAgent;
  if (implementerAgent !== IMPLEMENTER_RUNTIME_APPROVED_IMPLEMENTER_AGENT) {
    return "IMPLEMENTER_RUNTIME_CLAUDE_NOT_IMPLEMENTER";
  }
  if (reviewerAgent !== IMPLEMENTER_RUNTIME_APPROVED_REVIEWER_AGENT) {
    return "IMPLEMENTER_RUNTIME_CODEX_REVIEWER_MISMATCH";
  }

  return undefined;
}

function isSafeConfiguredCommand(config: ImplementerRuntimeCommandConfig) {
  const joined = [config.command, ...config.arguments].join(" ").toLowerCase();
  if (!config.command.trim()) return false;
  if (config.timeoutMs <= 0 || !Number.isFinite(config.timeoutMs) || config.timeoutMs > 30 * 60 * 1000) return false;
  if (/(git\s+push|gh\s+pr\s+(create|merge|ready)|gh\s+issue\s+edit|gh\s+repo\s+edit)/.test(joined)) return false;
  if (/(&&|\|\||[;|]|`|\$\()/.test(joined)) return false;
  return true;
}

function createRuntime(
  input: ImplementerRuntimeInput,
  implementerRuntimeId: string,
  promptId: string,
  providerResult: Awaited<ReturnType<ImplementerRuntimeProvider["invoke"]>>,
): ImplementerRuntime {
  const plan = input.executionPlan!;
  const runtimeStart = input.runtimeStart!;
  const { command } = input;
  const spawned = providerResult.status === "Completed" || providerResult.status === "TimedOut";
  const runtime = {
    implementerRuntimeId,
    projectId: plan.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    executionPlanId: plan.planId,
    humanExecutionApprovalId: runtimeStart.humanExecutionApprovalId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    approvedImplementerAgent: command.approvedImplementerAgent,
    approvedReviewerAgent: command.approvedReviewerAgent,
    promptId,
    status: providerResult.status,
    startedBy: command.startedBy,
    startedAt: command.requestedAt,
    executionStarted: true,
    agentStarted: spawned,
    implementerStarted: spawned,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: providerResult.evidence,
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
  } satisfies ImplementerRuntime;
  return copyImplementerRuntime(runtime);
}

function statusReasonCode(status: ImplementerRuntime["status"]): ImplementerRuntimeReasonCode {
  switch (status) {
    case "Completed":
      return "IMPLEMENTER_RUNTIME_STARTED";
    case "TimedOut":
      return "IMPLEMENTER_RUNTIME_TIMED_OUT";
    case "Cancelled":
      return "IMPLEMENTER_RUNTIME_CANCELLED";
    case "Blocked":
      return "IMPLEMENTER_RUNTIME_PROVIDER_UNAVAILABLE";
    case "Failed":
    default:
      return "IMPLEMENTER_RUNTIME_SPAWN_FAILED";
  }
}

function createResult(input: {
  input: ImplementerRuntimeInput;
  implementerRuntimeId: string;
  status: ImplementerRuntimeResult["status"];
  reasonCodes: ImplementerRuntimeReasonCode[];
  runtime?: ImplementerRuntime;
}): ImplementerRuntimeResult {
  const { command } = input.input;
  const result = {
    id: createImplementerRuntimeResultId(command.projectId || "unknown-project", command.runtimeStartId || "unknown-runtime-start"),
    projectId: command.projectId || "unknown-project",
    runtimeStartId: command.runtimeStartId,
    executionPlanId: command.executionPlanId,
    implementerRuntimeId: input.runtime ? input.implementerRuntimeId : undefined,
    status: input.status,
    reasonCodes: input.reasonCodes,
    started: Boolean(input.runtime?.agentStarted),
    duplicateActiveAttempt: false,
    agentStarted: Boolean(input.runtime?.agentStarted),
    implementerStarted: Boolean(input.runtime?.implementerStarted),
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: command.requestedAt || new Date(0).toISOString(),
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
  } satisfies ImplementerRuntimeResult;
  return copyImplementerRuntimeResult(result);
}

function getActorBlockReason(actor: string | undefined): ImplementerRuntimeReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation|workflow)/.test(normalized)) {
    return "IMPLEMENTER_RUNTIME_INVALID_ACTOR";
  }
  return undefined;
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
