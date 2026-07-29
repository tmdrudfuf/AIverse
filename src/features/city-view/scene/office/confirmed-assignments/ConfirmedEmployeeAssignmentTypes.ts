import type { CandidateAssignmentProvenance } from "../candidate-assignments/CandidateAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";

export const CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION = "confirmed-assignment-v1";

export type ConfirmedEmployeeAssignmentStatus =
  | "Assigned"
  | "AlreadyAssigned"
  | "Ineligible"
  | "Unavailable"
  | "Conflict"
  | "Failed";

export type ConfirmedEmployeeAssignmentReasonCode =
  | "ASSIGNED"
  | "ALREADY_ASSIGNED"
  | "TASK_NOT_FOUND"
  | "TASK_ALREADY_ASSIGNED"
  | "TASK_ALREADY_STARTED"
  | "TASK_COMPLETED"
  | "TASK_COLLECTION_UNAVAILABLE"
  | "RECOMMENDATION_MISSING"
  | "RECOMMENDATION_NOT_RECOMMENDED"
  | "RECOMMENDATION_STALE"
  | "EMPLOYEE_MISSING"
  | "EMPLOYEE_UNAVAILABLE"
  | "EMPLOYEE_CONFLICT"
  | "EMPLOYEE_REGISTRY_UNAVAILABLE"
  | "PROJECT_MISMATCH"
  | "MALFORMED_PROVENANCE";

export type ConfirmedEmployeeAssignmentSource = "Human";

export type ConfirmedEmployeeAssignmentRecord = {
  id: string;
  projectId: string;
  projectTaskId: string;
  candidateTaskId: string;
  promotionDecisionId?: string;
  assignmentRecommendationId: string;
  employeeId: string;
  employeeDisplayName: string;
  status: Extract<ConfirmedEmployeeAssignmentStatus, "Assigned" | "AlreadyAssigned">;
  reasonCodes: ConfirmedEmployeeAssignmentReasonCode[];
  assignmentSource: ConfirmedEmployeeAssignmentSource;
  assignedAt: string;
  rulesetVersion: string;
  taskStatusAtAssignment: ProjectTask["status"];
  recommendationProvenance: CandidateAssignmentProvenance;
  humanConfirmed: true;
  workStarted: false;
  workSessionCreated: false;
  executionStarted: false;
};

export type ConfirmedEmployeeAssignmentResult = {
  id: string;
  projectId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  employeeId?: string;
  assignmentRecordId?: string;
  status: ConfirmedEmployeeAssignmentStatus;
  reasonCodes: ConfirmedEmployeeAssignmentReasonCode[];
  assignedTask: boolean;
  humanConfirmed: boolean;
  workStarted: false;
  workSessionCreated: false;
  executionStarted: false;
  duplicateExistingAssignment: boolean;
  resultAt: string;
  rulesetVersion: string;
};

export type ConfirmedEmployeeAssignmentResultCollection = {
  projectId: string;
  results: ConfirmedEmployeeAssignmentResult[];
  resultCount: number;
  generatedAt?: string;
  rulesetVersion: string;
};

export type ConfirmedEmployeeAssignmentRequest = {
  projectId: string;
  projectTaskId: string;
  assignmentRecommendationId: string;
  employeeId: string;
  requestedAt: string;
};

export type ConfirmedEmployeeAssignmentInput = {
  request: ConfirmedEmployeeAssignmentRequest;
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<ProjectTask>;
  };
  assignments?: CandidateAssignmentRecommendationCollection;
  employees?: ReadonlyArray<Employee>;
  workSessions?: Readonly<Record<string, ReadonlyArray<WorkSession>>>;
  existingAssignments?: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>;
};

export type ConfirmedEmployeeAssignmentOutcome = {
  result: ConfirmedEmployeeAssignmentResult;
  assignmentRecord?: ConfirmedEmployeeAssignmentRecord;
  taskCollection?: {
    projectId: string;
    tasks: ProjectTask[];
  };
};

export type PromotedProjectTaskProvenance = {
  projectId: string;
  candidateTaskId: string;
  promotionDecisionId?: string;
  assignmentRecommendationId?: string;
};

export function createConfirmedEmployeeAssignmentRecordId(
  projectId: string,
  projectTaskId: string,
  employeeId: string,
  rulesetVersion = CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
) {
  return `${projectId}:task-assignment:${projectTaskId}:${employeeId}:${rulesetVersion}`;
}

export function createConfirmedEmployeeAssignmentResultId(
  projectId: string,
  projectTaskId: string,
  rulesetVersion = CONFIRMED_EMPLOYEE_ASSIGNMENT_RULESET_VERSION,
) {
  return `${projectId}:task-assignment-result:${projectTaskId}:${rulesetVersion}`;
}

export function createConfirmedEmployeeAssignmentResultCollection(input: Omit<
  ConfirmedEmployeeAssignmentResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ConfirmedEmployeeAssignmentResult>;
}): ConfirmedEmployeeAssignmentResultCollection {
  const results = input.results.map(copyConfirmedEmployeeAssignmentResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyConfirmedEmployeeAssignmentRecord(
  record: ConfirmedEmployeeAssignmentRecord,
): ConfirmedEmployeeAssignmentRecord {
  return {
    ...record,
    reasonCodes: [...record.reasonCodes],
    recommendationProvenance: { ...record.recommendationProvenance },
  };
}

export function copyConfirmedEmployeeAssignmentResult(
  result: ConfirmedEmployeeAssignmentResult,
): ConfirmedEmployeeAssignmentResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
