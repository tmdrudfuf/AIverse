import { describe, expect, it } from "vitest";

import type { ExecutionPlan, ExecutionPlanCollection, ExecutionPlanResult, ExecutionPlanResultCollection } from "./ExecutionPlanTypes";
import { createExecutionPlanDisplayRows } from "./ExecutionPlanView";

describe("ExecutionPlanView", () => {
  it("renders plan-ready state without implying execution", () => {
    const rows = createExecutionPlanDisplayRows(planCollection([plan()]), resultCollection([result("Created")]));

    expect(rows.statusText).toBe("1 execution plan");
    expect(rows.resultText).toContain("Execution Plan Ready");
    expect(rows.resultText).toContain("Execution Not Started");
    expect(rows.resultText).toContain("Awaiting Readiness Validation");
    expect(rows.planText).toContain("Implementer");
    expect(rows.planText).toContain("Reviewer");
    expect(`${rows.resultText} ${rows.planText}`).not.toMatch(/Running|Executing|Coding|Reviewing/);
  });

  it("renders already-existing, blocked, and failed states", () => {
    expect(createExecutionPlanDisplayRows(undefined, resultCollection([result("AlreadyExists")])).resultText).toContain("Execution Plan Exists");
    expect(createExecutionPlanDisplayRows(undefined, resultCollection([result("Blocked")])).resultText).toContain("Execution Plan Blocked");
    expect(createExecutionPlanDisplayRows(undefined, resultCollection([result("Failed")])).resultText).toContain("Execution Plan Failed");
    expect(createExecutionPlanDisplayRows(undefined, resultCollection([result("Blocked")])).resultText).toContain("Not started");
  });

  it("bounds long fields and reports additional plans", () => {
    const rows = createExecutionPlanDisplayRows(planCollection([
      plan(),
      plan({
        planId: "daily-proof:execution-plan:very-long-active-session-identifier-that-needs-clamping:plan-v1",
        branchName: "codex/070-execution-plan-foundation-with-a-very-long-branch-name",
        worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070-with-extra-long-path",
      }),
    ]), resultCollection([result("Created"), result("AlreadyExists")]));

    expect(rows.planText).toContain("+1 more");
    expect(rows.resultText).toContain("+1 more");
    expect(rows.planText!.length).toBeLessThan(220);
  });

  it("handles absent and empty collections", () => {
    expect(createExecutionPlanDisplayRows(undefined, undefined).statusText).toBe("No execution plans");
    expect(createExecutionPlanDisplayRows(planCollection([]), resultCollection([])).statusText).toBe("No execution plans");
  });
});

function plan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  return {
    planId: "daily-proof:execution-plan:session-1:plan-v1",
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
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-only"],
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

function result(status: ExecutionPlanResult["status"]): ExecutionPlanResult {
  return {
    id: "daily-proof:execution-plan-result:session-1:plan-v1",
    projectId: "daily-proof",
    projectTaskId: "task-12",
    activeSessionId: "session-1",
    planId: "daily-proof:execution-plan:session-1:plan-v1",
    status,
    reasonCodes: status === "Created" ? ["CREATED"] : ["PROJECT_MISMATCH"],
    createdPlan: status === "Created",
    duplicateExistingPlan: status === "AlreadyExists",
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-01-05T00:00:00.000Z",
    rulesVersion: "plan-v1",
  };
}

function planCollection(plans: ExecutionPlan[]): ExecutionPlanCollection {
  return { projectId: "daily-proof", plans, planCount: plans.length, rulesVersion: "plan-v1" };
}

function resultCollection(results: ExecutionPlanResult[]): ExecutionPlanResultCollection {
  return { projectId: "daily-proof", results, resultCount: results.length, rulesVersion: "plan-v1" };
}
