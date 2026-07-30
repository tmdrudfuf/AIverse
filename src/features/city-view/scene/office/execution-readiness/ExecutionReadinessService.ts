import { EXECUTION_PLAN_RULES_VERSION, createExecutionPlanId } from "../execution-plans/ExecutionPlanTypes";
import { parsePromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentService";
import {
  EXECUTION_READINESS_RULES_VERSION,
  copyExecutionReadiness,
  copyExecutionReadinessResult,
  createExecutionReadinessCheckId,
  createExecutionReadinessCollection,
  createExecutionReadinessId,
  createExecutionReadinessResultCollection,
  createExecutionReadinessResultId,
  type ExecutionReadiness,
  type ExecutionReadinessCheck,
  type ExecutionReadinessCheckCategory,
  type ExecutionReadinessEvaluationInput,
  type ExecutionReadinessEvaluationOutcome,
  type ExecutionReadinessReasonCode,
  type ExecutionReadinessResult,
  type ExecutionReadinessStatus,
} from "./ExecutionReadinessTypes";

type ExecutionPlanLike = NonNullable<ExecutionReadinessEvaluationInput["executionPlans"]>["plans"][number];
type TaskLike = NonNullable<ExecutionReadinessEvaluationInput["taskCollection"]>["tasks"][number];
type AssignmentLike = NonNullable<ExecutionReadinessEvaluationInput["confirmedAssignments"]>[string];
type PreparedSessionLike = NonNullable<ExecutionReadinessEvaluationInput["preparedSessions"]>[string];
type ActiveSessionLike = NonNullable<ExecutionReadinessEvaluationInput["activeSessions"]>[string][number];
type EmployeeLike = NonNullable<ExecutionReadinessEvaluationInput["employees"]>[number];

export class ExecutionReadinessService {
  evaluateReadiness(input: ExecutionReadinessEvaluationInput): ExecutionReadinessEvaluationOutcome {
    const { request } = input;
    const readinessId = createExecutionReadinessId(request.projectId || "unknown-project", request.executionPlanId || "unknown-plan");

    if (!request.projectId || !request.executionPlanId) {
      const readiness = createReadinessSnapshot({
        projectId: request.projectId || "unknown-project",
        executionPlanId: request.executionPlanId || "unknown-plan",
        readinessId,
        evaluatedAt: request.evaluatedAt,
        checks: [
          createCheck(readinessId, "ExecutionPlan", "Failed", "MALFORMED_INPUT", "Readiness request is malformed."),
        ],
      });
      const result = createResult(readiness, request.evaluatedAt);
      return { readiness, result };
    }

    const plan = input.executionPlans?.plans.find((item) => item.planId === request.executionPlanId);
    const task = plan ? input.taskCollection?.tasks.find((item) => item.id === plan.projectTaskId) : undefined;
    const assignment = plan ? input.confirmedAssignments?.[plan.confirmedAssignmentId] : undefined;
    const prepared = plan ? input.preparedSessions?.[plan.preparedSessionId] : undefined;
    const active = plan ? findActiveSession(input.activeSessions, plan.activeSessionId) : undefined;
    const employee = plan ? input.employees?.find((item) => item.id === plan.employeeId) : undefined;
    const checks = [
      checkExecutionPlan(readinessId, input, plan),
      checkTask(readinessId, request.projectId, plan, task),
      checkAssignment(readinessId, plan, assignment),
      checkPreparedSession(readinessId, plan, assignment, prepared),
      checkActiveSession(readinessId, plan, active),
      checkEmployee(readinessId, plan, task, active, employee),
      checkRepositoryEvidence(readinessId, plan, input),
      checkAgentContext(readinessId, plan, input),
      checkValidationCommands(readinessId, plan, input),
      checkMutationScope(readinessId, plan, input),
    ];
    const readiness = createReadinessSnapshot({
      projectId: request.projectId,
      executionPlanId: request.executionPlanId,
      readinessId,
      evaluatedAt: request.evaluatedAt,
      plan,
      checks,
    });
    const result = createResult(readiness, request.evaluatedAt);
    return {
      readiness,
      result,
      readinessCollection: this.upsertReadiness(input.existingReadiness, readiness),
      resultCollection: this.upsertResult(input.existingResults, result),
    };
  }

  upsertReadiness(collection: ExecutionReadinessEvaluationInput["existingReadiness"], readiness: ExecutionReadiness) {
    const existing = collection?.readiness ?? [];
    const nextReadiness = existing.some((item) => item.readinessId === readiness.readinessId)
      ? existing.map((item) => (item.readinessId === readiness.readinessId ? readiness : item))
      : [...existing, readiness];
    return createExecutionReadinessCollection({
      projectId: collection?.projectId ?? readiness.projectId,
      readiness: nextReadiness,
      generatedAt: readiness.evaluatedAt,
      rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    });
  }

  upsertResult(collection: ExecutionReadinessEvaluationInput["existingResults"], result: ExecutionReadinessResult) {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createExecutionReadinessResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.evaluatedAt,
      rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    });
  }
}

