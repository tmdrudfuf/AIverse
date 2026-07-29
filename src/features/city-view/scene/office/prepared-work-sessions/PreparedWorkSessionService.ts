import { parsePromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentService";
import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import {
  PREPARED_WORK_SESSION_RULESET_VERSION,
  copyPreparedWorkSessionRecord,
  copyPreparedWorkSessionResult,
  createPreparedWorkSessionId,
  createPreparedWorkSessionResultCollection,
  createPreparedWorkSessionResultId,
  type PreparedWorkSessionInput,
  type PreparedWorkSessionOutcome,
  type PreparedWorkSessionReasonCode,
  type PreparedWorkSessionRecord,
  type PreparedWorkSessionResult,
  type PreparedWorkSessionResultCollection,
  type PreparedWorkSessionStatus,
} from "./PreparedWorkSessionTypes";

export class PreparedWorkSessionService {
  prepare(input: PreparedWorkSessionInput): PreparedWorkSessionOutcome {
    const { request } = input;
    const base = createBaseResult(request.projectId, request.projectTaskId, request.confirmedAssignmentId, request.requestedAt);

    if (!request.projectId || !request.projectTaskId || !request.confirmedAssignmentId) {
      return { result: blocked(base, "Failed", ["PROJECT_MISMATCH"]) };
    }

    if (!input.taskCollection || input.taskCollection.projectId !== request.projectId) {
      return {
        result: blocked(base, input.taskCollection ? "Ineligible" : "Unavailable", [
          input.taskCollection ? "PROJECT_MISMATCH" : "TASK_COLLECTION_UNAVAILABLE",
        ]),
      };
    }

    const task = input.taskCollection.tasks.find((item) => item.projectId === request.projectId && item.id === request.projectTaskId);
    if (!task) return { result: blocked(base, "Ineligible", ["TASK_NOT_FOUND"]) };

    const provenance = parsePromotedProjectTaskProvenance(task.description);
    if (!provenance || provenance.projectId !== request.projectId || !provenance.candidateTaskId) {
      return { result: blocked(base, "Ineligible", ["MALFORMED_PROVENANCE"]) };
    }

    if (input.existingPreparedSessions === undefined) {
      return {
        result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["PREPARED_SESSION_STORE_UNAVAILABLE"]),
      };
    }

    const existingSessionId = createPreparedWorkSessionId(request.projectId, request.projectTaskId, request.confirmedAssignmentId);
    const existingSession = input.existingPreparedSessions[existingSessionId];
    if (existingSession) {
      return {
        result: {
          ...base,
          employeeId: existingSession.employeeId,
          employeeDisplayName: existingSession.employeeDisplayName,
          preparedSessionId: existingSession.id,
          status: "AlreadyPrepared",
          reasonCodes: ["ALREADY_PREPARED"],
          prepared: true,
          duplicateExistingPreparation: true,
          humanPrepared: true,
        },
        preparedSession: copyPreparedWorkSessionRecord({
          ...existingSession,
          status: "AlreadyPrepared",
          reasonCodes: ["ALREADY_PREPARED"],
        }),
      };
    }

    const assignment = input.confirmedAssignments?.[request.confirmedAssignmentId];
    if (!assignment) return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["CONFIRMED_ASSIGNMENT_MISSING"]) };

    const staleAssignmentReason = getConfirmedAssignmentBlockReason(assignment, request, provenance, task);
    if (staleAssignmentReason) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId, employeeId: assignment.employeeId }, "Ineligible", [staleAssignmentReason]) };
    }

    const taskBlockReason = getTaskBlockReason(task, assignment);
    if (taskBlockReason) {
      const status: PreparedWorkSessionStatus = taskBlockReason === "TASK_ASSIGNEE_MISMATCH" ? "Conflict" : "Ineligible";
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId, employeeId: assignment.employeeId }, status, [taskBlockReason]) };
    }

    if (!input.employees) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId, employeeId: assignment.employeeId }, "Unavailable", ["EMPLOYEE_REGISTRY_UNAVAILABLE"]) };
    }
    const employee = input.employees.find((item) => item.id === assignment.employeeId);
    if (!employee) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId, employeeId: assignment.employeeId }, "Unavailable", ["EMPLOYEE_MISSING"]) };
    }

    const employeeBlock = getEmployeeBlockReason(employee, input.workSessions ?? {}, task.id);
    if (employeeBlock) {
      return {
        result: blocked(
          { ...base, candidateTaskId: provenance.candidateTaskId, employeeId: assignment.employeeId, employeeDisplayName: employee.name },
          employeeBlock === "EMPLOYEE_UNAVAILABLE" ? "Unavailable" : "Conflict",
          [employeeBlock],
        ),
      };
    }

    const record = createPreparedSessionRecord(task, assignment, employee, request.requestedAt);
    return {
      result: {
        ...base,
        employeeId: assignment.employeeId,
        employeeDisplayName: employee.name,
        preparedSessionId: record.id,
        status: "Prepared",
        reasonCodes: ["PREPARED"],
        prepared: true,
        duplicateExistingPreparation: false,
        humanPrepared: true,
      },
      preparedSession: record,
    };
  }

  upsertRecord(
    records: Readonly<Record<string, PreparedWorkSessionRecord>>,
    record: PreparedWorkSessionRecord,
  ): Record<string, PreparedWorkSessionRecord> {
    return {
      ...Object.fromEntries(
        Object.entries(records).map(([id, existing]) => [id, copyPreparedWorkSessionRecord(existing)]),
      ),
      [record.id]: copyPreparedWorkSessionRecord(record),
    };
  }

  upsertResult(
    collection: PreparedWorkSessionResultCollection | undefined,
    result: PreparedWorkSessionResult,
  ): PreparedWorkSessionResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createPreparedWorkSessionResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    });
  }
}

