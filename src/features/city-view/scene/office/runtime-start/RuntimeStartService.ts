import { createExecutionPlanId, EXECUTION_PLAN_RULES_VERSION } from "../execution-plans/ExecutionPlanTypes";
import {
  RUNTIME_PREFLIGHT_RULES_VERSION,
  createRuntimePreflightId,
} from "../runtime-preflight/RuntimePreflightTypes";
import {
  RUNTIME_START_RULES_VERSION,
  copyRuntimeStart,
  copyRuntimeStartResult,
  createRuntimeStartCollection,
  createRuntimeStartId,
  createRuntimeStartResultCollection,
  createRuntimeStartResultId,
  type RuntimeStart,
  type RuntimeStartInput,
  type RuntimeStartOutcome,
  type RuntimeStartReasonCode,
  type RuntimeStartResult,
} from "./RuntimeStartTypes";

export class RuntimeStartService {
  start(input: RuntimeStartInput): RuntimeStartOutcome {
    const { command } = input;
    const runtimeStartId = createRuntimeStartId(command.projectId || "unknown-project", command.executionPlanId || "unknown-plan");
    const malformedReason = validateCommand(command);
    if (malformedReason) {
      return this.createBlockedOutcome(input, runtimeStartId, malformedReason, "Failed");
    }

    const validationReason = validateContext(input);
    if (validationReason) {
      return this.createBlockedOutcome(input, runtimeStartId, validationReason);
    }

    const existingStart = input.existingStarts?.starts.find((start) => start.runtimeStartId === runtimeStartId);
    if (existingStart) {
      if (!matchesCurrentContext(existingStart, input)) {
        return this.createBlockedOutcome(input, runtimeStartId, "RUNTIME_START_EXISTING_RECORD_MISMATCH");
      }
      const result = createResult({
        input,
        runtimeStartId,
        status: "AlreadyStarted",
        reasonCodes: ["ALREADY_STARTED"],
        runtimeStart: existingStart,
      });
      return {
        result,
        runtimeStart: copyRuntimeStart(existingStart),
        startCollection: this.upsertStart(input.existingStarts, existingStart),
        resultCollection: this.upsertResult(input.existingResults, result),
      };
    }

    const runtimeStart = createRuntimeStart(input, runtimeStartId);
    const result = createResult({
      input,
      runtimeStartId,
      status: "Started",
      reasonCodes: ["STARTED"],
      runtimeStart,
    });
    return {
      result,
      runtimeStart,
      startCollection: this.upsertStart(input.existingStarts, runtimeStart),
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }

  upsertStart(collection: RuntimeStartInput["existingStarts"], start: RuntimeStart) {
    const existing = collection?.starts ?? [];
    const nextStarts = existing.some((item) => item.runtimeStartId === start.runtimeStartId)
      ? existing.map((item) => (item.runtimeStartId === start.runtimeStartId ? start : item))
      : [...existing, start];
    return createRuntimeStartCollection({
      projectId: collection?.projectId ?? start.projectId,
      starts: nextStarts,
      generatedAt: start.startedAt,
      rulesVersion: RUNTIME_START_RULES_VERSION,
    });
  }

  upsertResult(collection: RuntimeStartInput["existingResults"], result: RuntimeStartResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createRuntimeStartResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: RUNTIME_START_RULES_VERSION,
    });
  }

  private createBlockedOutcome(
    input: RuntimeStartInput,
    runtimeStartId: string,
    reason: RuntimeStartReasonCode,
    status: "Blocked" | "Failed" = "Blocked",
  ): RuntimeStartOutcome {
    const result = createResult({
      input,
      runtimeStartId,
      status,
      reasonCodes: [reason],
    });
    return {
      result,
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }
}

