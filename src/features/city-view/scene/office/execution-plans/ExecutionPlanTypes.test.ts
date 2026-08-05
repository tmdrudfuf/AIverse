import { describe, expect, it } from "vitest";

import {
  createExecutionPlanCollection,
  createExecutionPlanId,
  createExecutionPlanResultCollection,
  createExecutionPlanResultId,
  resolveCurrentExecutionPlan,
  type ExecutionPlan,
  type ExecutionPlanResult,
} from "./ExecutionPlanTypes";

describe("ExecutionPlanTypes", () => {
  it("creates deterministic IDs from project and active session", () => {
    expect(createExecutionPlanId("daily-proof", "session-1")).toBe("daily-proof:execution-plan:session-1:plan-v1");
    expect(createExecutionPlanResultId("daily-proof", "session-1")).toBe("daily-proof:execution-plan-result:session-1:plan-v1");
  });

  it("defensively copies plan and result arrays", () => {
    const plan = createPlan();
    const result = createResult();
    const plans = createExecutionPlanCollection({ projectId: "daily-proof", plans: [plan], rulesVersion: "plan-v1" });
    const results = createExecutionPlanResultCollection({ projectId: "daily-proof", results: [result], rulesVersion: "plan-v1" });

    plan.validationCommands.push("mutated");
    result.reasonCodes.push("PROJECT_MISMATCH");
    plans.plans[0]?.allowedMutationScope.push("mutated");
    results.results[0]?.reasonCodes.push("PROJECT_MISMATCH");

    const freshPlans = createExecutionPlanCollection({ projectId: "daily-proof", plans: [createPlan()], rulesVersion: "plan-v1" });
    const freshResults = createExecutionPlanResultCollection({ projectId: "daily-proof", results: [createResult()], rulesVersion: "plan-v1" });

    expect(freshPlans.plans[0]?.validationCommands).toEqual(["npm test"]);
    expect(freshPlans.plans[0]?.allowedMutationScope).toEqual(["local-only"]);
    expect(freshResults.results[0]?.reasonCodes).toEqual(["CREATED"]);
  });
});

