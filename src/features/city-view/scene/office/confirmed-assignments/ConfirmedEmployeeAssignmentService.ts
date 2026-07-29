import type { CandidateAssignmentRecommendation } from "../candidate-assignments/CandidateAssignmentTypes";
import { CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION } from "../candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask, TaskActivity, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import {
  CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  copyConfirmedEmployeeAssignmentRecord,
  copyConfirmedEmployeeAssignmentResult,
  createConfirmedEmployeeAssignmentRecordId,
  createConfirmedEmployeeAssignmentResultCollection,
  createConfirmedEmployeeAssignmentResultId,
  type ConfirmedEmployeeAssignmentInput,
  type ConfirmedEmployeeAssignmentOutcome,
  type ConfirmedEmployeeAssignmentReasonCode,
  type ConfirmedEmployeeAssignmentRecord,
  type ConfirmedEmployeeAssignmentResult,
  type ConfirmedEmployeeAssignmentResultCollection,
  type ConfirmedEmployeeAssignmentStatus,
  type PromotedProjectTaskProvenance,
} from "./ConfirmedEmployeeAssignmentTypes";

const ASSIGNMENT_ACTIVITY_TYPE: TaskActivity["type"] = "employee_assigned";

export class ConfirmedEmployeeAssignmentService {
  confirm(input: ConfirmedEmployeeAssignmentInput): ConfirmedEmployeeAssignmentOutcome {
    const { request } = input;
    const base = createBaseResult(request.projectId, request.projectTaskId, request.employeeId, request.requestedAt);

    if (!request.projectId || !request.projectTaskId || !request.assignmentRecommendationId || !request.employeeId) {
      return { result: blocked(base, "Failed", ["PROJECT_MISMATCH"]) };
    }

    if (!input.taskCollection || input.taskCollection.projectId !== request.projectId) {
      return { result: blocked(base, input.taskCollection ? "Ineligible" : "Unavailable", [
        input.taskCollection ? "PROJECT_MISMATCH" : "TASK_COLLECTION_UNAVAILABLE",
      ]) };
    }

    const task = input.taskCollection.tasks.find((item) =>
      item.projectId === request.projectId && item.id === request.projectTaskId
    );
    if (!task) return { result: blocked(base, "Ineligible", ["TASK_NOT_FOUND"]) };

    const provenance = parsePromotedProjectTaskProvenance(task.description);
    if (!provenance || provenance.projectId !== request.projectId || !provenance.candidateTaskId) {
      return { result: blocked(base, "Ineligible", ["MALFORMED_PROVENANCE"]) };
    }

    const existingRecordId = createConfirmedEmployeeAssignmentRecordId(
      request.projectId,
      request.projectTaskId,
      request.employeeId,
    );
    const existingRecord = input.existingAssignments?.[existingRecordId];
    if (existingRecord && isTaskAssignedToEmployee(task, request.employeeId, existingRecord.employeeDisplayName)) {
      return {
        result: {
          ...base,
          candidateTaskId: provenance.candidateTaskId,
          employeeDisplayName: existingRecord.employeeDisplayName,
          assignmentRecordId: existingRecord.id,
          status: "AlreadyAssigned",
          reasonCodes: ["ALREADY_ASSIGNED"],
          assignedTask: true,
          humanConfirmed: true,
          duplicateExistingAssignment: true,
        },
        assignmentRecord: copyConfirmedEmployeeAssignmentRecord({
          ...existingRecord,
          status: "AlreadyAssigned",
          reasonCodes: ["ALREADY_ASSIGNED"],
        }),
        taskCollection: copyTaskCollection(input.taskCollection),
      };
    }

    if (task.status === "Done") {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Ineligible", ["TASK_COMPLETED"]) };
    }
    if (task.status !== "Todo") {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Ineligible", ["TASK_ALREADY_STARTED"]) };
    }
    if (task.assignee || task.assigneeId) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Conflict", ["TASK_ALREADY_ASSIGNED"]) };
    }

