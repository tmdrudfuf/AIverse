export const EXECUTION_READINESS_RULES_VERSION = "readiness-v1";

export type ExecutionReadinessStatus = "Ready" | "Blocked" | "Failed";

export type ExecutionReadinessCheckStatus = "Passed" | "Blocked" | "Failed";

export type ExecutionReadinessCheckCategory =
  | "ExecutionPlan"
  | "ProjectTask"
  | "ConfirmedAssignment"
  | "PreparedSession"
  | "ActiveSession"
  | "Employee"
  | "RepositoryEvidence"
  | "AgentContext"
  | "ValidationCommands"
  | "MutationScope";

export type ExecutionReadinessReasonCode =
  | "READY"
  | "EXECUTION_PLAN_MISSING"
  | "EXECUTION_PLAN_PROJECT_MISMATCH"
  | "EXECUTION_PLAN_ID_MISMATCH"
  | "EXECUTION_PLAN_RULES_UNSUPPORTED"
  | "EXECUTION_PLAN_ALREADY_STARTED"
  | "TASK_MISSING"
  | "TASK_PROJECT_MISMATCH"
  | "TASK_STATE_INCOMPATIBLE"
  | "TASK_PROVENANCE_MISMATCH"
  | "ASSIGNMENT_MISSING"
  | "ASSIGNMENT_MISMATCH"
  | "PREPARED_SESSION_MISSING"
  | "PREPARED_SESSION_MISMATCH"
  | "ACTIVE_SESSION_MISSING"
  | "ACTIVE_SESSION_MISMATCH"
  | "ACTIVE_SESSION_NOT_ACTIVE"
  | "ACTIVE_SESSION_ALREADY_EXECUTING"
  | "EMPLOYEE_MISSING"
  | "EMPLOYEE_MISMATCH"
  | "EMPLOYEE_STATE_INCOMPATIBLE"
  | "REPOSITORY_EVIDENCE_MISSING"
  | "REPOSITORY_MISMATCH"
  | "WORKTREE_SIGNAL_MISSING"
  | "BRANCH_SIGNAL_MISSING"
  | "SPEC_SIGNAL_MISSING"
  | "IMPLEMENTER_MISSING"
  | "REVIEWER_MISSING"
  | "AGENT_CONTEXT_MISMATCH"
  | "VALIDATION_COMMANDS_MISSING"
  | "VALIDATION_COMMANDS_MISMATCH"
  | "MUTATION_SCOPE_MISSING"
  | "MUTATION_SCOPE_UNSAFE"
  | "PROJECT_MISMATCH"
  | "MALFORMED_INPUT";

export type ExecutionReadinessCheck = {
  checkId: string;
  category: ExecutionReadinessCheckCategory;
  status: ExecutionReadinessCheckStatus;
  reason: ExecutionReadinessReasonCode;
  message: string;
};

export type ExecutionReadiness = {
  readinessId: string;
  projectId: string;
  executionPlanId: string;
  activeSessionId?: string;
  projectTaskId?: string;
  confirmedAssignmentId?: string;
  preparedSessionId?: string;
  employeeId?: string;
  repositoryId?: string;
  status: ExecutionReadinessStatus;
  checks: ExecutionReadinessCheck[];
  evaluatedAt: string;
  rulesVersion: string;
  executionApproved: false;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
};

export type ExecutionReadinessResult = {
  id: string;
  projectId: string;
  executionPlanId: string;
  readinessId: string;
  status: ExecutionReadinessStatus;
  reasonCodes: ExecutionReadinessReasonCode[];
  primaryReason?: ExecutionReadinessReasonCode;
  passedCheckCount: number;
  blockedCheckCount: number;
  failedCheckCount: number;
  executionApproved: false;
  executionStarted: false;
  agentStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  evaluatedAt: string;
  rulesVersion: string;
};