function validateCommand(command: RuntimeStartInput["command"]): RuntimeStartReasonCode | undefined {
  if (!command.projectId || !command.executionPlanId || !command.runtimePreflightId || !command.startedBy || !command.requestedAt) {
    return "RUNTIME_START_MALFORMED";
  }
  if (getActorBlockReason(command.startedBy)) return "RUNTIME_START_INVALID_ACTOR";
  return undefined;
}

function validateContext(input: RuntimeStartInput): RuntimeStartReasonCode | undefined {
  const plan = input.executionPlan;
  const readiness = input.readiness;
  const readinessResult = input.readinessResult;
  const approval = input.approval;
  const preflight = input.preflight;
  const preflightResult = input.preflightResult;
  const { command } = input;

  if (!plan) return "RUNTIME_START_PLAN_INVALID";
  if (plan.projectId !== command.projectId || plan.planId !== command.executionPlanId) return "RUNTIME_START_PLAN_INVALID";
  if (plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId) || plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION) {
    return "RUNTIME_START_PLAN_INVALID";
  }
  if (plan.executionStarted || plan.runtimeStarted || plan.subprocessStarted) return "RUNTIME_START_ALREADY_STARTED";
  if (plan.repositoryMutationStarted) return "RUNTIME_START_REPOSITORY_MUTATION_STARTED";
  if (plan.githubMutationStarted) return "RUNTIME_START_GITHUB_MUTATION_STARTED";

  if (!readiness || !readinessResult) return "RUNTIME_START_READINESS_NOT_READY";
  if (readiness.projectId !== plan.projectId || readinessResult.projectId !== plan.projectId) return "RUNTIME_START_PROJECT_MISMATCH";
  if (
    readiness.executionPlanId !== plan.planId ||
    readinessResult.executionPlanId !== plan.planId ||
    readinessResult.readinessId !== readiness.readinessId
  ) return "RUNTIME_START_READINESS_NOT_READY";
  if (
    readiness.status !== "Ready" ||
    readinessResult.status !== "Ready" ||
    readinessResult.blockedCheckCount > 0 ||
    readinessResult.failedCheckCount > 0
  ) return "RUNTIME_START_READINESS_NOT_READY";
  if (readiness.executionStarted || readinessResult.executionStarted) return "RUNTIME_START_ALREADY_STARTED";
  if (readiness.agentStarted || readinessResult.agentStarted) return "RUNTIME_START_AGENT_ALREADY_STARTED";
  if (readiness.repositoryMutationStarted || readinessResult.repositoryMutationStarted) return "RUNTIME_START_REPOSITORY_MUTATION_STARTED";
  if (readiness.githubMutationStarted || readinessResult.githubMutationStarted) return "RUNTIME_START_GITHUB_MUTATION_STARTED";

  if (!approval) return "RUNTIME_START_APPROVAL_MISSING";
  const approvalReason = validateApproval(plan, readiness, approval);
  if (approvalReason) return approvalReason;

  if (!preflight || !preflightResult) return "RUNTIME_START_PREFLIGHT_MISSING";
  if (preflight.projectId !== plan.projectId || preflightResult.projectId !== plan.projectId) return "RUNTIME_START_PROJECT_MISMATCH";
  if (preflight.preflightId !== command.runtimePreflightId || preflightResult.preflightId !== preflight.preflightId) {
    return "RUNTIME_START_PREFLIGHT_STALE";
  }
  if (
    preflight.preflightId !== createRuntimePreflightId(plan.projectId, plan.planId) ||
    preflight.rulesVersion !== RUNTIME_PREFLIGHT_RULES_VERSION ||
    preflight.executionPlanId !== plan.planId ||
    preflightResult.executionPlanId !== plan.planId
  ) return "RUNTIME_START_PREFLIGHT_STALE";
  if (preflight.status === "Blocked" || preflightResult.status === "Blocked") return "RUNTIME_START_PREFLIGHT_BLOCKED";
  if (preflight.status === "Failed" || preflightResult.status === "Failed") return "RUNTIME_START_PREFLIGHT_FAILED";
  if (preflight.status !== "Ready" || preflightResult.status !== "Ready" || !preflight.runtimePreflightPassed || !preflightResult.runtimePreflightPassed) {
    return "RUNTIME_START_PREFLIGHT_STALE";
  }
  if (
    preflight.readinessId !== readiness.readinessId ||
    preflight.approvalId !== approval.approvalId ||
    preflight.activeSessionId !== plan.activeSessionId ||
    preflight.projectTaskId !== plan.projectTaskId ||
    preflight.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    preflight.preparedSessionId !== plan.preparedSessionId ||
    preflight.employeeId !== plan.employeeId ||
    preflight.repositoryId !== plan.repositoryId ||
    preflightResult.readinessId !== readiness.readinessId ||
    preflightResult.approvalId !== approval.approvalId
  ) return "RUNTIME_START_PREFLIGHT_STALE";
  if (preflight.executionStarted || preflightResult.executionStarted) return "RUNTIME_START_ALREADY_STARTED";
  if (preflight.agentStarted || preflightResult.agentStarted) return "RUNTIME_START_AGENT_ALREADY_STARTED";
  if (preflight.repositoryMutationStarted || preflightResult.repositoryMutationStarted) return "RUNTIME_START_REPOSITORY_MUTATION_STARTED";
  if (preflight.githubMutationStarted || preflightResult.githubMutationStarted) return "RUNTIME_START_GITHUB_MUTATION_STARTED";

  return undefined;
}

