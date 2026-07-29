import { parsePromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentService";
import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask, TaskActivity, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import {
  ACTIVE_WORK_SESSION_RULESET_VERSION,
  copyActiveWorkSessionRecord,
  copyActiveWorkSessionStartResult,
  createActiveWorkSessionId,
  createActiveWorkSessionStartResultCollection,
  createActiveWorkSessionStartResultId,
  type ActiveWorkSessionRecord,
  type ActiveWorkSessionStartInput,
  type ActiveWorkSessionStartOutcome,
  type ActiveWorkSessionStartReasonCode,
  type ActiveWorkSessionStartResult,
  type ActiveWorkSessionStartResultCollection,
  type ActiveWorkSessionStartStatus,
} from "./ActiveWorkSessionTypes";

export class ActiveWorkSessionStartService {
  start(input: ActiveWorkSessionStartInput): ActiveWorkSessionStartOutcome {
    const { request } = input;
    const base = createBaseResult(request.projectId, request.projectTaskId, request.preparedSessionId, request.requestedAt);

    if (!request.projectId || !request.projectTaskId || !request.preparedSessionId) {
      return { result: blocked(base, "Failed", ["PROJECT_MISMATCH"]) };
    }

    if (!input.taskCollection || input.taskCollection.projectId !== request.projectId) {
      return {
        result: blocked(base, input.taskCollection ? "Ineligible" : "Unavailable", [
          input.taskCollection ? "PROJECT_MISMATCH" : "TASK_COLLECTION_UNAVAILABLE",
        ]),
      };
    }

    if (input.activeSessions === undefined) {
      return { result: blocked(base, "Unavailable", ["ACTIVE_SESSION_STORE_UNAVAILABLE"]) };
    }

    const preparedSession = input.preparedSessions?.[request.preparedSessionId];
    if (!preparedSession) return { result: blocked(base, "Unavailable", ["PREPARED_SESSION_NOT_FOUND"]) };

    const task = input.taskCollection.tasks.find((item) => item.projectId === request.projectId && item.id === request.projectTaskId);
    if (!task) return { result: blocked(withPrepared(base, preparedSession), "Ineligible", ["TASK_NOT_FOUND"]) };

    const taskProvenance = parsePromotedProjectTaskProvenance(task.description);
    if (!taskProvenance || taskProvenance.projectId !== request.projectId || !taskProvenance.candidateTaskId) {
      return { result: blocked(withPrepared(base, preparedSession), "Ineligible", ["MALFORMED_PROVENANCE"]) };
    }

    const preparedBlock = getPreparedSessionBlockReason(preparedSession, request, taskProvenance);
    if (preparedBlock) {
      return { result: blocked(withPrepared(base, preparedSession), "Ineligible", [preparedBlock]) };
    }

    const assignment = input.confirmedAssignments?.[preparedSession.confirmedAssignmentId];
    if (!assignment) return { result: blocked(withPrepared(base, preparedSession), "Unavailable", ["CONFIRMED_ASSIGNMENT_MISSING"]) };

    const assignmentBlock = getConfirmedAssignmentBlockReason(assignment, preparedSession, task);
    if (assignmentBlock) {
      return { result: blocked(withPrepared(base, preparedSession, assignment), "Ineligible", [assignmentBlock]) };
    }

    if (!input.employees) {
      return { result: blocked(withPrepared(base, preparedSession, assignment), "Unavailable", ["EMPLOYEE_REGISTRY_UNAVAILABLE"]) };
    }
    const employee = input.employees.find((item) => item.id === preparedSession.employeeId);
    if (!employee) return { result: blocked(withPrepared(base, preparedSession, assignment), "Unavailable", ["EMPLOYEE_MISSING"]) };

    const activeSessionId = createActiveWorkSessionId(request.projectId, request.projectTaskId, request.preparedSessionId);
    const existingSession = findExistingActiveSession(input.activeSessions, activeSessionId);
    const hasExistingSession = Boolean(existingSession);

    const taskBlock = hasExistingSession
      ? getAlreadyStartedTaskBlockReason(task, preparedSession)
      : getStartableTaskBlockReason(task, preparedSession);
    if (taskBlock) {
      const status: ActiveWorkSessionStartStatus = taskBlock === "TASK_ASSIGNEE_MISMATCH" ? "Conflict" : "Ineligible";
      return { result: blocked(withPrepared(base, preparedSession, assignment, employee), status, [taskBlock]) };
    }

    const employeeBlock = hasExistingSession
      ? getAlreadyStartedEmployeeBlockReason(employee, task.id)
      : getStartableEmployeeBlockReason(employee, input.activeSessions, task.id);
    if (employeeBlock) {
      return {
        result: blocked(
          withPrepared(base, preparedSession, assignment, employee),
          employeeBlock === "EMPLOYEE_UNAVAILABLE" ? "Unavailable" : "Conflict",
          [employeeBlock],
        ),
      };
    }

    if (existingSession) {
      const sessionBlock = getExistingActiveSessionBlockReason(existingSession, preparedSession, task, assignment, employee);
      if (sessionBlock) {
        return { result: blocked(withPrepared(base, preparedSession, assignment, employee), "Conflict", [sessionBlock]) };
      }

      return {
        result: {
          ...withPrepared(base, preparedSession, assignment, employee),
          activeSessionId,
          status: "AlreadyStarted",
          reasonCodes: ["ALREADY_STARTED"],
          started: true,
          duplicateExistingSession: true,
          humanStarted: true,
          active: true,
          workStarted: true,
        },
        activeSession: normalizeExistingActiveSession(existingSession, preparedSession, task, assignment, employee),
      };
    }

    const conflictingSession = findConflictingActiveSession(input.activeSessions, preparedSession, task.id);
    if (conflictingSession) {
      return { result: blocked(withPrepared(base, preparedSession, assignment, employee), "Conflict", ["ACTIVE_SESSION_CONFLICT"]) };
    }

    const activeSession = createActiveSessionRecord(task, preparedSession, assignment, employee, request.requestedAt);
    const activity = createStartActivity(task, activeSession, employee, request.requestedAt);
    const updatedTask = appendStartActivity({
      ...copyProjectTask(task),
      status: "In Progress",
      updatedAt: request.requestedAt,
    }, activity);
    const updatedEmployees = input.employees.map((item) =>
      item.id === employee.id
        ? {
            ...copyEmployee(item),
            status: "Working" as const,
            assignedTaskId: task.id,
            currentProjectId: task.projectId,
          }
        : copyEmployee(item)
    );
    const updatedTaskCollection = {
      projectId: input.taskCollection.projectId,
      tasks: input.taskCollection.tasks.map((item) => item.id === task.id ? updatedTask : copyProjectTask(item)),
    };
    const updatedActiveSessions = upsertActiveSession(input.activeSessions, task.id, activeSession);

    return {
      result: {
        ...withPrepared(base, preparedSession, assignment, employee),
        activeSessionId: activeSession.id,
        status: "Started",
        reasonCodes: ["STARTED"],
        started: true,
        duplicateExistingSession: false,
        humanStarted: true,
        active: true,
        workStarted: true,
      },
      activeSession,
      taskCollection: updatedTaskCollection,
      employees: updatedEmployees,
      activeSessions: updatedActiveSessions,
    };
  }

  upsertResult(
    collection: ActiveWorkSessionStartResultCollection | undefined,
    result: ActiveWorkSessionStartResult,
  ): ActiveWorkSessionStartResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createActiveWorkSessionStartResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesetVersion: ACTIVE_WORK_SESSION_RULESET_VERSION,
    });
  }
}