    if (!input.assignments || input.assignments.recommendationStatus !== "Succeeded") {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["RECOMMENDATION_MISSING"]) };
    }
    if (input.assignments.projectId !== request.projectId) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Ineligible", ["PROJECT_MISMATCH"]) };
    }

    const recommendation = input.assignments.recommendations.find((item) => item.id === request.assignmentRecommendationId);
    if (!recommendation) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["RECOMMENDATION_MISSING"]) };
    }
    if (!isRecommendationCurrent(recommendation, request, provenance)) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Ineligible", ["RECOMMENDATION_STALE"]) };
    }
    if (recommendation.assignmentStatus !== "Recommended" || recommendation.recommendedEmployeeId !== request.employeeId) {
      return {
        result: blocked(
          { ...base, candidateTaskId: provenance.candidateTaskId },
          "Ineligible",
          [recommendation.assignmentStatus === "Recommended" ? "RECOMMENDATION_STALE" : "RECOMMENDATION_NOT_RECOMMENDED"],
        ),
      };
    }

    if (!input.employees) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["EMPLOYEE_REGISTRY_UNAVAILABLE"]) };
    }
    const employee = input.employees.find((item) => item.id === request.employeeId);
    if (!employee) {
      return { result: blocked({ ...base, candidateTaskId: provenance.candidateTaskId }, "Unavailable", ["EMPLOYEE_MISSING"]) };
    }
    const employeeBlock = getEmployeeBlockReason(employee, input.taskCollection.tasks, input.workSessions ?? {}, task.id);
    if (employeeBlock) {
      return {
        result: blocked(
          { ...base, candidateTaskId: provenance.candidateTaskId },
          employeeBlock === "EMPLOYEE_UNAVAILABLE" ? "Unavailable" : "Conflict",
          [employeeBlock],
        ),
      };
    }

    const record = createAssignmentRecord({
      task,
      employee,
      provenance,
      recommendation,
      requestedAt: request.requestedAt,
    });
    const updatedTask = createAssignedTask(task, employee, request.requestedAt);
    return {
      result: {
        ...base,
        candidateTaskId: provenance.candidateTaskId,
        employeeDisplayName: employee.name,
        assignmentRecordId: record.id,
        status: "Assigned",
        reasonCodes: ["ASSIGNED"],
        assignedTask: true,
        humanConfirmed: true,
        duplicateExistingAssignment: false,
      },
      assignmentRecord: record,
      taskCollection: {
        projectId: input.taskCollection.projectId,
        tasks: input.taskCollection.tasks.map((item) => item.id === task.id ? updatedTask : copyProjectTask(item)),
      },
    };
  }

  upsertRecord(
    records: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>,
    record: ConfirmedEmployeeAssignmentRecord,
  ): Record<string, ConfirmedEmployeeAssignmentRecord> {
    return {
      ...Object.fromEntries(
        Object.entries(records).map(([id, existing]) => [id, copyConfirmedEmployeeAssignmentRecord(existing)]),
      ),
      [record.id]: copyConfirmedEmployeeAssignmentRecord(record),
    };
  }

  upsertResult(
    collection: ConfirmedEmployeeAssignmentResultCollection | undefined,
    result: ConfirmedEmployeeAssignmentResult,
  ): ConfirmedEmployeeAssignmentResultCollection {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return createConfirmedEmployeeAssignmentResultCollection({
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      generatedAt: result.resultAt,
      rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
    });
  }
}

export function parsePromotedProjectTaskProvenance(description: string): PromotedProjectTaskProvenance | undefined {
  const marker = description.match(new RegExp(
    `\\[AIverse Promotion: project=([^;\\]]+);\\s*candidateTask=([^;\\]]+);\\s*ruleset=${escapeRegExp(CANDIDATE_PROJECT_TASK_PROMOTION_RULESET_VERSION)}\\]`,
  ));
  if (!marker?.[1] || !marker[2]) return undefined;

  return {
    projectId: marker[1],
    candidateTaskId: marker[2],
    promotionDecisionId: readDescriptionField(description, "Promotion Decision"),
    assignmentRecommendationId: readDescriptionField(description, "Assignment Recommendation"),
  };
}

function readDescriptionField(description: string, fieldName: string) {
  const line = description.split(/\r?\n/).find((item) => item.startsWith(`${fieldName}: `));
  return line?.slice(fieldName.length + 2).trim() || undefined;
}

function createBaseResult(
  projectId: string,
  projectTaskId: string,
  employeeId: string | undefined,
  resultAt: string,
): ConfirmedEmployeeAssignmentResult {
  return {
    id: createConfirmedEmployeeAssignmentResultId(projectId, projectTaskId),
    projectId,
    projectTaskId,
    employeeId,
    status: "Failed",
    reasonCodes: [],
    assignedTask: false,
    humanConfirmed: false,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    duplicateExistingAssignment: false,
    resultAt,
    rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
  };
}

