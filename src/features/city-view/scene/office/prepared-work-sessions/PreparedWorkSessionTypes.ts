import type { CandidateAssignmentProvenance } from "../candidate-assignments/CandidateAssignmentTypes";
import type { PromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";

export const PREPARED_WORK_SESSION_RULESET_VERSION = "prepared-session-v1";

export type PreparedWorkSessionStatus =
  | "Prepared"
  | "AlreadyPrepared"
  | "Ineligible"
  | "Unavailable"
  | "Conflict"
  | "Failed";

export type PreparedWorkSessionReasonCode =
  | "PREPARED"
  | "ALREADY_PREPARED"
  | "TASK_NOT_FOUND"
  | "TASK_UNASSIGNED"
  | "TASK_ASSIGNEE_MISMATCH"
  | "TASK_ALREADY_STARTED"
  | "TASK_COMPLETED"
  | "TASK_COLLECTION_UNAVAILABLE"
  | "CONFIRMED_ASSIGNMENT_MISSING"
  | "CONFIRMED_ASSIGNMENT_STALE"
  | "CONFIRMED_ASSIGNMENT_NOT_HUMAN_CONFIRMED"
  | "CONFIRMED_ASSIGNMENT_WORK_STARTED"
  | "CONFIRMED_ASSIGNMENT_SESSION_CREATED"
  | "CONFIRMED_ASSIGNMENT_EXECUTION_STARTED"
  | "EMPLOYEE_MISSING"
  | "EMPLOYEE_UNAVAILABLE"
  | "EMPLOYEE_CONFLICT"
  | "EMPLOYEE_REGISTRY_UNAVAILABLE"
  | "PREPARED_SESSION_ALREADY_EXISTS"
  | "PROJECT_MISMATCH"
  | "MALFORMED_PROVENANCE"
  | "PREPARED_SESSION_STORE_UNAVAILABLE";

export type PreparedWorkSessionSource = "Human";

export type PreparedWorkSessionRecord = {
  id: string;
  projectId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  confirmedAssignmentId: string;
  assignmentRecommendationId?: string;
  promotionDecisionId?: string;
  employeeId: string;
  employeeDisplayName?: string;
  status: Extract<PreparedWorkSessionStatus, "Prepared" | "AlreadyPrepared">;
  preparationSource: PreparedWorkSessionSource;
  reasonCodes: PreparedWorkSessionReasonCode[];
  preparedAt: string;
  rulesetVersion: string;
  taskStatusAtPreparation: ProjectTask["status"];
  assignmentProvenance: CandidateAssignmentProvenance;
  taskProvenance: PromotedProjectTaskProvenance;
  humanPrepared: true;
  workStarted: false;
  active: false;
  paused: false;
  completed: false;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type PreparedWorkSessionResult = {
  id: string;
  projectId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  confirmedAssignmentId?: string;
  employeeId?: string;
  employeeDisplayName?: string;
  preparedSessionId?: string;
  status: PreparedWorkSessionStatus;
  reasonCodes: PreparedWorkSessionReasonCode[];
  prepared: boolean;
  duplicateExistingPreparation: boolean;
  humanPrepared: boolean;
  active: false;
  workStarted: false;
  executionStarted: false;
  employeeMoved: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesetVersion: string;
};

export type PreparedWorkSessionResultCollection = {
  projectId: string;
  results: PreparedWorkSessionResult[];
  resultCount: number;
  generatedAt?: string;
  rulesetVersion: string;
};

export type PreparedWorkSessionRequest = {
  projectId: string;
  projectTaskId: string;
  confirmedAssignmentId: string;
  requestedAt: string;
};

export type PreparedWorkSessionInput = {
  request: PreparedWorkSessionRequest;
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<ProjectTask>;
  };
  confirmedAssignments?: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>;
  employees?: ReadonlyArray<Employee>;
  workSessions?: Readonly<Record<string, ReadonlyArray<WorkSession>>>;
  existingPreparedSessions?: Readonly<Record<string, PreparedWorkSessionRecord>>;
};

export type PreparedWorkSessionOutcome = {
  result: PreparedWorkSessionResult;
  preparedSession?: PreparedWorkSessionRecord;
};

export function createPreparedWorkSessionId(
  projectId: string,
  projectTaskId: string,
  confirmedAssignmentId: string,
  rulesetVersion = PREPARED_WORK_SESSION_RULESET_VERSION,
) {
  return `${projectId}:prepared-work-session:${projectTaskId}:${confirmedAssignmentId}:${rulesetVersion}`;
}

export function createPreparedWorkSessionResultId(
  projectId: string,
  projectTaskId: string,
  rulesetVersion = PREPARED_WORK_SESSION_RULESET_VERSION,
) {
  return `${projectId}:prepared-work-session-result:${projectTaskId}:${rulesetVersion}`;
}

export function createPreparedWorkSessionResultCollection(input: Omit<
  PreparedWorkSessionResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<PreparedWorkSessionResult>;
}): PreparedWorkSessionResultCollection {
  const results = input.results.map(copyPreparedWorkSessionResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyPreparedWorkSessionRecord(record: PreparedWorkSessionRecord): PreparedWorkSessionRecord {
  return {
    ...record,
    reasonCodes: [...record.reasonCodes],
    assignmentProvenance: { ...record.assignmentProvenance },
    taskProvenance: { ...record.taskProvenance },
  };
}

export function copyPreparedWorkSessionResult(result: PreparedWorkSessionResult): PreparedWorkSessionResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