function createBaseResult(
  projectId: string,
  projectTaskId: string,
  preparedSessionId: string | undefined,
  resultAt: string,
): ActiveWorkSessionStartResult {
  return {
    id: createActiveWorkSessionStartResultId(projectId, projectTaskId, preparedSessionId ?? "unknown-prepared-session"),
    projectId,
    projectTaskId,
    preparedSessionId,
    status: "Failed",
    reasonCodes: [],
    started: false,
    duplicateExistingSession: false,
    humanStarted: false,
    active: false,
    workStarted: false,
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt,
    rulesetVersion: ACTIVE_WORK_SESSION_RULESET_VERSION,
  };
}

function withPrepared(
  base: ActiveWorkSessionStartResult,
  preparedSession: PreparedWorkSessionRecord,
  assignment?: ConfirmedEmployeeAssignmentRecord,
  employee?: Employee,
): ActiveWorkSessionStartResult {
  return {
    ...base,
    preparedSessionId: preparedSession.id,
    confirmedAssignmentId: preparedSession.confirmedAssignmentId,
    candidateTaskId: preparedSession.candidateTaskId,
    employeeId: preparedSession.employeeId,
    employeeDisplayName: employee?.name ?? assignment?.employeeDisplayName ?? preparedSession.employeeDisplayName,
  };
}