function createBaseResult(
  projectId: string,
  projectTaskId: string,
  confirmedAssignmentId: string | undefined,
  resultAt: string,
): PreparedWorkSessionResult {
  return {
    id: createPreparedWorkSessionResultId(projectId, projectTaskId),
    projectId,
    projectTaskId,
    confirmedAssignmentId,
    status: "Failed",
    reasonCodes: [],
    prepared: false,
    duplicateExistingPreparation: false,
    humanPrepared: false,
    active: false,
    workStarted: false,
    executionStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt,
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
  };
}

function blocked(
  base: PreparedWorkSessionResult,
  status: PreparedWorkSessionStatus,
  reasonCodes: PreparedWorkSessionReasonCode[],
) {
  return copyPreparedWorkSessionResult({
    ...base,
    status,
    reasonCodes,
    prepared: false,
    duplicateExistingPreparation: false,
    humanPrepared: false,
    active: false,
    workStarted: false,
    executionStarted: false,
    employeeMoved: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  });
}

function getConfirmedAssignmentBlockReason(
  assignment: ConfirmedEmployeeAssignmentRecord,
  request: PreparedWorkSessionInput["request"],
  provenance: NonNullable<ReturnType<typeof parsePromotedProjectTaskProvenance>>,
  task: ProjectTask,
): PreparedWorkSessionReasonCode | undefined {
  if (
    assignment.id !== request.confirmedAssignmentId ||
    assignment.projectId !== request.projectId ||
    assignment.projectTaskId !== request.projectTaskId ||
    assignment.candidateTaskId !== provenance.candidateTaskId ||
    assignment.assignmentRecommendationId !== provenance.assignmentRecommendationId ||
    assignment.promotionDecisionId !== provenance.promotionDecisionId ||
    task.assigneeId !== assignment.employeeId
  ) return "CONFIRMED_ASSIGNMENT_STALE";
  if (!assignment.humanConfirmed) return "CONFIRMED_ASSIGNMENT_NOT_HUMAN_CONFIRMED";
  if (assignment.workStarted) return "CONFIRMED_ASSIGNMENT_WORK_STARTED";
  if (assignment.workSessionCreated) return "CONFIRMED_ASSIGNMENT_SESSION_CREATED";
  if (assignment.executionStarted) return "CONFIRMED_ASSIGNMENT_EXECUTION_STARTED";
  return undefined;
}

function getTaskBlockReason(
  task: ProjectTask,
  assignment: ConfirmedEmployeeAssignmentRecord,
): PreparedWorkSessionReasonCode | undefined {
  if (task.status === "Done") return "TASK_COMPLETED";
  if (task.status !== "Todo") return "TASK_ALREADY_STARTED";
  if (!task.assigneeId) return "TASK_UNASSIGNED";
  if (task.assigneeId !== assignment.employeeId || (task.assignee && task.assignee !== assignment.employeeDisplayName)) {
    return "TASK_ASSIGNEE_MISMATCH";
  }
  return undefined;
}

function getEmployeeBlockReason(
  employee: Employee,
  workSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  selectedTaskId: string,
): PreparedWorkSessionReasonCode | undefined {
  if (employee.status === "Offline") return "EMPLOYEE_UNAVAILABLE";
  if (employee.status !== "Idle") return "EMPLOYEE_CONFLICT";
  if (employee.assignedTaskId && employee.assignedTaskId !== selectedTaskId) return "EMPLOYEE_CONFLICT";
  const activeSession = Object.values(workSessions).flat().find((session) =>
    session.employeeId === employee.id &&
    (session.status === "queued" || session.status === "running")
  );
  if (activeSession) return "EMPLOYEE_CONFLICT";
  return undefined;
}

function createPreparedSessionRecord(
  task: ProjectTask,
  assignment: ConfirmedEmployeeAssignmentRecord,
  employee: Employee,
  preparedAt: string,
): PreparedWorkSessionRecord {
  const taskProvenance = parsePromotedProjectTaskProvenance(task.description)!;
  return {
    id: createPreparedWorkSessionId(task.projectId, task.id, assignment.id),
    projectId: task.projectId,
    projectTaskId: task.id,
    candidateTaskId: assignment.candidateTaskId,
    confirmedAssignmentId: assignment.id,
    assignmentRecommendationId: assignment.assignmentRecommendationId,
    promotionDecisionId: assignment.promotionDecisionId,
    employeeId: assignment.employeeId,
    employeeDisplayName: employee.name,
    status: "Prepared",
    preparationSource: "Human",
    reasonCodes: ["PREPARED"],
    preparedAt,
    rulesetVersion: PREPARED_WORK_SESSION_RULESET_VERSION,
    taskStatusAtPreparation: task.status,
    assignmentProvenance: { ...assignment.recommendationProvenance },
    taskProvenance,
    humanPrepared: true,
    workStarted: false,
    active: false,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}
