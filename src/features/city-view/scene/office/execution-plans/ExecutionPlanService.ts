import { parsePromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentService";
import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import {
  EXECUTION_PLAN_RULES_VERSION,
  copyExecutionPlan,
  copyExecutionPlanResult,
  createExecutionPlanCollection,
  createExecutionPlanId,
  createExecutionPlanResultCollection,
  createExecutionPlanResultId,
  type ExecutionPlan,
  type ExecutionPlanCreationInput,
  type ExecutionPlanCreationOutcome,
  type ExecutionPlanReasonCode,
  type ExecutionPlanRepositoryContext,
  type ExecutionPlanResult,
  type ExecutionPlanResultCollection,
  type ExecutionPlanRoleContext,
  type ExecutionPlanStatus,
} from "./ExecutionPlanTypes";

export class ExecutionPlanService {
  createPlan(input: ExecutionPlanCreationInput): ExecutionPlanCreationOutcome {
    const { request } = input;
    const base = createBaseResult(request.projectId, request.projectTaskId, request.activeSessionId, request.requestedAt);

    if (!request.projectId || !request.projectTaskId || !request.activeSessionId) {
      return { result: blocked(base, "Failed", ["PROJECT_MISMATCH"]) };
    }
    if (!input.existingPlans) {
      return { result: blocked(base, "Failed", ["PLAN_STORE_UNAVAILABLE"]) };
    }
    if (!input.taskCollection || input.taskCollection.projectId !== request.projectId) {
      return {
        result: blocked(base, input.taskCollection ? "Blocked" : "Failed", [
          input.taskCollection ? "PROJECT_MISMATCH" : "TASK_COLLECTION_UNAVAILABLE",
        ]),
      };
    }
    if (!input.activeSessions) {
      return { result: blocked(base, "Failed", ["ACTIVE_SESSION_NOT_FOUND"]) };
    }

    const activeSession = findActiveSession(input.activeSessions, request.activeSessionId);
    if (!activeSession) return { result: blocked(base, "Blocked", ["ACTIVE_SESSION_NOT_FOUND"]) };

    const task = input.taskCollection.tasks.find((item) => item.id === request.projectTaskId && item.projectId === request.projectId);
    if (!task) return { result: blocked(withSession(base, activeSession), "Blocked", ["TASK_NOT_FOUND"]) };

    const taskProvenance = parsePromotedProjectTaskProvenance(task.description);
    if (!taskProvenance || taskProvenance.projectId !== request.projectId || !taskProvenance.candidateTaskId) {
      return { result: blocked(withSession(base, activeSession), "Blocked", ["MALFORMED_PROVENANCE"]) };
    }

    const activeBlock = getActiveSessionBlockReason(activeSession, request, task);
    if (activeBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [activeBlock]) };

    const activeDetails = activeSession as Partial<{
      preparedSessionId: string;
      confirmedAssignmentId: string;
      candidateTaskId: string;
      assignmentRecommendationId: string;
      promotionDecisionId: string;
      executionStarted: boolean;
      agentStarted: boolean;
      repositoryMutationStarted: boolean;
      githubMutationStarted: boolean;
    }>;
    if (!activeDetails.preparedSessionId || !activeDetails.confirmedAssignmentId) {
      return { result: blocked(withSession(base, activeSession), "Blocked", ["ACTIVE_SESSION_STALE"]) };
    }

    const assignment = input.confirmedAssignments?.[activeDetails.confirmedAssignmentId];
    if (!assignment) return { result: blocked(withSession(base, activeSession), "Blocked", ["CONFIRMED_ASSIGNMENT_MISSING"]) };
    const assignmentBlock = getAssignmentBlockReason(assignment, activeSession, activeDetails, task);
    if (assignmentBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [assignmentBlock]) };

    const preparedSession = input.preparedSessions?.[activeDetails.preparedSessionId];
    if (!preparedSession) return { result: blocked(withSession(base, activeSession), "Blocked", ["PREPARED_SESSION_MISSING"]) };
    const preparedBlock = getPreparedSessionBlockReason(preparedSession, assignment, activeSession, activeDetails);
    if (preparedBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [preparedBlock]) };

    if (!input.employees) return { result: blocked(withSession(base, activeSession), "Failed", ["EMPLOYEE_REGISTRY_UNAVAILABLE"]) };
    const employee = input.employees.find((item) => item.id === activeSession.employeeId);
    if (!employee) return { result: blocked(withSession(base, activeSession), "Blocked", ["EMPLOYEE_MISSING"]) };
    const employeeBlock = getEmployeeBlockReason(employee, activeSession, task);
    if (employeeBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [employeeBlock]) };

    const repositoryContext = input.repositoryContext;
    const repositoryBlock = getRepositoryBlockReason(input, repositoryContext);
    if (repositoryBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [repositoryBlock]) };
    const roleContext = input.roleContext;
    const roleBlock = getRoleBlockReason(roleContext);
    if (roleBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [roleBlock]) };

    const planId = createExecutionPlanId(request.projectId, request.activeSessionId);
    const existingPlan = input.existingPlans.plans.find((plan) => plan.planId === planId);
    if (existingPlan) {
      const existingBlock = getExistingPlanBlockReason(existingPlan, input, activeSession, task, assignment, preparedSession);
      if (existingBlock) return { result: blocked(withSession(base, activeSession), "Blocked", [existingBlock]) };
      return {
        result: copyExecutionPlanResult({
          ...withSession(base, activeSession),
          planId,
          status: "AlreadyExists",
          reasonCodes: ["ALREADY_EXISTS"],
          createdPlan: false,
          duplicateExistingPlan: true,
        }),
        plan: copyExecutionPlan(existingPlan),
      };
    }

    const plan = createPlanRecord(
      input.featureId,
      task,
      activeSession,
      activeDetails,
      assignment,
      preparedSession,
      employee,
      repositoryContext!,
      roleContext!,
      request.requestedAt,
    );
    const planCollection = createExecutionPlanCollection({
      projectId: input.existingPlans.projectId || request.projectId,
      plans: [...input.existingPlans.plans, plan],
      generatedAt: request.requestedAt,
      rulesVersion: EXECUTION_PLAN_RULES_VERSION,
    });

    return {
      result: copyExecutionPlanResult({
        ...withSession(base, activeSession),
        planId: plan.planId,
        status: "Created",
        reasonCodes: ["CREATED"],
        createdPlan: true,
        duplicateExistingPlan: false,
      }),
      plan,
      planCollection,
    };
  }

  upsertResult(
    collection: ExecutionPlanResultCollection | undefined,
    result: ExecutionPlanResult,
  ): ExecutionPlanResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createExecutionPlanResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesVersion: EXECUTION_PLAN_RULES_VERSION,
    });
  }
}

