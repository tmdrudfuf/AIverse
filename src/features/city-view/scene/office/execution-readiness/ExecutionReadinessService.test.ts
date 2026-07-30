import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createConfirmedEmployeeAssignmentRecordId, type ConfirmedEmployeeAssignmentRecord } from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "../employees/EmployeeTypes";
import { createExecutionPlanId, type ExecutionPlan, type ExecutionPlanCollection } from "../execution-plans/ExecutionPlanTypes";
import { createPreparedWorkSessionId, type PreparedWorkSessionRecord } from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask, TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import { ExecutionReadinessService } from "./ExecutionReadinessService";
import { createExecutionReadinessId, type ExecutionReadinessEvaluationInput } from "./ExecutionReadinessTypes";

describe("ExecutionReadinessService", () => {
  it("returns Ready for valid current product-side state without implying approval or execution", () => {
    const outcome = new ExecutionReadinessService().evaluateReadiness(createInput());

    expect(outcome.readiness).toMatchObject({
      readinessId: createExecutionReadinessId("daily-proof", createPlan().planId),
      status: "Ready",
      executionApproved: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.readiness.checks).toHaveLength(10);
    expect(outcome.result).toMatchObject({
      status: "Ready",
      reasonCodes: ["READY"],
      passedCheckCount: 10,
      blockedCheckCount: 0,
      failedCheckCount: 0,
      executionApproved: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
  });

  it("blocks missing and stale domain state with deterministic reason codes", () => {
    const service = new ExecutionReadinessService();

    expect(service.evaluateReadiness(createInput({ executionPlans: { projectId: "daily-proof", plans: [] } })).result.reasonCodes)
      .toContain("EXECUTION_PLAN_MISSING");
    expect(service.evaluateReadiness(createInput({ taskCollection: { projectId: "daily-proof", tasks: [createTask({ status: "Done" })] } })).result.reasonCodes)
      .toContain("TASK_STATE_INCOMPATIBLE");
    expect(service.evaluateReadiness(createInput({ confirmedAssignments: {} })).result.reasonCodes).toContain("ASSIGNMENT_MISSING");
    expect(service.evaluateReadiness(createInput({ preparedSessions: {} })).result.reasonCodes).toContain("PREPARED_SESSION_MISSING");
    expect(service.evaluateReadiness(createInput({ activeSessions: {} })).result.reasonCodes).toContain("ACTIVE_SESSION_MISSING");
    expect(service.evaluateReadiness(createInput({ employees: [] })).result.reasonCodes).toContain("EMPLOYEE_MISSING");
  });

  it("blocks stale repository evidence, role context, validation commands, and mutation scope", () => {
    const service = new ExecutionReadinessService();

    expect(service.evaluateReadiness(createInput({ repositoryEvidence: undefined })).result.reasonCodes).toContain(
      "REPOSITORY_EVIDENCE_MISSING",
    );
    expect(service.evaluateReadiness(createInput({ repositoryEvidence: { ...createRepositoryEvidence(), worktreePathSignal: "" } })).result.reasonCodes)
      .toContain("WORKTREE_SIGNAL_MISSING");
    expect(service.evaluateReadiness(createInput({ repositoryEvidence: { ...createRepositoryEvidence(), branchSignal: "" } })).result.reasonCodes)
      .toContain("BRANCH_SIGNAL_MISSING");
    expect(service.evaluateReadiness(createInput({ repositoryEvidence: { ...createRepositoryEvidence(), specPathSignal: "" } })).result.reasonCodes)
      .toContain("SPEC_SIGNAL_MISSING");
    expect(service.evaluateReadiness(createInput({ roleContext: { ...createRoleContext(), implementerAgent: "" } })).result.reasonCodes)
      .toContain("IMPLEMENTER_MISSING");
    expect(service.evaluateReadiness(createInput({ roleContext: { ...createRoleContext(), reviewerAgent: "" } })).result.reasonCodes)
      .toContain("REVIEWER_MISSING");
    expect(service.evaluateReadiness(createInput({ roleContext: { ...createRoleContext(), reviewerAgent: "Codex" } })).result.reasonCodes)
      .toContain("AGENT_CONTEXT_MISMATCH");
    expect(service.evaluateReadiness(createInput({ roleContext: { ...createRoleContext(), validationCommands: [] } })).result.reasonCodes)
      .toContain("VALIDATION_COMMANDS_MISSING");
    expect(service.evaluateReadiness(createInput({ roleContext: { ...createRoleContext(), allowedMutationScope: ["github-mutation"] } })).result.reasonCodes)
      .toContain("MUTATION_SCOPE_UNSAFE");
    expect(service.evaluateReadiness(createInput({
      executionPlans: createPlanCollection(createPlan({
        allowedMutationScope: ["local-worktree-only", "no-agent-runtime", "no-subprocess", "no-repository-mutation", "github-mutation"],
      })),
      roleContext: {
        ...createRoleContext(),
        allowedMutationScope: ["local-worktree-only", "no-agent-runtime", "no-subprocess", "no-repository-mutation", "github-mutation"],
      },
    })).result.reasonCodes)
      .toContain("MUTATION_SCOPE_UNSAFE");
  });

  it("revalidates command-time state and does not reuse stale Ready results", () => {
    const service = new ExecutionReadinessService();
    const first = service.evaluateReadiness(createInput());
    const second = service.evaluateReadiness(createInput({
      existingReadiness: first.readinessCollection,
      existingResults: first.resultCollection,
      employees: [createEmployee({ status: "Offline" })],
    }));

    expect(first.result.status).toBe("Ready");
    expect(second.result).toMatchObject({
      status: "Blocked",
      reasonCodes: ["EMPLOYEE_STATE_INCOMPATIBLE"],
      passedCheckCount: 9,
      blockedCheckCount: 1,
    });
    expect(second.readinessCollection?.readiness).toHaveLength(1);
    expect(second.readinessCollection?.readiness[0]?.status).toBe("Blocked");
  });

  it("rejects same raw IDs from another project and malformed requests safely", () => {
    const service = new ExecutionReadinessService();

    expect(service.evaluateReadiness(createInput({
      request: { ...createInput().request, projectId: "other" },
      executionPlans: { projectId: "other", plans: [createPlan()] },
    })).result.reasonCodes)
      .toContain("EXECUTION_PLAN_PROJECT_MISMATCH");
    expect(service.evaluateReadiness(createInput({
      repositoryEvidence: { ...createRepositoryEvidence(), projectId: "other" },
    })).result.reasonCodes).toContain("PROJECT_MISMATCH");
    expect(service.evaluateReadiness(createInput({
      request: { projectId: "", executionPlanId: "", evaluatedAt: "2026-01-06T00:00:00.000Z" },
    })).result).toMatchObject({
      status: "Failed",
      reasonCodes: ["MALFORMED_INPUT"],
      failedCheckCount: 1,
    });
  });

  it("protects returned check and reason arrays from caller mutation", () => {
    const service = new ExecutionReadinessService();
    const outcome = service.evaluateReadiness(createInput());
    outcome.readiness.checks[0]!.message = "mutated";
    outcome.result.reasonCodes.push("TASK_MISSING");

    const fresh = service.evaluateReadiness(createInput());

    expect(fresh.readiness.checks[0]?.message).toBe("Execution plan is current and non-executing.");
    expect(fresh.result.reasonCodes).toEqual(["READY"]);
  });

  it("does not import runtime, filesystem preflight, or agent execution APIs in product code", () => {
    const serviceSource = readFileSync(
      "src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.ts",
      "utf8",
    );

    expect(serviceSource).not.toMatch(/from\s+["'](?:node:)?child_process["']/);
    expect(serviceSource).not.toMatch(/from\s+["'](?:node:)?fs["']/);
    expect(serviceSource).not.toMatch(/from\s+["'](?:node:)?path["']/);
    expect(serviceSource).not.toMatch(/spawn|execFile|execSync|Codex CLI|Claude CLI|git\s|gh\s/);
  });
});

function createInput(overrides: Partial<ExecutionReadinessEvaluationInput> = {}): ExecutionReadinessEvaluationInput {
  const plan = createPlan();
  const assignment = createAssignment();
  const prepared = createPreparedSession();
  const active = createActiveSession();
  return {
    request: {
      projectId: "daily-proof",
      executionPlanId: plan.planId,
      evaluatedAt: "2026-01-06T00:00:00.000Z",
    },
    executionPlans: createPlanCollection(plan),
    taskCollection: createTaskCollection(),
    confirmedAssignments: { [assignment.id]: assignment },
    preparedSessions: { [prepared.id]: prepared },
    activeSessions: { "task-12": [active] },
    employees: [createEmployee()],
    repositoryEvidence: createRepositoryEvidence(),
    roleContext: createRoleContext(),
    ...overrides,
  };
}

function createPlanCollection(plan: ExecutionPlan): ExecutionPlanCollection {
  return { projectId: "daily-proof", plans: [plan], planCount: 1, rulesVersion: "plan-v1" };
}

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const sessionId = "daily-proof:work-session:task-12:prepared-12:active-session-v1";
  return {
    planId: createExecutionPlanId("daily-proof", sessionId),
    projectId: "daily-proof",
    featureId: "070-execution-plan-foundation",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    recommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    confirmedAssignmentId: createAssignment().id,
    preparedSessionId: createPreparedSession().id,
    activeSessionId: sessionId,
    employeeId: "gpt-engineer",
    repositoryId: "github:ai-verse/daily-proof",
    repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
    branchName: "codex/070-execution-plan-foundation",
    specPath: "specs/070-execution-plan-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build"],
    allowedMutationScope: ["local-worktree-only", "no-agent-runtime", "no-subprocess", "no-repository-mutation", "no-github-mutation"],
    createdAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
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
    recommendationProvenance: { candidateTaskId: "candidate-12", originatingIssueId: "issue-12", issueNumber: 12 },
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
    assignmentProvenance: { candidateTaskId: "candidate-12", originatingIssueId: "issue-12", issueNumber: 12 },
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
  return {
    id: "daily-proof:work-session:task-12:prepared-12:active-session-v1",
    taskId: "task-12",
    projectId: "daily-proof",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-01-04T00:00:00.000Z",
    preparedSessionId: createPreparedSession().id,
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
    capabilities: ["Coding"],
    description: "Test engineer",
    ...overrides,
  };
}

function createRepositoryEvidence() {
  return {
    projectId: "daily-proof",
    repositoryId: "github:ai-verse/daily-proof",
    repositoryPathSignal: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
    worktreePathSignal: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
    branchSignal: "codex/070-execution-plan-foundation",
    specPathSignal: "specs/070-execution-plan-foundation/spec.md",
    repositorySyncStatus: "Succeeded",
  };
}

function createRoleContext() {
  return {
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build"],
    allowedMutationScope: ["local-worktree-only", "no-agent-runtime", "no-subprocess", "no-repository-mutation", "no-github-mutation"],
  };
}
