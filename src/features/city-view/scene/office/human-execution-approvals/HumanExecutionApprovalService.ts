import {
  HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
  copyHumanExecutionApproval,
  copyHumanExecutionApprovalResult,
  createHumanExecutionApprovalCollection,
  createHumanExecutionApprovalId,
  createHumanExecutionApprovalResultCollection,
  createHumanExecutionApprovalResultId,
  type HumanExecutionApproval,
  type HumanExecutionApprovalInput,
  type HumanExecutionApprovalOutcome,
  type HumanExecutionApprovalReasonCode,
  type HumanExecutionApprovalResult,
  type HumanExecutionApprovalResultCollection,
  type HumanExecutionApprovalResultStatus,
} from "./HumanExecutionApprovalTypes";

export class HumanExecutionApprovalService {
  approve(input: HumanExecutionApprovalInput): HumanExecutionApprovalOutcome {
    const { command } = input;
    const base = createBaseResult(command.projectId, command.executionPlanId || "unknown-plan", command.readinessId, command.requestedAt);

    if (!command.projectId || !command.executionPlanId || !command.readinessId) {
      return { result: blocked(base, "Failed", ["APPROVAL_MALFORMED"]) };
    }
    if (!input.existingApprovals) {
      return { result: blocked(base, "Failed", ["APPROVAL_STORE_UNAVAILABLE"]) };
    }

    const actorReason = getActorBlockReason(command.approvedBy);
    if (actorReason) return { result: blocked(base, "Blocked", [actorReason]) };

    const plan = input.executionPlan;
    if (!plan) return { result: blocked(base, "Blocked", ["EXECUTION_PLAN_MISSING"]) };
    if (plan.projectId !== command.projectId) {
      return { result: blocked(base, "Blocked", ["EXECUTION_PLAN_PROJECT_MISMATCH"]) };
    }
    if (
      plan.executionStarted ||
      plan.runtimeStarted ||
      plan.subprocessStarted ||
      plan.repositoryMutationStarted ||
      plan.githubMutationStarted
    ) {
      return { result: blocked(base, "Blocked", ["EXECUTION_PLAN_ALREADY_STARTED"]) };
    }

    const readiness = input.readiness;
    const readinessResult = input.readinessResult;
    if (!readiness || !readinessResult) return { result: blocked(base, "Blocked", ["READINESS_MISSING"]) };
    const readinessReason = getReadinessBlockReason(command.projectId, command.executionPlanId, command.readinessId, readiness, readinessResult);
    if (readinessReason) return { result: blocked(base, "Blocked", [readinessReason]) };

    const approvalId = createHumanExecutionApprovalId(command.projectId, command.executionPlanId);
    const existingApproval = input.existingApprovals.approvals.find((item) => item.approvalId === approvalId);
    if (existingApproval) {
      const existingReason = getExistingApprovalBlockReason(existingApproval, plan, readiness, command.approvedBy);
      if (existingReason) return { result: blocked(base, "Blocked", [existingReason]) };
      return {
        result: copyHumanExecutionApprovalResult({
          ...base,
          approvalId,
          status: "AlreadyApproved",
          reasonCodes: ["ALREADY_APPROVED"],
          approved: false,
          duplicateExistingApproval: true,
          executionApproved: true,
        }),
        approval: copyHumanExecutionApproval(existingApproval),
      };
    }

    const approval = copyHumanExecutionApproval({
      approvalId,
      projectId: command.projectId,
      executionPlanId: plan.planId,
      readinessId: readiness.readinessId,
      activeSessionId: plan.activeSessionId,
      projectTaskId: plan.projectTaskId,
      confirmedAssignmentId: plan.confirmedAssignmentId,
      preparedSessionId: plan.preparedSessionId,
      employeeId: plan.employeeId,
      repositoryId: plan.repositoryId,
      implementerAgent: plan.implementerAgent,
      reviewerAgent: plan.reviewerAgent,
      validationCommands: [...plan.validationCommands],
      allowedMutationScope: [...plan.allowedMutationScope],
      decision: "Approved",
      executionApproved: true,
      approvedAt: command.requestedAt,
      approvedBy: command.approvedBy.trim(),
      rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    const approvalCollection = createHumanExecutionApprovalCollection({
      projectId: input.existingApprovals.projectId || command.projectId,
      approvals: [...input.existingApprovals.approvals, approval],
      generatedAt: command.requestedAt,
      rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
    });
    return {
      result: copyHumanExecutionApprovalResult({
        ...base,
        approvalId,
        status: "Approved",
        reasonCodes: ["APPROVED"],
        approved: true,
        duplicateExistingApproval: false,
        executionApproved: true,
      }),
      approval,
      approvalCollection,
    };
  }

  upsertResult(
    collection: HumanExecutionApprovalResultCollection | undefined,
    result: HumanExecutionApprovalResult,
  ): HumanExecutionApprovalResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createHumanExecutionApprovalResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
    });
  }
}