function blocked(
  base: ConfirmedEmployeeAssignmentResult,
  status: ConfirmedEmployeeAssignmentStatus,
  reasonCodes: ConfirmedEmployeeAssignmentReasonCode[],
) {
  return copyConfirmedEmployeeAssignmentResult({
    ...base,
    status,
    reasonCodes,
    assignedTask: false,
    humanConfirmed: false,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    duplicateExistingAssignment: false,
  });
}

function isRecommendationCurrent(
  recommendation: CandidateAssignmentRecommendation,
  request: ConfirmedEmployeeAssignmentInput["request"],
  provenance: PromotedProjectTaskProvenance,
) {
  return (
    recommendation.id === request.assignmentRecommendationId &&
    recommendation.projectId === request.projectId &&
    recommendation.candidateTaskId === provenance.candidateTaskId &&
    recommendation.provenance.candidateTaskId === provenance.candidateTaskId &&
    provenance.assignmentRecommendationId === recommendation.id
  );
}

function getEmployeeBlockReason(
  employee: Employee,
  tasks: ReadonlyArray<ProjectTask>,
  workSessions: Readonly<Record<string, ReadonlyArray<WorkSession>>>,
  selectedTaskId: string,
): ConfirmedEmployeeAssignmentReasonCode | undefined {
  if (employee.status === "Offline") return "EMPLOYEE_UNAVAILABLE";
  if (employee.status !== "Idle") return "EMPLOYEE_CONFLICT";
  if (employee.assignedTaskId && employee.assignedTaskId !== selectedTaskId) return "EMPLOYEE_CONFLICT";

  const conflictingTask = tasks.find((task) =>
    task.id !== selectedTaskId &&
    task.status !== "Done" &&
    task.assigneeId === employee.id
  );
  if (conflictingTask) return "EMPLOYEE_CONFLICT";

  const conflictingSession = Object.values(workSessions).flat()
    .find((session) =>
      session.employeeId === employee.id &&
      (session.status === "queued" || session.status === "running")
    );
  if (conflictingSession) return "EMPLOYEE_CONFLICT";

  return undefined;
}

function createAssignmentRecord(input: {
  task: ProjectTask;
  employee: Employee;
  provenance: PromotedProjectTaskProvenance;
  recommendation: CandidateAssignmentRecommendation;
  requestedAt: string;
}): ConfirmedEmployeeAssignmentRecord {
  return {
    id: createConfirmedEmployeeAssignmentRecordId(input.task.projectId, input.task.id, input.employee.id),
    projectId: input.task.projectId,
    projectTaskId: input.task.id,
    candidateTaskId: input.provenance.candidateTaskId,
    promotionDecisionId: input.provenance.promotionDecisionId,
    assignmentRecommendationId: input.recommendation.id,
    employeeId: input.employee.id,
    employeeDisplayName: input.employee.name,
    status: "Assigned",
    reasonCodes: ["ASSIGNED"],
    assignmentSource: "Human",
    assignedAt: input.requestedAt,
    rulesetVersion: CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
    taskStatusAtAssignment: input.task.status,
    recommendationProvenance: { ...input.recommendation.provenance },
    humanConfirmed: true,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
  };
}

function createAssignedTask(task: ProjectTask, employee: Employee, assignedAt: string): ProjectTask {
  const activityId = `${task.id}:confirmed-assignment:${employee.id}`;
  const activity: TaskActivity = {
    id: activityId,
    taskId: task.id,
    type: ASSIGNMENT_ACTIVITY_TYPE,
    message: `Assignment confirmed for ${employee.name}. Not started. No work session.`,
    createdAt: assignedAt,
    actorId: employee.id,
    actorName: employee.name,
  };
  const previousActivity = task.activityLog ?? [];
  const activityLog = previousActivity.some((item) => item.id === activityId)
    ? previousActivity.map((item) => ({ ...item }))
    : [activity, ...previousActivity.map((item) => ({ ...item }))];

  return {
    ...task,
    assignee: employee.name,
    assigneeId: employee.id,
    updatedAt: assignedAt,
    activityLog,
  };
}

function isTaskAssignedToEmployee(task: ProjectTask, employeeId: string, _employeeName: string) {
  return task.assigneeId === employeeId;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function copyTaskCollection(collection: { projectId: string; tasks: ReadonlyArray<ProjectTask> }): TaskCollection {
  return {
    projectId: collection.projectId,
    tasks: collection.tasks.map(copyProjectTask),
  };
}

function copyProjectTask(task: ProjectTask): ProjectTask {
  return {
    ...task,
    activityLog: task.activityLog?.map((activity) => ({ ...activity })),
  };
}