export type ExecutionReadinessCollection = {
  projectId: string;
  readiness: ExecutionReadiness[];
  readinessCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ExecutionReadinessResultCollection = {
  projectId: string;
  results: ExecutionReadinessResult[];
  resultCount: number;
  generatedAt?: string;
  rulesVersion: string;
};

export type ExecutionReadinessRepositoryEvidence = {
  repositoryId?: string;
  repositoryPathSignal?: string;
  worktreePathSignal?: string;
  branchSignal?: string;
  specPathSignal?: string;
  repositorySyncStatus?: string;
  owner?: string;
  name?: string;
  projectId?: string;
};

export type ExecutionReadinessRoleContext = {
  implementerAgent?: string;
  reviewerAgent?: string;
  validationCommands: ReadonlyArray<string>;
  allowedMutationScope: ReadonlyArray<string>;
};

export type ExecutionReadinessEvaluationRequest = {
  projectId: string;
  executionPlanId: string;
  evaluatedAt: string;
};

export type ExecutionReadinessEvaluationInput = {
  request: ExecutionReadinessEvaluationRequest;
  executionPlans?: {
    projectId: string;
    plans: ReadonlyArray<{
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
      validationCommands: ReadonlyArray<string>;
      allowedMutationScope: ReadonlyArray<string>;
      rulesVersion: string;
      executionStarted: boolean;
      runtimeStarted: boolean;
      subprocessStarted: boolean;
      repositoryMutationStarted: boolean;
      githubMutationStarted: boolean;
    }>;
  };
  taskCollection?: {
    projectId: string;
    tasks: ReadonlyArray<{
      id: string;
      projectId: string;
      status: string;
      description: string;
      assignee?: string;
      assigneeId?: string;
    }>;
  };
  confirmedAssignments?: Readonly<Record<string, {
    id: string;
    projectId: string;
    projectTaskId: string;
    candidateTaskId: string;
    promotionDecisionId?: string;
    assignmentRecommendationId: string;
    employeeId: string;
    humanConfirmed: boolean;
  }>>;
  preparedSessions?: Readonly<Record<string, {
    id: string;
    projectId: string;
    projectTaskId: string;
    candidateTaskId?: string;
    confirmedAssignmentId: string;
    assignmentRecommendationId?: string;
    promotionDecisionId?: string;
    employeeId: string;
    status: string;
    active: boolean;
    workStarted: boolean;
    executionStarted: boolean;
    agentStarted: boolean;
    repositoryMutationStarted: boolean;
    githubMutationStarted: boolean;
  }>>;
  activeSessions?: Readonly<Record<string, ReadonlyArray<{
    id: string;
    projectId: string;
    taskId: string;
    employeeId: string;
    employeeName: string;
    status: string;
    preparedSessionId?: string;
    confirmedAssignmentId?: string;
    candidateTaskId?: string;
    assignmentRecommendationId?: string;
    promotionDecisionId?: string;
    executionStarted?: boolean;
    agentStarted?: boolean;
    repositoryMutationStarted?: boolean;
    githubMutationStarted?: boolean;
  }>>>;
  employees?: ReadonlyArray<{
    id: string;
    name: string;
    status: string;
    assignedTaskId?: string;
    currentProjectId?: string;
  }>;
  repositoryEvidence?: ExecutionReadinessRepositoryEvidence;
  roleContext?: ExecutionReadinessRoleContext;
  existingReadiness?: ExecutionReadinessCollection;
  existingResults?: ExecutionReadinessResultCollection;
};

export type ExecutionReadinessEvaluationOutcome = {
  readiness: ExecutionReadiness;
  result: ExecutionReadinessResult;
  readinessCollection?: ExecutionReadinessCollection;
  resultCollection?: ExecutionReadinessResultCollection;
};

export function createExecutionReadinessId(projectId: string, executionPlanId: string, rulesVersion = EXECUTION_READINESS_RULES_VERSION) {
  return `${projectId}:execution-readiness:${executionPlanId}:${rulesVersion}`;
}

export function createExecutionReadinessResultId(
  projectId: string,
  executionPlanId: string,
  rulesVersion = EXECUTION_READINESS_RULES_VERSION,
) {
  return `${projectId}:execution-readiness-result:${executionPlanId}:${rulesVersion}`;
}

export function createExecutionReadinessCheckId(readinessId: string, category: ExecutionReadinessCheckCategory) {
  return `${readinessId}:check:${category}`;
}

export function createExecutionReadinessCollection(input: Omit<ExecutionReadinessCollection, "readiness" | "readinessCount"> & {
  readiness: ReadonlyArray<ExecutionReadiness>;
}): ExecutionReadinessCollection {
  const readiness = input.readiness.map(copyExecutionReadiness);
  return {
    ...input,
    readiness,
    readinessCount: readiness.length,
  };
}

export function createExecutionReadinessResultCollection(input: Omit<
  ExecutionReadinessResultCollection,
  "results" | "resultCount"
> & {
  results: ReadonlyArray<ExecutionReadinessResult>;
}): ExecutionReadinessResultCollection {
  const results = input.results.map(copyExecutionReadinessResult);
  return {
    ...input,
    results,
    resultCount: results.length,
  };
}

export function copyExecutionReadiness(readiness: ExecutionReadiness): ExecutionReadiness {
  return {
    ...readiness,
    checks: readiness.checks.map(copyExecutionReadinessCheck),
  };
}

export function copyExecutionReadinessCheck(check: ExecutionReadinessCheck): ExecutionReadinessCheck {
  return { ...check };
}

export function copyExecutionReadinessResult(result: ExecutionReadinessResult): ExecutionReadinessResult {
  return {
    ...result,
    reasonCodes: [...result.reasonCodes],
  };
}
