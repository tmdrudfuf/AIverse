import type { ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncSnapshot } from "../repository-sync/RepositorySyncTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";

export const EXECUTION_PLAN_RULES_VERSION = "plan-v1";

export type ExecutionPlanStatus = "Created" | "AlreadyExists" | "Blocked" | "Failed";

export type ExecutionPlanReasonCode =
  | "CREATED"
  | "ALREADY_EXISTS"
  | "ACTIVE_SESSION_NOT_FOUND"
  | "ACTIVE_SESSION_STALE"
  | "ACTIVE_SESSION_NOT_ACTIVE"
  | "TASK_NOT_FOUND"
  | "TASK_NOT_ACTIVE"
  | "TASK_ASSIGNEE_MISMATCH"
  | "TASK_COLLECTION_UNAVAILABLE"
  | "CONFIRMED_ASSIGNMENT_MISSING"
  | "CONFIRMED_ASSIGNMENT_STALE"
  | "PREPARED_SESSION_MISSING"
  | "PREPARED_SESSION_STALE"
  | "EMPLOYEE_MISSING"
  | "EMPLOYEE_STALE"
  | "EMPLOYEE_REGISTRY_UNAVAILABLE"
  | "REPOSITORY_IDENTITY_MISSING"
  | "REPOSITORY_METADATA_UNAVAILABLE"
  | "WORKTREE_UNAVAILABLE"
  | "BRANCH_UNAVAILABLE"
  | "SPEC_UNAVAILABLE"
  | "ROLE_CONTEXT_UNAVAILABLE"
  | "VALIDATION_COMMANDS_UNAVAILABLE"
  | "MUTATION_SCOPE_UNAVAILABLE"
  | "PLAN_STORE_UNAVAILABLE"
  | "PROJECT_MISMATCH"
  | "MALFORMED_PROVENANCE";

export type ExecutionPlan = {
  planId: string;
  projectId: string;
  featureId: string;
  projectTaskId: string;
  candidateTaskId?: string;
  recommendationId?: string;
  promotionDecisionId?: string;
  confirmedAssignmentId: string;
  preparedSessionId: string;
  activeSessionId: string;
  employeeId: string;
  repositoryId: string;
  repositoryPath: string;
  worktreePath: string;
  branchName: string;
  specPath: string;
  implementerAgent: string;
  reviewerAgent: string;
  validationCommands: string[];
  allowedMutationScope: string[];
  createdAt: string;
  rulesVersion: string;
  executionStarted: false;
  runtimeStarted: false;
  subprocessStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type ExecutionPlanResult = {
  id: string;
  projectId: string;
  projectTaskId: string;
  activeSessionId: string;
  planId?: string;
  status: ExecutionPlanStatus;
  reasonCodes: ExecutionPlanReasonCode[];
  createdPlan: boolean;
  duplicateExistingPlan: boolean;
  executionStarted: false;
  runtimeStarted: false;
  subprocessStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  resultAt: string;
  rulesVersion: string;
};

export type ExecutionPlanCollection = {
  projectId: string;
  plans: ExecutionPlan[];
  planCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ExecutionPlanResultCollection = {
  projectId: string;
  results: ExecutionPlanResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ExecutionPlanRepositoryContext = {
  repositoryId: string;
  repositoryPath: string;
  worktreePath: string;
  branchName: string;
  specPath: string;
};

export type ExecutionPlanRoleContext = {
  implementerAgent: string;
  reviewerAgent: string;
  validationCommands: string[];
  allowedMutationScope: string[];
};

export type ExecutionPlanPathChecks = {
  worktreeExists: boolean;
  specExists: boolean;
};

export type ExecutionPlanCreationRequest = {
  projectId: string;
  projectTaskId: string;
  activeSessionId: string;
  requestedAt: string;
};

export type ExecutionPlanCreationInput = {
  request: ExecutionPlanCreationRequest;
  featureId: string;
  taskCollection?: TaskCollection;
  confirmedAssignments?: Readonly<Record<string, ConfirmedEmployeeAssignmentRecord>>;
  preparedSessions?: Readonly<Record<string, PreparedWorkSessionRecord>>;
  activeSessions?: Readonly<Record<string, ReadonlyArray<WorkSession>>>;
  employees?: ReadonlyArray<Employee>;
  repositoryIdentity?: ProjectRegistryRepositoryIdentity;
  repositorySnapshot?: RepositorySyncSnapshot;
  repositoryContext?: ExecutionPlanRepositoryContext;
  roleContext?: ExecutionPlanRoleContext;
  pathChecks?: ExecutionPlanPathChecks;
  existingPlans?: ExecutionPlanCollection;
};

export type ExecutionPlanCreationOutcome = {
  result: ExecutionPlanResult;
  plan?: ExecutionPlan;
  planCollection?: ExecutionPlanCollection;
};

export function createExecutionPlanId(
  projectId: string,
  activeSessionId: string,
  rulesVersion = EXECUTION_PLAN_RULES_VERSION,
) {
  return `${projectId}:execution-plan:${activeSessionId}:${rulesVersion}`;
}

export function createExecutionPlanResultId(
  projectId: string,
  activeSessionId: string,
  rulesVersion = EXECUTION_PLAN_RULES_VERSION,
) {
  return `${projectId}:execution-plan-result:${activeSessionId}:${rulesVersion}`;
}

export function createExecutionPlanCollection(input: Omit<ExecutionPlanCollection, "plans" | "planCount"> & {
  plans: ReadonlyArray<ExecutionPlan>;
}): ExecutionPlanCollection {
  const plans = input.plans.map(copyExecutionPlan);
  return {
    ...input,
    plans,
    planCount: plans.length,
  };
}

export function createExecutionPlanResultCollection(input: Omit<
  ExecutionPlanResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ExecutionPlanResult>;
}): ExecutionPlanResultCollection {
  const results = input.results.map(copyExecutionPlanResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyExecutionPlan(plan: ExecutionPlan): ExecutionPlan {
  return {
    ...plan,
    validationCommands: [...plan.validationCommands],
    allowedMutationScope: [...plan.allowedMutationScope],
  };
}

export function copyExecutionPlanResult(result: ExecutionPlanResult): ExecutionPlanResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