function createReadinessSnapshot(input: {
  projectId: string;
  executionPlanId: string;
  readinessId: string;
  evaluatedAt: string;
  plan?: ExecutionPlanLike;
  checks: ExecutionReadinessCheck[];
}): ExecutionReadiness {
  const status = getStatus(input.checks);
  return copyExecutionReadiness({
    readinessId: input.readinessId,
    projectId: input.projectId,
    executionPlanId: input.executionPlanId,
    activeSessionId: input.plan?.activeSessionId,
    projectTaskId: input.plan?.projectTaskId,
    confirmedAssignmentId: input.plan?.confirmedAssignmentId,
    preparedSessionId: input.plan?.preparedSessionId,
    employeeId: input.plan?.employeeId,
    repositoryId: input.plan?.repositoryId,
    status,
    checks: input.checks,
    evaluatedAt: input.evaluatedAt,
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function createResult(readiness: ExecutionReadiness, evaluatedAt: string): ExecutionReadinessResult {
  const blocked = readiness.checks.filter((check) => check.status === "Blocked");
  const failed = readiness.checks.filter((check) => check.status === "Failed");
  const passed = readiness.checks.filter((check) => check.status === "Passed");
  const primaryReason = failed[0]?.reason ?? blocked[0]?.reason ?? "READY";
  const reasonCodes = readiness.status === "Ready"
    ? ["READY" as const]
    : Array.from(new Set([...failed, ...blocked].map((check) => check.reason)));
  return copyExecutionReadinessResult({
    id: createExecutionReadinessResultId(readiness.projectId, readiness.executionPlanId),
    projectId: readiness.projectId,
    executionPlanId: readiness.executionPlanId,
    readinessId: readiness.readinessId,
    status: readiness.status,
    reasonCodes,
    primaryReason,
    passedCheckCount: passed.length,
    blockedCheckCount: blocked.length,
    failedCheckCount: failed.length,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt,
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
  });
}

function checkExecutionPlan(
  readinessId: string,
  input: ExecutionReadinessEvaluationInput,
  plan: ExecutionPlanLike | undefined,
) {
  if (!input.executionPlans || input.executionPlans.projectId !== input.request.projectId) {
    return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan collection is unavailable.");
  }
  if (!plan) return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is missing.");
  if (plan.projectId !== input.request.projectId) {
    return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_PROJECT_MISMATCH", "Execution plan belongs to another project.");
  }
  if (plan.planId !== createExecutionPlanId(plan.projectId, plan.activeSessionId)) {
    return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_ID_MISMATCH", "Execution plan identity is inconsistent.");
  }
  if (plan.rulesVersion !== EXECUTION_PLAN_RULES_VERSION) {
    return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_RULES_UNSUPPORTED", "Execution plan rules version is unsupported.");
  }
  if (plan.executionStarted || plan.runtimeStarted || plan.subprocessStarted || plan.repositoryMutationStarted || plan.githubMutationStarted) {
    return createCheck(readinessId, "ExecutionPlan", "Blocked", "EXECUTION_PLAN_ALREADY_STARTED", "Execution plan indicates runtime or mutation already started.");
  }
  return createCheck(readinessId, "ExecutionPlan", "Passed", "READY", "Execution plan is current and non-executing.");
}

function checkTask(readinessId: string, projectId: string, plan: ExecutionPlanLike | undefined, task: TaskLike | undefined) {
  if (!plan) return createCheck(readinessId, "ProjectTask", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before task checks.");
  if (!task) return createCheck(readinessId, "ProjectTask", "Blocked", "TASK_MISSING", "ProjectTask is missing.");
  if (task.projectId !== projectId || task.projectId !== plan.projectId) {
    return createCheck(readinessId, "ProjectTask", "Blocked", "TASK_PROJECT_MISMATCH", "ProjectTask belongs to another project.");
  }
  if (task.status !== "In Progress" || !task.assigneeId || task.assigneeId !== plan.employeeId) {
    return createCheck(readinessId, "ProjectTask", "Blocked", "TASK_STATE_INCOMPATIBLE", "ProjectTask is not in the expected active, assigned state.");
  }
  const provenance = parsePromotedProjectTaskProvenance(task.description);
  if (
    !provenance ||
    provenance.projectId !== plan.projectId ||
    provenance.candidateTaskId !== plan.candidateTaskId ||
    provenance.assignmentRecommendationId !== plan.recommendationId ||
    provenance.promotionDecisionId !== plan.promotionDecisionId
  ) return createCheck(readinessId, "ProjectTask", "Blocked", "TASK_PROVENANCE_MISMATCH", "ProjectTask provenance no longer matches the plan.");
  return createCheck(readinessId, "ProjectTask", "Passed", "READY", "ProjectTask remains active and matches plan provenance.");
}

function checkAssignment(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  assignment: AssignmentLike | undefined,
) {
  if (!plan) return createCheck(readinessId, "ConfirmedAssignment", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before assignment checks.");
  if (!assignment) return createCheck(readinessId, "ConfirmedAssignment", "Blocked", "ASSIGNMENT_MISSING", "Confirmed assignment is missing.");
  if (
    assignment.projectId !== plan.projectId ||
    assignment.id !== plan.confirmedAssignmentId ||
    assignment.projectTaskId !== plan.projectTaskId ||
    assignment.employeeId !== plan.employeeId ||
    assignment.candidateTaskId !== plan.candidateTaskId ||
    assignment.assignmentRecommendationId !== plan.recommendationId ||
    assignment.promotionDecisionId !== plan.promotionDecisionId ||
    !assignment.humanConfirmed
  ) return createCheck(readinessId, "ConfirmedAssignment", "Blocked", "ASSIGNMENT_MISMATCH", "Confirmed assignment no longer matches the plan.");
  return createCheck(readinessId, "ConfirmedAssignment", "Passed", "READY", "Confirmed assignment matches the plan.");
}

function checkPreparedSession(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  assignment: AssignmentLike | undefined,
  prepared: PreparedSessionLike | undefined,
) {
  if (!plan) return createCheck(readinessId, "PreparedSession", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before prepared-session checks.");
  if (!prepared) return createCheck(readinessId, "PreparedSession", "Blocked", "PREPARED_SESSION_MISSING", "Prepared session is missing.");
  if (
    !assignment ||
    prepared.projectId !== plan.projectId ||
    prepared.id !== plan.preparedSessionId ||
    prepared.projectTaskId !== plan.projectTaskId ||
    prepared.employeeId !== plan.employeeId ||
    prepared.confirmedAssignmentId !== assignment.id ||
    prepared.candidateTaskId !== plan.candidateTaskId ||
    prepared.assignmentRecommendationId !== plan.recommendationId ||
    prepared.promotionDecisionId !== plan.promotionDecisionId ||
    prepared.status !== "Prepared" ||
    prepared.active ||
    prepared.workStarted ||
    prepared.executionStarted ||
    prepared.agentStarted ||
    prepared.repositoryMutationStarted ||
    prepared.githubMutationStarted
  ) return createCheck(readinessId, "PreparedSession", "Blocked", "PREPARED_SESSION_MISMATCH", "Prepared session no longer matches the plan.");
  return createCheck(readinessId, "PreparedSession", "Passed", "READY", "Prepared session remains immutable and linked.");
}

function checkActiveSession(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  active: ActiveSessionLike | undefined,
) {
  if (!plan) return createCheck(readinessId, "ActiveSession", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before active-session checks.");
  if (!active) return createCheck(readinessId, "ActiveSession", "Blocked", "ACTIVE_SESSION_MISSING", "Active work session is missing.");
  if (
    active.projectId !== plan.projectId ||
    active.id !== plan.activeSessionId ||
    active.taskId !== plan.projectTaskId ||
    active.employeeId !== plan.employeeId ||
    active.preparedSessionId !== plan.preparedSessionId ||
    active.confirmedAssignmentId !== plan.confirmedAssignmentId ||
    active.candidateTaskId !== plan.candidateTaskId ||
    active.assignmentRecommendationId !== plan.recommendationId ||
    active.promotionDecisionId !== plan.promotionDecisionId
  ) return createCheck(readinessId, "ActiveSession", "Blocked", "ACTIVE_SESSION_MISMATCH", "Active session no longer matches the plan.");
  if (active.status !== "running") {
    return createCheck(readinessId, "ActiveSession", "Blocked", "ACTIVE_SESSION_NOT_ACTIVE", "Active session is not in the expected active state.");
  }
  if (active.executionStarted || active.agentStarted || active.repositoryMutationStarted || active.githubMutationStarted) {
    return createCheck(readinessId, "ActiveSession", "Blocked", "ACTIVE_SESSION_ALREADY_EXECUTING", "Active session indicates execution or mutation already started.");
  }
  return createCheck(readinessId, "ActiveSession", "Passed", "READY", "Active work session is current without agent execution.");
}

function checkEmployee(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  task: TaskLike | undefined,
  active: ActiveSessionLike | undefined,
  employee: EmployeeLike | undefined,
) {
  if (!plan) return createCheck(readinessId, "Employee", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before employee checks.");
  if (!employee) return createCheck(readinessId, "Employee", "Blocked", "EMPLOYEE_MISSING", "Employee is missing.");
  if (employee.id !== plan.employeeId || active?.employeeId !== employee.id || task?.assigneeId !== employee.id) {
    return createCheck(readinessId, "Employee", "Blocked", "EMPLOYEE_MISMATCH", "Employee identity no longer matches task and session.");
  }
  if (employee.status !== "Working" || employee.assignedTaskId !== plan.projectTaskId || employee.currentProjectId !== plan.projectId) {
    return createCheck(readinessId, "Employee", "Blocked", "EMPLOYEE_STATE_INCOMPATIBLE", "Employee logical work state no longer matches the active session.");
  }
  return createCheck(readinessId, "Employee", "Passed", "READY", "Employee remains logically linked to the active session.");
}

function checkRepositoryEvidence(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  input: ExecutionReadinessEvaluationInput,
) {
  if (!plan) return createCheck(readinessId, "RepositoryEvidence", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before repository checks.");
  const evidence = input.repositoryEvidence;
  if (!evidence) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "REPOSITORY_EVIDENCE_MISSING", "Repository evidence is missing.");
  }
  if (evidence.projectId && evidence.projectId !== plan.projectId) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "PROJECT_MISMATCH", "Repository evidence belongs to another project.");
  }
  if (evidence.repositoryId !== plan.repositoryId || evidence.repositoryPathSignal !== plan.repositoryPath) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "REPOSITORY_MISMATCH", "Repository evidence no longer matches the plan.");
  }
  if (!evidence.worktreePathSignal || evidence.worktreePathSignal !== plan.worktreePath) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "WORKTREE_SIGNAL_MISSING", "Worktree signal is missing or stale.");
  }
  if (!evidence.branchSignal || evidence.branchSignal !== plan.branchName) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "BRANCH_SIGNAL_MISSING", "Branch signal is missing or stale.");
  }
  if (!evidence.specPathSignal || evidence.specPathSignal !== plan.specPath) {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "SPEC_SIGNAL_MISSING", "Spec signal is missing or stale.");
  }
  if (evidence.repositorySyncStatus === "Failed" || evidence.repositorySyncStatus === "Unavailable") {
    return createCheck(readinessId, "RepositoryEvidence", "Blocked", "REPOSITORY_EVIDENCE_MISSING", "Repository sync evidence is incompatible.");
  }
  return createCheck(readinessId, "RepositoryEvidence", "Passed", "READY", "Repository evidence signals match the plan.");
}

