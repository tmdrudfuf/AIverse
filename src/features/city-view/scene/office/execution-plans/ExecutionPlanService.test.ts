import { describe, expect, it } from "vitest";

import { createConfirmedEmployeeAssignmentRecordId, type ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { createPreparedWorkSessionId, type PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncSnapshot } from "../repository-sync/RepositorySyncTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { ExecutionPlanService } from "./ExecutionPlanService";
import { createExecutionPlanId, type ExecutionPlanCreationInput } from "./ExecutionPlanTypes";

describe("ExecutionPlanService", () => {
  it("creates an immutable execution plan without mutating source state", () => {
    const service = new ExecutionPlanService();
    const input = createInput();
    const taskBefore = structuredClone(input.taskCollection);
    const employeeBefore = structuredClone(input.employees);
    const assignmentBefore = structuredClone(input.confirmedAssignments);
    const preparedBefore = structuredClone(input.preparedSessions);
    const sessionsBefore = structuredClone(input.activeSessions);

    const outcome = service.createPlan(input);

    expect(outcome.result).toMatchObject({
      status: "Created",
      reasonCodes: ["CREATED"],
      createdPlan: true,
      duplicateExistingPlan: false,
      executionStarted: false,
      runtimeStarted: false,
      subprocessStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.plan).toMatchObject({
      planId: createExecutionPlanId("daily-proof", createActiveSession().id),
      featureId: "070-execution-plan-foundation",
      projectTaskId: "task-12",
      candidateTaskId: "candidate-12",
      recommendationId: "recommendation-12",
      promotionDecisionId: "promotion-12",
      confirmedAssignmentId: createAssignment().id,
      preparedSessionId: createPreparedSession().id,
      activeSessionId: createActiveSession().id,
      employeeId: "gpt-engineer",
      repositoryId: "github:ai-verse/daily-proof",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
      branchName: "codex/070-execution-plan-foundation",
      specPath: "specs/070-execution-plan-foundation/spec.md",
      implementerAgent: "Implementer",
      reviewerAgent: "Reviewer",
      executionStarted: false,
      runtimeStarted: false,
      subprocessStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.planCollection?.plans).toHaveLength(1);
    expect(input.taskCollection).toEqual(taskBefore);
    expect(input.employees).toEqual(employeeBefore);
    expect(input.confirmedAssignments).toEqual(assignmentBefore);
    expect(input.preparedSessions).toEqual(preparedBefore);
    expect(input.activeSessions).toEqual(sessionsBefore);
  });

  it("returns AlreadyExists only after command-time revalidation", () => {
    const service = new ExecutionPlanService();
    const first = service.createPlan(createInput());
    const second = service.createPlan(createInput({ existingPlans: first.planCollection }));
    const stale = service.createPlan(createInput({
      existingPlans: first.planCollection,
      employees: [createEmployee({ status: "Offline" })],
    }));

    expect(second.result).toMatchObject({
      status: "AlreadyExists",
      reasonCodes: ["ALREADY_EXISTS"],
      createdPlan: false,
      duplicateExistingPlan: true,
      planId: first.plan?.planId,
    });
    expect(second.plan?.createdAt).toBe(first.plan?.createdAt);
    expect(stale.result).toMatchObject({
      status: "Blocked",
      reasonCodes: ["EMPLOYEE_STALE"],
      duplicateExistingPlan: false,
    });
  });

  it("blocks invalid active session, task, assignment, prepared session, and employee state", () => {
    const service = new ExecutionPlanService();

    expect(service.createPlan(createInput({ activeSessions: {} })).result.reasonCodes).toEqual(["ACTIVE_SESSION_NOT_FOUND"]);
    expect(service.createPlan(createInput({ activeSessions: { "task-12": [createActiveSession({ projectId: "other" })] } })).result.reasonCodes)
      .toEqual(["ACTIVE_SESSION_STALE"]);
    expect(service.createPlan(createInput({ activeSessions: { "task-12": [createActiveSession({ status: "finished" })] } })).result.reasonCodes)
      .toEqual(["ACTIVE_SESSION_NOT_ACTIVE"]);
    expect(service.createPlan(createInput({ taskCollection: { projectId: "daily-proof", tasks: [createTask({ status: "Todo" })] } })).result.reasonCodes)
      .toEqual(["TASK_NOT_ACTIVE"]);
    expect(service.createPlan(createInput({ taskCollection: { projectId: "daily-proof", tasks: [createTask({ assigneeId: "other" })] } })).result.reasonCodes)
      .toEqual(["ACTIVE_SESSION_STALE"]);
    expect(service.createPlan(createInput({ confirmedAssignments: {} })).result.reasonCodes).toEqual(["CONFIRMED_ASSIGNMENT_MISSING"]);
    expect(service.createPlan(createInput({ confirmedAssignments: { [createAssignment().id]: createAssignment({ employeeId: "other" }) } })).result.reasonCodes)
      .toEqual(["CONFIRMED_ASSIGNMENT_STALE"]);
    expect(service.createPlan(createInput({ preparedSessions: {} })).result.reasonCodes).toEqual(["PREPARED_SESSION_MISSING"]);
    expect(service.createPlan(createInput({ preparedSessions: { [createPreparedSession().id]: createPreparedSession({ employeeId: "other" }) } })).result.reasonCodes)
      .toEqual(["PREPARED_SESSION_STALE"]);
    expect(service.createPlan(createInput({ employees: [] })).result.reasonCodes).toEqual(["EMPLOYEE_MISSING"]);
  });

  it("blocks missing repository, worktree, spec, roles, and cross-project stores", () => {
    const service = new ExecutionPlanService();

    expect(service.createPlan(createInput({ taskCollection: { projectId: "other", tasks: [] } })).result.reasonCodes).toEqual(["PROJECT_MISMATCH"]);
    expect(service.createPlan(createInput({ existingPlans: undefined })).result.reasonCodes).toEqual(["PLAN_STORE_UNAVAILABLE"]);
    expect(service.createPlan(createInput({ repositoryIdentity: undefined })).result.reasonCodes).toEqual(["REPOSITORY_IDENTITY_MISSING"]);
    expect(service.createPlan(createInput({ repositorySnapshot: { ...createRepositorySnapshot(), syncStatus: "Unavailable" } })).result.reasonCodes)
      .toEqual(["REPOSITORY_METADATA_UNAVAILABLE"]);
    expect(service.createPlan(createInput({ pathChecks: { worktreeExists: false, specExists: true } })).result.reasonCodes).toEqual(["WORKTREE_UNAVAILABLE"]);
    expect(service.createPlan(createInput({ pathChecks: { worktreeExists: true, specExists: false } })).result.reasonCodes).toEqual(["SPEC_UNAVAILABLE"]);
    expect(service.createPlan(createInput({ roleContext: { ...createRoleContext(), implementerAgent: "" } })).result.reasonCodes).toEqual([
      "ROLE_CONTEXT_UNAVAILABLE",
    ]);
    expect(service.createPlan(createInput({ roleContext: { ...createRoleContext(), validationCommands: [] } })).result.reasonCodes).toEqual([
      "VALIDATION_COMMANDS_UNAVAILABLE",
    ]);
  });

  it("protects returned plan and result arrays from caller mutation", () => {
    const service = new ExecutionPlanService();
    const outcome = service.createPlan(createInput());
    outcome.plan!.validationCommands.push("mutated");
    outcome.planCollection!.plans[0]!.allowedMutationScope.push("mutated");
    outcome.result.reasonCodes.push("PROJECT_MISMATCH");

    const fresh = service.createPlan(createInput());

    expect(fresh.plan?.validationCommands).toEqual(["npm test", "npx tsc --noEmit", "npm run build"]);
    expect(fresh.plan?.allowedMutationScope).toEqual(["local-worktree-only", "no-github-mutation"]);
    expect(fresh.result.reasonCodes).toEqual(["CREATED"]);
  });
});

function createInput(overrides: Partial<ExecutionPlanCreationInput> = {}): ExecutionPlanCreationInput {
  const assignment = createAssignment();
  const preparedSession = createPreparedSession();
  const activeSession = createActiveSession();
  return {
    request: {
      projectId: "daily-proof",
      projectTaskId: "task-12",
      activeSessionId: activeSession.id,
      requestedAt: "2026-01-05T00:00:00.000Z",
    },
    featureId: "070-execution-plan-foundation",
    taskCollection: createTaskCollection(),
    confirmedAssignments: { [assignment.id]: assignment },
    preparedSessions: { [preparedSession.id]: preparedSession },
    activeSessions: { "task-12": [activeSession] },
    employees: [createEmployee()],
    repositoryIdentity: createRepositoryIdentity(),
    repositorySnapshot: createRepositorySnapshot(),
    repositoryContext: createRepositoryContext(),
    roleContext: createRoleContext(),
    pathChecks: { worktreeExists: true, specExists: true },
    existingPlans: { projectId: "daily-proof", plans: [], planCount: 0, rulesVersion: "plan-v1" },
    ...overrides,
  };
}

function createTaskCollection(): TaskCollection {
  return { projectId: "daily-proof", tasks: [createTask()] };
}

function createTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "task-12",
    title: "Fix crash on launch",
    description: [
      "Fix crash on launch",
      "Candidate Task: candidate-12",
      "Promotion Decision: promotion-12",
      "Assignment Recommendation: recommendation-12",
      "[AIverse Promotion: project=daily-proof; candidateTask=candidate-12; ruleset=candidate-promotion-v1]",
    ].join("\n"),
    status: "In Progress",
    priority: "High",
    projectId: "daily-proof",
    assigneeId: "gpt-engineer",
    assignee: "GPT Engineer",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-04T00:00:00.000Z",
    activityLog: [],
    ...overrides,
  };
}

function createAssignment(overrides: Partial<ConfirmedEmployeeAssignmentRecord> = {}): ConfirmedEmployeeAssignmentRecord {
  return {
    id: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-12", "gpt-engineer"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    promotionDecisionId: "promotion-12",
    assignmentRecommendationId: "recommendation-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Assigned",
    reasonCodes: ["ASSIGNED"],
    assignmentSource: "Human",
    assignedAt: "2026-01-02T00:00:00.000Z",
    rulesetVersion: "confirmed-assignment-v1",
    taskStatusAtAssignment: "Todo",
    recommendationProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    humanConfirmed: true,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    ...overrides,
  };
}

function createPreparedSession(overrides: Partial<PreparedWorkSessionRecord> = {}): PreparedWorkSessionRecord {
  const assignment = createAssignment();
  return {
    id: createPreparedWorkSessionId("daily-proof", "task-12", assignment.id),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    confirmedAssignmentId: assignment.id,
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Prepared",
    preparationSource: "Human",
    reasonCodes: ["PREPARED"],
    preparedAt: "2026-01-03T00:00:00.000Z",
    rulesetVersion: "prepared-session-v1",
    taskStatusAtPreparation: "Todo",
    assignmentProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    taskProvenance: {
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      promotionDecisionId: "promotion-12",
      assignmentRecommendationId: "recommendation-12",
    },
    humanPrepared: true,
    active: false,
    workStarted: false,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createActiveSession(overrides: Partial<WorkSession> = {}): WorkSession {
  const prepared = createPreparedSession();
  return {
    id: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
    taskId: "task-12",
    projectId: "daily-proof",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-01-04T00:00:00.000Z",
    preparedSessionId: prepared.id,
    confirmedAssignmentId: createAssignment().id,
    candidateTaskId: "candidate-12",
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  } as WorkSession;
}

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Working",
    avatarColor: "#64748b",
    assignedTaskId: "task-12",
    currentProjectId: "daily-proof",
    capabilities: ["coding"],
    description: "Test engineer",
    ...overrides,
  };
}

function createRepositoryIdentity(overrides: Partial<ProjectRegistryRepositoryIdentity> = {}): ProjectRegistryRepositoryIdentity {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
    connectionState: "Available",
    ...overrides,
  };
}

function createRepositorySnapshot(overrides: Partial<RepositorySyncSnapshot> = {}): RepositorySyncSnapshot {
  return {
    provider: "github",
    availability: "available",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    currentBranch: "codex/070-execution-plan-foundation",
    syncStatus: "Succeeded",
    workingTreeState: "clean",
    ...overrides,
  };
}

function createRepositoryContext() {
  return {
    repositoryId: "github:ai-verse/daily-proof",
    repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
    branchName: "codex/070-execution-plan-foundation",
    specPath: "specs/070-execution-plan-foundation/spec.md",
  };
}

function createRoleContext() {
  return {
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build"],
    allowedMutationScope: ["local-worktree-only", "no-github-mutation"],
  };
}