function validateApproval(
  plan: NonNullable<RuntimeStartInput["executionPlan"]>,
  readiness: NonNullable<RuntimeStartInput["readiness"]>,
  approval: RuntimeStartInput["approval"],
): RuntimeStartReasonCode | undefined {
  if (!approval) return "RUNTIME_START_APPROVAL_MISSING";
  if (approval.projectId !== plan.projectId) return "RUNTIME_START_PROJECT_MISMATCH";
  if (approval.executionPlanId !== plan.planId) return "RUNTIME_START_APPROVAL_STALE";
  if (
    approval.readinessId !== readiness.readinessId ||
    approval.activeSessionId !== plan.activeSessionId ||
    approval.projectTaskId !== plan.projectTaskId ||
    approval.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    approval.preparedSessionId !== plan.preparedSessionId ||
    approval.employeeId !== plan.employeeId ||
    approval.repositoryId !== plan.repositoryId
  ) return "RUNTIME_START_APPROVAL_STALE";
  if (approval.implementerAgent !== plan.implementerAgent || approval.reviewerAgent !== plan.reviewerAgent) {
    return "RUNTIME_START_ROLE_CONTEXT_MISMATCH";
  }
  if (!sameOrderedStrings(approval.validationCommands, plan.validationCommands)) return "RUNTIME_START_VALIDATION_COMMANDS_MISMATCH";
  if (!sameOrderedStrings(approval.allowedMutationScope, plan.allowedMutationScope)) return "RUNTIME_START_MUTATION_SCOPE_MISMATCH";
  if (!approval.executionApproved) return "RUNTIME_START_APPROVAL_STALE";
  if (getActorBlockReason(approval.approvedBy)) return "RUNTIME_START_INVALID_ACTOR";
  if (approval.executionStarted) return "RUNTIME_START_ALREADY_STARTED";
  if (approval.agentStarted) return "RUNTIME_START_AGENT_ALREADY_STARTED";
  if (approval.repositoryMutationStarted) return "RUNTIME_START_REPOSITORY_MUTATION_STARTED";
  if (approval.githubMutationStarted) return "RUNTIME_START_GITHUB_MUTATION_STARTED";
  return undefined;
}

