import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import { RepresentedRuntimeEnvironmentProvider, isSafeCommandLine } from "./RuntimePreflightProvider";

describe("RepresentedRuntimeEnvironmentProvider", () => {
  it("creates bounded provider-neutral evidence from the approved Execution Plan", () => {
    const plan = createPlan();
    const evidence = new RepresentedRuntimeEnvironmentProvider().inspect({
      projectId: plan.projectId,
      executionPlan: plan,
      approvedCommands: plan.validationCommands,
      approvedMutationScope: plan.allowedMutationScope,
    });

    expect(evidence.repository).toMatchObject({
      projectId: "daily-proof",
      repositoryId: "repo-1",
      pathExists: true,
      isDirectory: true,
      isGitRepository: true,
      normalizedPath: "C:/repo",
    });
    expect(evidence.worktree).toMatchObject({
      normalizedPath: "C:/repo",
      isPrimaryWorktree: false,
    });
    expect(evidence.branch.currentBranch).toBe("codex/070-execution-plan-foundation");
    expect(evidence.validationCommands.commands).toEqual(plan.validationCommands);
    expect(evidence.mutationScope.scope).toEqual(plan.allowedMutationScope);
  });

  it("marks main in the primary repository path as primary worktree evidence", () => {
    const plan = createPlan({ branchName: "main" });
    const evidence = new RepresentedRuntimeEnvironmentProvider().inspect({
      projectId: plan.projectId,
      executionPlan: plan,
      approvedCommands: plan.validationCommands,
      approvedMutationScope: plan.allowedMutationScope,
    });

    expect(evidence.worktree.isPrimaryWorktree).toBe(true);
  });

  it("validates configured command and arguments together before spawn-capable checks", () => {
    expect(isSafeCommandLine("codex --version")).toBe(true);
    expect(isSafeCommandLine("claude --version")).toBe(true);
    expect(isSafeCommandLine("git push origin feature")).toBe(false);
    expect(isSafeCommandLine("gh pr create --fill")).toBe(false);
    expect(isSafeCommandLine("powershell -Command git push")).toBe(false);
    expect(isSafeCommandLine("rm -rf C:/repo")).toBe(false);
  });

  it("does not inspect real paths, spawn processes, or run validation commands in product code", () => {
    const source = readFileSync(new URL("./RuntimePreflightProvider.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from "node:|child_process|spawn\(|execSync|existsSync|statSync|readFileSync|writeFileSync/);
  });
});

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const projectId = overrides.projectId ?? "daily-proof";
  const activeSessionId = overrides.activeSessionId ?? "session-1";
  return {
    planId: createExecutionPlanId(projectId, activeSessionId),
    projectId,
    featureId: "070-execution-plan-foundation",
    projectTaskId: "task-1",
    candidateTaskId: "candidate-1",
    recommendationId: "recommendation-1",
    promotionDecisionId: "promotion-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/repo",
    branchName: "codex/070-execution-plan-foundation",
    specPath: "specs/070-execution-plan-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit", "npm run build"],
    allowedMutationScope: ["local-worktree-only", "no-github-mutation"],
    createdAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "plan-v1",
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}