// Dashboard classification and the Promote action must resolve the exact
// same current Execution Plan via this one shared deterministic selector,
// rather than dashboard picking the array's last element and Promote
// picking the array's first match -- see review.md, combined round 2
// P2-001.
describe("resolveCurrentExecutionPlan", () => {
  it("selects the plan with the latest createdAt when multiple plans exist for the same task", () => {
    const older = withOverrides(createPlan(), { planId: "plan-older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = withOverrides(createPlan(), { planId: "plan-newer", createdAt: "2026-01-05T00:00:00.000Z" });
    const collection = createExecutionPlanCollection({ projectId: "daily-proof", plans: [older, newer], rulesVersion: "plan-v1" });

    const result = resolveCurrentExecutionPlan(collection, { projectTaskId: "task-12", candidateTaskId: "candidate-12" });

    expect(result?.planId).toBe("plan-newer");
  });

  it("returns the same plan regardless of array order (not array-position-dependent)", () => {
    const older = withOverrides(createPlan(), { planId: "plan-older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = withOverrides(createPlan(), { planId: "plan-newer", createdAt: "2026-01-05T00:00:00.000Z" });
    const forward = createExecutionPlanCollection({ projectId: "daily-proof", plans: [older, newer], rulesVersion: "plan-v1" });
    const reversed = createExecutionPlanCollection({ projectId: "daily-proof", plans: [newer, older], rulesVersion: "plan-v1" });

    expect(resolveCurrentExecutionPlan(forward)?.planId).toBe("plan-newer");
    expect(resolveCurrentExecutionPlan(reversed)?.planId).toBe("plan-newer");
  });

  it("never selects a stale older plan once a newer plan exists for the same task", () => {
    const older = withOverrides(createPlan(), { planId: "plan-older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = withOverrides(createPlan(), { planId: "plan-newer", createdAt: "2026-01-05T00:00:00.000Z" });
    const collection = createExecutionPlanCollection({ projectId: "daily-proof", plans: [older, newer], rulesVersion: "plan-v1" });

    const result = resolveCurrentExecutionPlan(collection, { projectTaskId: "task-12" });

    expect(result?.planId).not.toBe("plan-older");
  });

  it("dashboard's unfiltered call and Promote's task/candidate-filtered call resolve the same plan when only one task's plans are present", () => {
    const older = withOverrides(createPlan(), { planId: "plan-older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = withOverrides(createPlan(), { planId: "plan-newer", createdAt: "2026-01-05T00:00:00.000Z" });
    const collection = createExecutionPlanCollection({ projectId: "daily-proof", plans: [older, newer], rulesVersion: "plan-v1" });

    const dashboardPlan = resolveCurrentExecutionPlan(collection);
    const promotePlan = resolveCurrentExecutionPlan(collection, { projectTaskId: "task-12", candidateTaskId: "candidate-12" });

    expect(dashboardPlan?.planId).toBe(promotePlan?.planId);
  });

  it("keeps project isolation: a filter never matches a plan belonging to a different project's collection", () => {
    const plan = createPlan();
    const otherProjectCollection = createExecutionPlanCollection({ projectId: "another-project", plans: [plan], rulesVersion: "plan-v1" });

    const result = resolveCurrentExecutionPlan(otherProjectCollection, { projectTaskId: "task-12", candidateTaskId: "candidate-12" });

    expect(result?.planId).toBe(plan.planId);
    expect(otherProjectCollection.projectId).not.toBe(plan.projectId);
  });

  it("keeps existing single-plan behavior unchanged", () => {
    const plan = createPlan();
    const collection = createExecutionPlanCollection({ projectId: "daily-proof", plans: [plan], rulesVersion: "plan-v1" });

    expect(resolveCurrentExecutionPlan(collection)?.planId).toBe(plan.planId);
    expect(resolveCurrentExecutionPlan(collection, { projectTaskId: "task-12", candidateTaskId: "candidate-12" })?.planId).toBe(plan.planId);
  });

  it("returns undefined for an empty or missing collection", () => {
    expect(resolveCurrentExecutionPlan(undefined)).toBeUndefined();
    expect(resolveCurrentExecutionPlan(createExecutionPlanCollection({ projectId: "daily-proof", plans: [], rulesVersion: "plan-v1" }))).toBeUndefined();
  });

  it("filters out plans for a different task/candidate, never letting Promote resolve a plan the dashboard would not (isolation across tasks)", () => {
    const taskAPlan = withOverrides(createPlan(), { planId: "plan-a", projectTaskId: "task-a", candidateTaskId: "candidate-a", createdAt: "2026-01-05T00:00:00.000Z" });
    const taskBPlan = withOverrides(createPlan(), { planId: "plan-b", projectTaskId: "task-b", candidateTaskId: "candidate-b", createdAt: "2026-01-01T00:00:00.000Z" });
    const collection = createExecutionPlanCollection({ projectId: "daily-proof", plans: [taskAPlan, taskBPlan], rulesVersion: "plan-v1" });

    const result = resolveCurrentExecutionPlan(collection, { projectTaskId: "task-b", candidateTaskId: "candidate-b" });

    expect(result?.planId).toBe("plan-b");
  });
});

function withOverrides(plan: ExecutionPlan, overrides: Partial<ExecutionPlan>): ExecutionPlan {
  return { ...plan, ...overrides };
}

function createPlan(): ExecutionPlan {
  return {
    planId: createExecutionPlanId("daily-proof", "session-1"),
    projectId: "daily-proof",
    featureId: "070-execution-plan-foundation",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    recommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    confirmedAssignmentId: "assignment-12",
    preparedSessionId: "prepared-12",
    activeSessionId: "session-1",
    employeeId: "gpt-engineer",
    repositoryId: "github:ai-verse/daily-proof",
    repositoryPath: "C:/repo",
    worktreePath: "C:/repo",
    branchName: "codex/070-execution-plan-foundation",
    specPath: "specs/070-execution-plan-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test"],
    allowedMutationScope: ["local-only"],
    createdAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
  };
}

function createResult(): ExecutionPlanResult {
  return {
    id: createExecutionPlanResultId("daily-proof", "session-1"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    activeSessionId: "session-1",
    planId: createExecutionPlanId("daily-proof", "session-1"),
    status: "Created",
    reasonCodes: ["CREATED"],
    createdPlan: true,
    duplicateExistingPlan: false,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
  };
}