function createRuntimeStart(input: RuntimeStartInput, runtimeStartId: string): RuntimeStart {
  const plan = input.executionPlan!;
  const start = {
    runtimeStartId,
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    executionReadinessResultId: input.readinessResult!.id,
    humanExecutionApprovalId: input.approval!.approvalId,
    runtimePreflightId: input.preflight!.preflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    repositoryRoot: plan.repositoryPath,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.allowedMutationScope],
    startedBy: input.command.startedBy,
    startedAt: input.command.requestedAt,
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: RUNTIME_START_RULES_VERSION,
  } satisfies RuntimeStart;
  return copyRuntimeStart(start);
}

function createResult(input: {
  input: RuntimeStartInput;
  runtimeStartId: string;
  status: RuntimeStartResult["status"];
  reasonCodes: RuntimeStartReasonCode[];
  runtimeStart?: RuntimeStart;
}): RuntimeStartResult {
  const { command } = input.input;
  const result = {
    id: createRuntimeStartResultId(command.projectId || "unknown-project", command.executionPlanId || "unknown-plan"),
    projectId: command.projectId || "unknown-project",
    executionPlanId: command.executionPlanId || "unknown-plan",
    runtimeStartId: input.status === "Started" || input.status === "AlreadyStarted" ? input.runtimeStartId : undefined,
    runtimePreflightId: input.runtimeStart?.runtimePreflightId ?? input.input.preflight?.preflightId,
    approvalId: input.runtimeStart?.humanExecutionApprovalId ?? input.input.approval?.approvalId,
    status: input.status,
    reasonCodes: input.reasonCodes,
    started: input.status === "Started" || input.status === "AlreadyStarted",
    duplicateExistingStart: input.status === "AlreadyStarted",
    executionApproved: input.status === "Started" || input.status === "AlreadyStarted",
    runtimePreflightPassed: input.status === "Started" || input.status === "AlreadyStarted",
    executionStarted: input.status === "Started" || input.status === "AlreadyStarted",
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: command.requestedAt || new Date(0).toISOString(),
    rulesVersion: RUNTIME_START_RULES_VERSION,
  } satisfies RuntimeStartResult;
  return copyRuntimeStartResult(result);
}

function matchesCurrentContext(start: RuntimeStart, input: RuntimeStartInput) {
  const plan = input.executionPlan;
  const readinessResult = input.readinessResult;
  const approval = input.approval;
  const preflight = input.preflight;
  if (!plan || !readinessResult || !approval || !preflight) return false;
  return (
    start.projectId === plan.projectId &&
    start.executionPlanId === plan.planId &&
    start.executionReadinessResultId === readinessResult.id &&
    start.humanExecutionApprovalId === approval.approvalId &&
    start.runtimePreflightId === preflight.preflightId &&
    start.taskId === plan.projectTaskId &&
    start.confirmedAssignmentId === plan.confirmedAssignmentId &&
    start.preparedSessionId === plan.preparedSessionId &&
    start.activeSessionId === plan.activeSessionId &&
    start.employeeId === plan.employeeId &&
    start.repositoryId === plan.repositoryId &&
    start.repositoryRoot === plan.repositoryPath &&
    start.worktreePath === plan.worktreePath &&
    start.branch === plan.branchName &&
    start.specificationPath === plan.specPath &&
    start.implementer === plan.implementerAgent &&
    start.reviewer === plan.reviewerAgent &&
    sameOrderedStrings(start.validationCommands, plan.validationCommands) &&
    sameOrderedStrings(start.mutationScope, plan.allowedMutationScope) &&
    !getActorBlockReason(start.startedBy) &&
    start.executionStarted &&
    !start.agentStarted &&
    !start.implementerStarted &&
    !start.reviewerStarted &&
    !start.validationStarted &&
    !start.repositoryMutationStarted &&
    !start.githubMutationStarted
  );
}

function getActorBlockReason(actor: string | undefined): RuntimeStartReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized || /(codex|claude|agent|bot|automation)/.test(normalized)) return "RUNTIME_START_INVALID_ACTOR";
  return undefined;
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}