function blocked(
  base: ActiveWorkSessionStartResult,
  status: ActiveWorkSessionStartStatus,
  reasonCodes: ActiveWorkSessionStartReasonCode[],
) {
  return copyActiveWorkSessionStartResult({
    ...base,
    status,
    reasonCodes,
    started: false,
    duplicateExistingSession: false,
    humanStarted: false,
    active: false,
    workStarted: false,
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function getPreparedSessionBlockReason(
  preparedSession: PreparedWorkSessionRecord,
  request: ActiveWorkSessionStartInput["request"],
  taskProvenance: NonNullable<ReturnType<typeof parsePromotedProjectTaskProvenance>>,
): ActiveWorkSessionStartReasonCode | undefined {
  if (
    preparedSession.id !== request.preparedSessionId ||
    preparedSession.projectId !== request.projectId ||
    preparedSession.projectTaskId !== request.projectTaskId ||
    preparedSession.candidateTaskId !== taskProvenance.candidateTaskId ||
    preparedSession.assignmentRecommendationId !== taskProvenance.assignmentRecommendationId ||
    preparedSession.promotionDecisionId !== taskProvenance.promotionDecisionId ||
    !preparedSession.humanPrepared ||
    preparedSession.status !== "Prepared"
  ) return "PREPARED_SESSION_STALE";
  if (preparedSession.active) return "PREPARED_SESSION_ALREADY_ACTIVE";
  if (preparedSession.workStarted) return "PREPARED_SESSION_WORK_STARTED";
  if (preparedSession.executionStarted) return "PREPARED_SESSION_EXECUTION_STARTED";
  if (preparedSession.agentStarted) return "PREPARED_SESSION_AGENT_STARTED";
  if (preparedSession.repositoryMutationStarted) return "PREPARED_SESSION_REPOSITORY_MUTATION_STARTED";
  if (preparedSession.githubMutationStarted) return "PREPARED_SESSION_GITHUB_MUTATION_STARTED";
  return undefined;
}

function getConfirmedAssignmentBlockReason(
  assignment: ConfirmedEmployeeAssignmentRecord,
  preparedSession: PreparedWorkSessionRecord,
  task: ProjectTask,
): ActiveWorkSessionStartReasonCode | undefined {
  if (
    assignment.id !== preparedSession.confirmedAssignmentId ||
    assignment.projectId !== preparedSession.projectId ||
    assignment.projectTaskId !== preparedSession.projectTaskId ||
    assignment.candidateTaskId !== preparedSession.candidateTaskId ||
    assignment.assignmentRecommendationId !== preparedSession.assignmentRecommendationId ||
    assignment.promotionDecisionId !== preparedSession.promotionDecisionId ||
    assignment.employeeId !== preparedSession.employeeId ||
    task.assigneeId !== assignment.employeeId
  ) return "CONFIRMED_ASSIGNMENT_STALE";
  if (!assignment.humanConfirmed) return "CONFIRMED_ASSIGNMENT_NOT_HUMAN_CONFIRMED";
  return undefined;
}

function getStartableTaskBlockReason(
  task: ProjectTask,
  preparedSession: PreparedWorkSessionRecord,
): ActiveWorkSessionStartReasonCode | undefined {
  if (task.status === "Done") return "TASK_COMPLETED";
  if (task.status !== "Todo") return "TASK_ALREADY_STARTED";
  if (!task.assigneeId) return "TASK_UNASSIGNED";
  if (task.assigneeId !== preparedSession.employeeId || (task.assignee && task.assignee !== preparedSession.employeeDisplayName)) {
    return "TASK_ASSIGNEE_MISMATCH";
  }
  return undefined;
}

function getAlreadyStartedTaskBlockReason(
  task: ProjectTask,
  preparedSession: PreparedWorkSessionRecord,
): ActiveWorkSessionStartReasonCode | undefined {
  if (task.status === "Done") return "TASK_COMPLETED";
  if (!task.assigneeId) return "TASK_UNASSIGNED";
  if (task.assigneeId !== preparedSession.employeeId || (task.assignee && task.assignee !== preparedSession.employeeDisplayName)) {
    return "TASK_ASSIGNEE_MISMATCH";
  }
  if (task.status !== "In Progress") return "TASK_ALREADY_STARTED";
  return undefined;
}

function getStartableEmployeeBlockReason(
  employee: Employee,
  activeSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  selectedTaskId: string,
): ActiveWorkSessionStartReasonCode | undefined {
  if (employee.status === "Offline") return "EMPLOYEE_UNAVAILABLE";
  if (employee.status !== "Idle") return "EMPLOYEE_CONFLICT";
  if (employee.assignedTaskId && employee.assignedTaskId !== selectedTaskId) return "EMPLOYEE_CONFLICT";
  const activeSession = Object.values(activeSessions).flat().find((session) =>
    session.employeeId === employee.id &&
    (session.status === "queued" || session.status === "running")
  );
  if (activeSession) return "EMPLOYEE_CONFLICT";
  return undefined;
}

function getAlreadyStartedEmployeeBlockReason(
  employee: Employee,
  selectedTaskId: string,
): ActiveWorkSessionStartReasonCode | undefined {
  if (employee.status === "Offline") return "EMPLOYEE_UNAVAILABLE";
  if (employee.status !== "Working") return "EMPLOYEE_CONFLICT";
  if (employee.assignedTaskId !== selectedTaskId) return "EMPLOYEE_CONFLICT";
  return undefined;
}

function getExistingActiveSessionBlockReason(
  session: WorkSession,
  preparedSession: PreparedWorkSessionRecord,
  task: ProjectTask,
  assignment: ConfirmedEmployeeAssignmentRecord,
  employee: Employee,
): ActiveWorkSessionStartReasonCode | undefined {
  if (
    session.taskId !== task.id ||
    session.projectId !== task.projectId ||
    session.employeeId !== employee.id ||
    session.employeeName !== employee.name ||
    assignment.employeeId !== session.employeeId
  ) return "ACTIVE_SESSION_CONFLICT";
  if (session.status !== "running" && session.status !== "queued") return "ACTIVE_SESSION_CONFLICT";
  const activeSession = session as Partial<ActiveWorkSessionRecord>;
  if (
    activeSession.preparedSessionId && activeSession.preparedSessionId !== preparedSession.id
  ) return "ACTIVE_SESSION_CONFLICT";
  if (
    activeSession.confirmedAssignmentId && activeSession.confirmedAssignmentId !== assignment.id
  ) return "ACTIVE_SESSION_CONFLICT";
  return undefined;
}

function findExistingActiveSession(
  activeSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  activeSessionId: string,
) {
  return Object.values(activeSessions).flat().find((session) => session.id === activeSessionId);
}

function findConflictingActiveSession(
  activeSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  preparedSession: PreparedWorkSessionRecord,
  taskId: string,
) {
  return Object.values(activeSessions).flat().find((session) =>
    (session.status === "queued" || session.status === "running") &&
    (
      session.taskId === taskId ||
      session.employeeId === preparedSession.employeeId ||
      (session as Partial<ActiveWorkSessionRecord>).preparedSessionId === preparedSession.id
    )
  );
}

function createActiveSessionRecord(
  task: ProjectTask,
  preparedSession: PreparedWorkSessionRecord,
  assignment: ConfirmedEmployeeAssignmentRecord,
  employee: Employee,
  startedAt: string,
): ActiveWorkSessionRecord {
  const taskProvenance = parsePromotedProjectTaskProvenance(task.description)!;
  const id = createActiveWorkSessionId(task.projectId, task.id, preparedSession.id);
  const activityId = createStartActivityId(task.id, id);
  return {
    id,
    taskId: task.id,
    projectTaskId: task.id,
    projectId: task.projectId,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeDisplayName: employee.name,
    provider: "placeholder",
    status: "running",
    startedAt,
    preparedSessionId: preparedSession.id,
    confirmedAssignmentId: assignment.id,
    candidateTaskId: preparedSession.candidateTaskId,
    assignmentRecommendationId: preparedSession.assignmentRecommendationId,
    promotionDecisionId: preparedSession.promotionDecisionId,
    startSource: "Human",
    reasonCodes: ["STARTED"],
    rulesetVersion: ACTIVE_WORK_SESSION_RULESET_VERSION,
    taskStatusAtStart: task.status,
    assignmentProvenance: { ...assignment.recommendationProvenance },
    preparationProvenance: {
      preparedSessionId: preparedSession.id,
      preparedAt: preparedSession.preparedAt,
      rulesetVersion: preparedSession.rulesetVersion,
      humanPrepared: preparedSession.humanPrepared,
    },
    taskProvenance,
    humanStarted: true,
    active: true,
    workStarted: true,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    activityIds: [activityId],
  };
}

function normalizeExistingActiveSession(
  session: WorkSession,
  preparedSession: PreparedWorkSessionRecord,
  task: ProjectTask,
  assignment: ConfirmedEmployeeAssignmentRecord,
  employee: Employee,
): ActiveWorkSessionRecord {
  const partial = session as Partial<ActiveWorkSessionRecord>;
  return copyActiveWorkSessionRecord({
    ...createActiveSessionRecord(task, preparedSession, assignment, employee, session.startedAt),
    ...partial,
    id: session.id,
    taskId: session.taskId,
    projectTaskId: task.id,
    projectId: session.projectId,
    employeeId: session.employeeId,
    employeeName: session.employeeName,
    employeeDisplayName: partial.employeeDisplayName ?? employee.name,
    status: "running",
    reasonCodes: ["ALREADY_STARTED"],
    activityIds: session.activityIds ? [...session.activityIds] : partial.activityIds,
  });
}

function createStartActivity(
  task: ProjectTask,
  activeSession: ActiveWorkSessionRecord,
  employee: Employee,
  startedAt: string,
): TaskActivity {
  return {
    id: createStartActivityId(task.id, activeSession.id),
    taskId: task.id,
    type: "work_started",
    message: `Work session active for ${employee.name}. Agent execution not started. No repository mutation.`,
    createdAt: startedAt,
    actorId: employee.id,
    actorName: employee.name,
  };
}

function createStartActivityId(taskId: string, activeSessionId: string) {
  return `${taskId}-work-session-started-${activeSessionId}`;
}

function appendStartActivity(task: ProjectTask, activity: TaskActivity): ProjectTask {
  const existingLog = task.activityLog ?? [];
  const activityLog = existingLog.some((item) => item.id === activity.id)
    ? existingLog.map((item) => item.id === activity.id ? { ...item } : { ...item })
    : [activity, ...existingLog.map((item) => ({ ...item }))];
  return {
    ...task,
    activityLog,
  };
}

function upsertActiveSession(
  activeSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  taskId: string,
  activeSession: ActiveWorkSessionRecord,
): Record<string, WorkSession[]> {
  const next = Object.fromEntries(
    Object.entries(activeSessions).map(([existingTaskId, sessions]) => [
      existingTaskId,
      sessions.map(copyWorkSession),
    ]),
  );
  const taskSessions = next[taskId] ?? [];
  next[taskId] = taskSessions.some((session) => session.id === activeSession.id)
    ? taskSessions.map((session) => session.id === activeSession.id ? copyActiveWorkSessionRecord(activeSession) : session)
    : [copyActiveWorkSessionRecord(activeSession), ...taskSessions];
  return next;
}

function copyProjectTask(task: ProjectTask): ProjectTask {
  return {
    ...task,
    activityLog: task.activityLog?.map((activity) => ({ ...activity })),
  };
}

function copyEmployee(employee: Employee): Employee {
  return {
    ...employee,
    capabilities: [...employee.capabilities],
    ...(employee.schedule ? { schedule: { ...employee.schedule } } : {}),
  };
}

function copyWorkSession(session: WorkSession): WorkSession {
  return {
    ...session,
    ...(session.activityIds ? { activityIds: [...session.activityIds] } : {}),
  };
}