function createBaseResult(projectId: string, projectTaskId: string, activeSessionId: string, resultAt: string): ExecutionPlanResult {
  return {
    id: createExecutionPlanResultId(projectId, activeSessionId || "unknown-active-session"),
    projectId,
    projectTaskId,
    activeSessionId,
    status: "Failed",
    reasonCodes: [],
    createdPlan: false,
    duplicateExistingPlan: false,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt,
    rulesVersion: EXECUTION_PLAN_RULES_VERSION,
  };
}

function withSession(base: ExecutionPlanResult, session: WorkSession): ExecutionPlanResult {
  return {
    ...base,
    activeSessionId: session.id,
  };
}

function blocked(base: ExecutionPlanResult, status: ExecutionPlanStatus, reasonCodes: ExecutionPlanReasonCode[]) {
  return copyExecutionPlanResult({
    ...base,
    status,
    reasonCodes,
    createdPlan: false,
    duplicateExistingPlan: false,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function findActiveSession(activeSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>, activeSessionId: string) {
  return Object.values(activeSessions).flat().find((session) => session.id === activeSessionId);
}

function getActiveSessionBlockReason(
  activeSession: WorkSession,
  request: ExecutionPlanCreationInput["request"],
  task: ProjectTask,
): ExecutionPlanReasonCode | undefined {
  if (
    activeSession.id !== request.activeSessionId ||
    activeSession.projectId !== request.projectId ||
    activeSession.taskId !== task.id ||
    activeSession.employeeId !== task.assigneeId
  ) return "ACTIVE_SESSION_STALE";
  if (activeSession.status !== "running") return "ACTIVE_SESSION_NOT_ACTIVE";
  if (task.status !== "In Progress") return "TASK_NOT_ACTIVE";
  if (!task.assigneeId || task.assigneeId !== activeSession.employeeId || (task.assignee && task.assignee !== activeSession.employeeName)) {
    return "TASK_ASSIGNEE_MISMATCH";
  }
  const flags = activeSession as Partial<{
    executionStarted: boolean;
    agentStarted: boolean;
    repositoryMutationStarted: boolean;
    githubMutationStarted: boolean;
  }>;
  if (flags.executionStarted || flags.agentStarted || flags.repositoryMutationStarted || flags.githubMutationStarted) {
    return "ACTIVE_SESSION_NOT_ACTIVE";
  }
  return undefined;
}

function getAssignmentBlockReason(
  assignment: ConfirmedEmployeeAssignmentRecord,
  session: WorkSession,
  details: Partial<{ candidateTaskId: string; assignmentRecommendationId: string; promotionDecisionId: string }>,
  task: ProjectTask,
): ExecutionPlanReasonCode | undefined {
  if (
    assignment.projectId !== session.projectId ||
    assignment.projectTaskId !== task.id ||
    assignment.employeeId !== session.employeeId ||
    assignment.candidateTaskId !== details.candidateTaskId ||
    assignment.assignmentRecommendationId !== details.assignmentRecommendationId ||
    assignment.promotionDecisionId !== details.promotionDecisionId ||
    !assignment.humanConfirmed
  ) return "CONFIRMED_ASSIGNMENT_STALE";
  return undefined;
}

function getPreparedSessionBlockReason(
  prepared: PreparedWorkSessionRecord,
  assignment: ConfirmedEmployeeAssignmentRecord,
  session: WorkSession,
  details: Partial<{ preparedSessionId: string; candidateTaskId: string; assignmentRecommendationId: string; promotionDecisionId: string }>,
): ExecutionPlanReasonCode | undefined {
  if (
    prepared.id !== details.preparedSessionId ||
    prepared.projectId !== session.projectId ||
    prepared.projectTaskId !== session.taskId ||
    prepared.employeeId !== session.employeeId ||
    prepared.confirmedAssignmentId !== assignment.id ||
    prepared.candidateTaskId !== details.candidateTaskId ||
    prepared.assignmentRecommendationId !== details.assignmentRecommendationId ||
    prepared.promotionDecisionId !== details.promotionDecisionId ||
    prepared.status !== "Prepared"
  ) return "PREPARED_SESSION_STALE";
  return undefined;
}

function getEmployeeBlockReason(employee: Employee, session: WorkSession, task: ProjectTask): ExecutionPlanReasonCode | undefined {
  if (
    employee.id !== session.employeeId ||
    employee.name !== session.employeeName ||
    employee.status !== "Working" ||
    employee.assignedTaskId !== task.id ||
    employee.currentProjectId !== task.projectId
  ) return "EMPLOYEE_STALE";
  return undefined;
}

function getRepositoryBlockReason(
  input: ExecutionPlanCreationInput,
  context: ExecutionPlanRepositoryContext | undefined,
): ExecutionPlanReasonCode | undefined {
  if (!input.repositoryIdentity) return "REPOSITORY_IDENTITY_MISSING";
  if (!input.repositorySnapshot || input.repositorySnapshot.syncStatus !== "Succeeded") return "REPOSITORY_METADATA_UNAVAILABLE";
  if (!context?.repositoryId || !context.repositoryPath) return "REPOSITORY_METADATA_UNAVAILABLE";
  if (!context.worktreePath || !input.pathChecks?.worktreeExists) return "WORKTREE_UNAVAILABLE";
  if (!context.branchName || context.branchName !== input.repositorySnapshot.currentBranch) return "BRANCH_UNAVAILABLE";
  if (!context.specPath || !input.pathChecks?.specExists) return "SPEC_UNAVAILABLE";
  return undefined;
}

function getRoleBlockReason(context: ExecutionPlanRoleContext | undefined): ExecutionPlanReasonCode | undefined {
  if (!context?.implementerAgent || !context.reviewerAgent) return "ROLE_CONTEXT_UNAVAILABLE";
  if (context.validationCommands.length === 0) return "VALIDATION_COMMANDS_UNAVAILABLE";
  if (context.allowedMutationScope.length === 0) return "MUTATION_SCOPE_UNAVAILABLE";
  return undefined;
}

function getExistingPlanBlockReason(
  plan: ExecutionPlan,
  input: ExecutionPlanCreationInput,
  session: WorkSession,
  task: ProjectTask,
  assignment: ConfirmedEmployeeAssignmentRecord,
  prepared: PreparedWorkSessionRecord,
): ExecutionPlanReasonCode | undefined {
  if (
    plan.projectId !== input.request.projectId ||
    plan.featureId !== input.featureId ||
    plan.projectTaskId !== task.id ||
    plan.activeSessionId !== session.id ||
    plan.confirmedAssignmentId !== assignment.id ||
    plan.preparedSessionId !== prepared.id ||
    plan.employeeId !== session.employeeId ||
    plan.repositoryId !== input.repositoryContext?.repositoryId ||
    plan.repositoryPath !== input.repositoryContext?.repositoryPath ||
    plan.worktreePath !== input.repositoryContext?.worktreePath ||
    plan.branchName !== input.repositoryContext?.branchName ||
    plan.specPath !== input.repositoryContext?.specPath
  ) return "ACTIVE_SESSION_STALE";
  return undefined;
}

function createPlanRecord(
  featureId: string,
  task: ProjectTask,
  session: WorkSession,
  details: Partial<{ candidateTaskId: string; assignmentRecommendationId: string; promotionDecisionId: string }>,
  assignment: ConfirmedEmployeeAssignmentRecord,
  prepared: PreparedWorkSessionRecord,
  employee: Employee,
  repository: ExecutionPlanRepositoryContext,
  roles: ExecutionPlanRoleContext,
  createdAt: string,
): ExecutionPlan {
  return copyExecutionPlan({
    planId: createExecutionPlanId(task.projectId, session.id),
    projectId: task.projectId,
    featureId,
    projectTaskId: task.id,
    candidateTaskId: details.candidateTaskId,
    recommendationId: details.assignmentRecommendationId,
    promotionDecisionId: details.promotionDecisionId,
    confirmedAssignmentId: assignment.id,
    preparedSessionId: prepared.id,
    activeSessionId: session.id,
    employeeId: employee.id,
    repositoryId: repository.repositoryId,
    repositoryPath: repository.repositoryPath,
    worktreePath: repository.worktreePath,
    branchName: repository.branchName,
    specPath: repository.specPath,
    implementerAgent: roles.implementerAgent,
    reviewerAgent: roles.reviewerAgent,
    validationCommands: roles.validationCommands,
    allowedMutationScope: roles.allowedMutationScope,
    createdAt,
    rulesVersion: EXECUTION_PLAN_RULES_VERSION,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}