function createBaseResult(
  projectId: string,
  executionPlanId: string,
  readinessId: string | undefined,
  resultAt: string,
): HumanExecutionApprovalResult {
  return {
    id: createHumanExecutionApprovalResultId(projectId || "unknown-project", executionPlanId || "unknown-plan"),
    projectId,
    executionPlanId,
    readinessId,
    status: "Failed",
    reasonCodes: [],
    approved: false,
    duplicateExistingApproval: false,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt,
    rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
  };
}

function blocked(
  base: HumanExecutionApprovalResult,
  status: HumanExecutionApprovalResultStatus,
  reasonCodes: HumanExecutionApprovalReasonCode[],
) {
  return copyHumanExecutionApprovalResult({
    ...base,
    status,
    reasonCodes,
    approved: false,
    duplicateExistingApproval: false,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function getActorBlockReason(actor: string | undefined): HumanExecutionApprovalReasonCode | undefined {
  const normalized = actor?.trim().toLowerCase();
  if (!normalized) return "APPROVER_MISSING";
  if (/(codex|claude|agent|bot|automation)/.test(normalized)) return "APPROVER_NOT_HUMAN";
  return undefined;
}

function getReadinessBlockReason(
  projectId: string,
  executionPlanId: string,
  readinessId: string,
  readiness: NonNullable<HumanExecutionApprovalInput["readiness"]>,
  result: NonNullable<HumanExecutionApprovalInput["readinessResult"]>,
): HumanExecutionApprovalReasonCode | undefined {
  if (readiness.projectId !== projectId || result.projectId !== projectId) return "READINESS_PROJECT_MISMATCH";
  if (
    readiness.executionPlanId !== executionPlanId ||
    result.executionPlanId !== executionPlanId ||
    readiness.readinessId !== readinessId ||
    result.readinessId !== readinessId
  ) return "READINESS_PLAN_MISMATCH";
  if (readiness.executionApproved || result.executionApproved) return "READINESS_ALREADY_APPROVED";
  if (
    readiness.executionStarted ||
    readiness.agentStarted ||
    readiness.repositoryMutationStarted ||
    readiness.githubMutationStarted ||
    result.executionStarted ||
    result.agentStarted ||
    result.repositoryMutationStarted ||
    result.githubMutationStarted
  ) return "READINESS_ALREADY_STARTED";
  if (
    readiness.status !== "Ready" ||
    result.status !== "Ready" ||
    result.blockedCheckCount > 0 ||
    result.failedCheckCount > 0
  ) return "READINESS_NOT_READY";
  return undefined;
}

function getExistingApprovalBlockReason(
  approval: HumanExecutionApproval,
  plan: NonNullable<HumanExecutionApprovalInput["executionPlan"]>,
  readiness: NonNullable<HumanExecutionApprovalInput["readiness"]>,
  actor: string,
): HumanExecutionApprovalReasonCode | undefined {
  if (
    approval.projectId !== plan.projectId ||
    approval.executionPlanId !== plan.planId ||
    approval.readinessId !== readiness.readinessId ||
    approval.activeSessionId !== plan.activeSessionId ||
    approval.projectTaskId !== plan.projectTaskId ||
    approval.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    approval.preparedSessionId !== plan.preparedSessionId ||
    approval.employeeId !== plan.employeeId ||
    approval.repositoryId !== plan.repositoryId ||
    approval.implementerAgent !== plan.implementerAgent ||
    approval.reviewerAgent !== plan.reviewerAgent ||
    !arraysEqual(approval.validationCommands, plan.validationCommands) ||
    !arraysEqual(approval.allowedMutationScope, plan.allowedMutationScope) ||
    approval.approvedBy !== actor.trim()
  ) return "APPROVAL_CONTEXT_MISMATCH";
  return undefined;
}

function arraysEqual(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