function checkAgentContext(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  input: ExecutionReadinessEvaluationInput,
) {
  if (!plan) return createCheck(readinessId, "AgentContext", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before agent checks.");
  const context = input.roleContext;
  if (!context?.implementerAgent) return createCheck(readinessId, "AgentContext", "Blocked", "IMPLEMENTER_MISSING", "Implementer context is missing.");
  if (!context.reviewerAgent) return createCheck(readinessId, "AgentContext", "Blocked", "REVIEWER_MISSING", "Reviewer context is missing.");
  if (context.implementerAgent !== plan.implementerAgent || context.reviewerAgent !== plan.reviewerAgent) {
    return createCheck(readinessId, "AgentContext", "Blocked", "AGENT_CONTEXT_MISMATCH", "Agent role context no longer matches the plan.");
  }
  return createCheck(readinessId, "AgentContext", "Passed", "READY", "Agent role context matches the plan without invoking agents.");
}

function checkValidationCommands(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  input: ExecutionReadinessEvaluationInput,
) {
  if (!plan) return createCheck(readinessId, "ValidationCommands", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before validation command checks.");
  const commands = input.roleContext?.validationCommands ?? [];
  if (commands.length === 0 || commands.some((command) => command.trim().length === 0)) {
    return createCheck(readinessId, "ValidationCommands", "Blocked", "VALIDATION_COMMANDS_MISSING", "Validation command signals are missing.");
  }
  if (!sameOrderedStrings(commands, plan.validationCommands)) {
    return createCheck(readinessId, "ValidationCommands", "Blocked", "VALIDATION_COMMANDS_MISMATCH", "Validation command signals no longer match the plan.");
  }
  return createCheck(readinessId, "ValidationCommands", "Passed", "READY", "Validation command signals are present and preserved.");
}

function checkMutationScope(
  readinessId: string,
  plan: ExecutionPlanLike | undefined,
  input: ExecutionReadinessEvaluationInput,
) {
  if (!plan) return createCheck(readinessId, "MutationScope", "Blocked", "EXECUTION_PLAN_MISSING", "Execution plan is required before mutation scope checks.");
  const scope = input.roleContext?.allowedMutationScope ?? [];
  if (scope.length === 0 || scope.some((entry) => entry.trim().length === 0)) {
    return createCheck(readinessId, "MutationScope", "Blocked", "MUTATION_SCOPE_MISSING", "Mutation scope signals are missing.");
  }
  if (!sameOrderedStrings(scope, plan.allowedMutationScope) || scope.some(isUnsafeMutationScope)) {
    return createCheck(readinessId, "MutationScope", "Blocked", "MUTATION_SCOPE_UNSAFE", "Mutation scope is unsafe or no longer matches the plan.");
  }
  return createCheck(readinessId, "MutationScope", "Passed", "READY", "Mutation scope remains bounded and non-runtime.");
}

function findActiveSession(
  activeSessions: ExecutionReadinessEvaluationInput["activeSessions"],
  activeSessionId: string,
): ActiveSessionLike | undefined {
  return Object.values(activeSessions ?? {}).flat().find((session) => session.id === activeSessionId);
}

function getStatus(checks: ReadonlyArray<ExecutionReadinessCheck>): ExecutionReadinessStatus {
  if (checks.some((check) => check.status === "Failed")) return "Failed";
  if (checks.some((check) => check.status === "Blocked")) return "Blocked";
  return "Ready";
}

function createCheck(
  readinessId: string,
  category: ExecutionReadinessCheckCategory,
  status: ExecutionReadinessCheck["status"],
  reason: ExecutionReadinessReasonCode,
  message: string,
): ExecutionReadinessCheck {
  return {
    checkId: createExecutionReadinessCheckId(readinessId, category),
    category,
    status,
    reason,
    message,
  };
}

function sameOrderedStrings(left: ReadonlyArray<string>, right: ReadonlyArray<string>) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isUnsafeMutationScope(entry: string) {
  const normalized = entry.toLowerCase();
  if (normalized.startsWith("no-")) return false;
  return /(github|remote|push|runtime|subprocess|execution|codex|claude)/.test(normalized);
}
