import { describe, expect, it } from "vitest";

import {
  createExecutionPlanCollection,
  createExecutionPlanId,
  createExecutionPlanResultCollection,
  createExecutionPlanResultId,
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
