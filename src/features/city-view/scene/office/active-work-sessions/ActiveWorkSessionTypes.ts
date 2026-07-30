import type { CandidateAssignmentProvenance } from "../candidate-assignments/CandidateAssignmentTypes";
import type { ConfirmedEmployeeAssignmentRecord, PromotedProjectTaskProvenance } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession, WorkSessionProviderKind, WorkSessionStatus } from "../work-sessions/WorkSessionTypes";

export const ACTIVE_WORK_SESSION_RULESET_VERSION = "active-session-v1";

export type ActiveWorkSessionStartStatus =
  | "Started"
  | "AlreadyStarted"
  | "Ineligible"
  | "Unavailable"
  | "Conflict"
  | "Failed";

export type ActiveWorkSessionStartReasonCode =
  | "STARTED"
  | "ALREADY_STARTED"
  | "PREPARED_SESSION_NOT_FOUND"
  | "PREPARED_SESSION_STALE"
  | "PREPARED_SESSION_MALFORMED"
  | "PREPARED_SESSION_ALREADY_ACTIVE"
  | "PREPARED_SESSION_WORK_STARTED"
  | "PREPARED_SESSION_EXECUTION_STARTED"
  | "PREPARED_SESSION_AGENT_STARTED"
  | "PREPARED_SESSION_REPOSITORY_MUTATION_STARTED"
  | "PREPARED_SESSION_GITHUB_MUTATION_STARTED"
  | "TASK_NOT_FOUND"
  | "TASK_UNASSIGNED"
  | "TASK_ASSIGNEE_MISMATCH"
  | "TASK_ALREADY_STARTED"
  | "TASK_COMPLETED"
  | "TASK_CANCELLED"
  | "TASK_COLLECTION_UNAVAILABLE"
  | "CONFIRMED_ASSIGNMENT_MISSING"
  | "CONFIRMED_ASSIGNMENT_STALE"
  | "CONFIRMED_ASSIGNMENT_NOT_HUMAN_CONFIRMED"
  | "EMPLOYEE_MISSING"
  | "EMPLOYEE_UNAVAILABLE"
  | "EMPLOYEE_CONFLICT"
  | "EMPLOYEE_REGISTRY_UNAVAILABLE"
  | "ACTIVE_SESSION_ALREADY_EXISTS"
  | "ACTIVE_SESSION_CONFLICT"
  | "ACTIVE_SESSION_STORE_UNAVAILABLE"
  | "PROJECT_MISMATCH"
  | "MALFORMED_PROVENANCE";

export type ActiveWorkSessionStartSource = "Human";

export type ActiveWorkSessionRecord = WorkSession & {
  projectTaskId: string;
  preparedSessionId: string;
  confirmedAssignmentId: string;
  candidateTaskId?: string;
  assignmentRecommendationId?: string;
  promotionDecisionId?: string;
  employeeDisplayName?: string;
  provider: Extract<WorkSessionProviderKind, "placeholder">;
  status: Extract<WorkSessionStatus, "running">;
  startSource: ActiveWorkSessionStartSource;
  reasonCodes: ActiveWorkSessionStartReasonCode[];
  rulesetVersion: string;
  taskStatusAtStart: ProjectTask["status"];
  assignmentProvenance: CandidateAssignmentProvenance;
  preparationProvenance: PreparedWorkSessionProvenance;
  taskProvenance: PromotedProjectTaskProvenance;
  humanStarted: true;
  active: true;
  workStarted: true;
  paused: false;
  completed: false;
  executionStarted: false;
  agentStarted: false;
  employeeMoved: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type PreparedWorkSessionProvenance = {
  preparedSessionId: string;
  preparedAt: string;
  rulesetVersion: string;
  humanPrepared: boolean;
};

export type ActiveWorkSessionStartResult = {
  id: string;
  projectId: string;
  projectTaskId: string;
  preparedSessionId?: string;
  confirmedAssignmentId?: string;
  candidateTaskId?: string;
  employeeId?: string;
  employeeDisplayName?: string;
  activeSessionId?: string;
  status: ActiveWorkSessionStartStatus;
  reasonCodes: ActiveWorkSessionStartReasonCode[];
  started: boolean;
  duplicateExistingSession: boolean;
  humanStarted: boolean;
  active: boolean;
  workStarted: boolean;
  executionStarted: false;
  agentStarted: false;
  employeeMoved: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesetVersion: string;
};

export type ActiveWorkSessionStartResultCollection = {
  projectId: string;
  results: ActiveWorkSessionStartResult[];
  resultCount: number;
  generatedAt?: string;
  rulesetVersion: string;
};

export type ActiveWorkSessionStartRequest = {
  projectId: string;
  projectTaskId: string;
  preparedSessionId: string;
  requestedAt: string;
};

export type ActiveWorkSessionStartInput = {
  request: ActiveWorkSessionStartRequest;
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<ProjectTask>;
  };
  confirmedAssignments?: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>;
  preparedSessions?: Readonly<Record<string, PreparedWorkSessionRecord>>;
  employees?: ReadonlyArray<Employee>;
  activeSessions?: Readonly<Record<string, ReadonlyArray<WorkSession>>>;
};

export type ActiveWorkSessionStartOutcome = {
  result: ActiveWorkSessionStartResult;
  activeSession?: ActiveWorkSessionRecord;
  taskCollection?: {
    projectId: string;
    tasks: ProjectTask[];
  };
  employees?: Employee[];
  activeSessions?: Record<string, WorkSession[]>;
};

export function createActiveWorkSessionId(
  projectId: string,
  projectTaskId: string,
  preparedSessionId: string,
  rulesetVersion = ACTIVE_WORK_SESSION_RULESET_VERSION,
) {
  return `${projectId}:work-session:${projectTaskId}:${preparedSessionId}:${rulesetVersion}`;
}

export function createActiveWorkSessionStartResultId(
  projectId: string,
  projectTaskId: string,
  preparedSessionId: string,
  rulesetVersion = ACTIVE_WORK_SESSION_RULESET_VERSION,
) {
  return `${projectId}:work-session-start-result:${projectTaskId}:${preparedSessionId}:${rulesetVersion}`;
}

export function createActiveWorkSessionStartResultCollection(input: Omit<
  ActiveWorkSessionStartResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ActiveWorkSessionStartResult>;
}): ActiveWorkSessionStartResultCollection {
  const results = input.results.map(copyActiveWorkSessionStartResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyActiveWorkSessionRecord(record: ActiveWorkSessionRecord): ActiveWorkSessionRecord {
  return {
    ...record,
    reasonCodes: [...record.reasonCodes],
    activityIds: record.activityIds ? [...record.activityIds] : undefined,
    assignmentProvenance: { ...record.assignmentProvenance },
    preparationProvenance: { ...record.preparationProvenance },
    taskProvenance: { ...record.taskProvenance },
  };
}

export function copyActiveWorkSessionStartResult(
  result: ActiveWorkSessionStartResult,
): ActiveWorkSessionStartResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
