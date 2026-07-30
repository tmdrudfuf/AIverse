import { describe, expect, it } from "vitest";

import { createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import { createExecutionReadinessId, type ExecutionReadiness, type ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import { HumanExecutionApprovalService } from "./HumanExecutionApprovalService";
import {
  createHumanExecutionApprovalCollection,
  createHumanExecutionApprovalId,
  type HumanExecutionApproval,
} from "./HumanExecutionApprovalTypes";

describe("HumanExecutionApprovalService", () => {
  it("records an explicit human approval for a current Ready context", () => {
    const outcome = new HumanExecutionApprovalService().approve(validInput());

    expect(outcome.result).toMatchObject({
      status: "Approved",
      reasonCodes: ["APPROVED"],
      approved: true,
      executionApproved: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.approval).toMatchObject({
      approvalId: createHumanExecutionApprovalId("daily-proof", createPlan().planId),
      approvedBy: "Local Human",
      executionApproved: true,
      executionStarted: false,
    });
    expect(outcome.approvalCollection?.approvals).toHaveLength(1);
  });

  it("returns AlreadyApproved only for the exact current context", () => {
    const plan = createPlan();
    const readinessId = createExecutionReadinessId("daily-proof", plan.planId);
    const approval = createApproval({
      approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId),
      executionPlanId: plan.planId,
      readinessId,
    });
    const outcome = new HumanExecutionApprovalService().approve(validInput({
      executionPlan: plan,
      existingApprovals: createHumanExecutionApprovalCollection({
        projectId: "daily-proof",
        approvals: [approval],
        rulesVersion: "approval-v1",
      }),
    }));

    expect(outcome.result).toMatchObject({
      status: "AlreadyApproved",
      reasonCodes: ["ALREADY_APPROVED"],
      duplicateExistingApproval: true,
      executionApproved: true,
    });
    expect(outcome.approvalCollection).toBeUndefined();
  });

  it("blocks stale approval reuse when current context changed", () => {
    const plan = createPlan({ employeeId: "employee-2" });
    const approval = createApproval({ approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId), executionPlanId: plan.planId });

    const outcome = new HumanExecutionApprovalService().approve(validInput({
      executionPlan: plan,
      existingApprovals: createHumanExecutionApprovalCollection({
        projectId: "daily-proof",
        approvals: [approval],
        rulesVersion: "approval-v1",
      }),
    }));

    expect(outcome.result).toMatchObject({
      status: "Blocked",
      reasonCodes: ["APPROVAL_CONTEXT_MISMATCH"],
      approved: false,
      executionApproved: false,
    });
    expect(outcome.approvalCollection).toBeUndefined();
  });

  it("blocks AlreadyApproved when role or mutation context changed", () => {
    const plan = createPlan({ validationCommands: ["npm test", "npm run build"] });
    const readinessId = createExecutionReadinessId("daily-proof", plan.planId);
    const approval = createApproval({
      approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId),
      executionPlanId: plan.planId,
      readinessId,
      validationCommands: ["npm test"],
    });

    const outcome = new HumanExecutionApprovalService().approve(validInput({
      executionPlan: plan,
      existingApprovals: createHumanExecutionApprovalCollection({
        projectId: "daily-proof",
        approvals: [approval],
        rulesVersion: "approval-v1",
      }),
    }));

    expect(outcome.result).toMatchObject({
      status: "Blocked",
      reasonCodes: ["APPROVAL_CONTEXT_MISMATCH"],
      approved: false,
    });
  });


  it("blocks non-human approver labels", () => {
    for (const approvedBy of ["Codex", "Claude", "automation bot"]) {
      const outcome = new HumanExecutionApprovalService().approve(validInput({ approvedBy }));
      expect(outcome.result).toMatchObject({
        status: "Blocked",
        reasonCodes: ["APPROVER_NOT_HUMAN"],
      });
    }
  });

  it("blocks missing, unsafe, or non-Ready prerequisites without approval", () => {
    expect(new HumanExecutionApprovalService().approve(validInput({ executionPlan: undefined })).result.reasonCodes)
      .toEqual(["EXECUTION_PLAN_MISSING"]);
    expect(new HumanExecutionApprovalService().approve(validInput({ executionPlan: createPlan({ executionStarted: true as false }) })).result.reasonCodes)
      .toEqual(["EXECUTION_PLAN_ALREADY_STARTED"]);
    expect(new HumanExecutionApprovalService().approve(validInput({ readiness: createReadiness({ status: "Blocked" }) })).result.reasonCodes)
      .toEqual(["READINESS_NOT_READY"]);
    expect(new HumanExecutionApprovalService().approve(validInput({ readinessResult: createReadinessResult({ status: "Failed", failedCheckCount: 1 }) })).result.reasonCodes)
      .toEqual(["READINESS_NOT_READY"]);
    expect(new HumanExecutionApprovalService().approve(validInput({ readiness: createReadiness({ executionStarted: true as false }) })).result.reasonCodes)
      .toEqual(["READINESS_ALREADY_STARTED"]);
  });

  it("requires an approval store and a well formed command", () => {
    expect(new HumanExecutionApprovalService().approve(validInput({ existingApprovals: undefined })).result).toMatchObject({
      status: "Failed",
      reasonCodes: ["APPROVAL_STORE_UNAVAILABLE"],
    });
    expect(new HumanExecutionApprovalService().approve(validInput({ projectId: "" })).result).toMatchObject({
      status: "Failed",
      reasonCodes: ["APPROVAL_MALFORMED"],
    });
  });

  it("does not import runtime, filesystem, Git, or GitHub execution APIs", async () => {
    const source = await import("node:fs/promises")
      .then((fs) => fs.readFile(new URL("./HumanExecutionApprovalService.ts", import.meta.url), "utf8"));

    expect(source).not.toMatch(/child_process|execSync|spawn|Codex|Claude|git |gh |fs\.|readFileSync|existsSync/);
  });
});

function validInput(overrides: {
  projectId?: string;
  approvedBy?: string;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  existingApprovals?: ReturnType<typeof createHumanExecutionApprovalCollection>;
} = {}) {
  const projectId = overrides.projectId ?? "daily-proof";
  const executionPlan = "executionPlan" in overrides ? overrides.executionPlan : createPlan({ projectId });
  const readiness = "readiness" in overrides ? overrides.readiness : createReadiness({ projectId, executionPlanId: executionPlan?.planId });
  const readinessResult = "readinessResult" in overrides
    ? overrides.readinessResult
    : createReadinessResult({ projectId, executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId });
  return {
    command: {
      projectId,
      executionPlanId: executionPlan?.planId ?? "plan-1",
      readinessId: readiness?.readinessId ?? "readiness-1",
      approvedBy: overrides.approvedBy ?? "Local Human",
      requestedAt: "2026-01-07T00:00:00.000Z",
    },
    executionPlan,
    readiness,
    readinessResult,
    existingApprovals: "existingApprovals" in overrides
      ? overrides.existingApprovals
      : createHumanExecutionApprovalCollection({ projectId, approvals: [], rulesVersion: "approval-v1" }),
  };
}

function createApproval(overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
  return {
    approvalId: createHumanExecutionApprovalId("daily-proof", "plan-1"),
    projectId: "daily-proof",
    executionPlanId: "plan-1",
    readinessId: "readiness-1",
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test"],
    allowedMutationScope: ["local-files"],
    decision: "Approved",
    executionApproved: true,
    approvedAt: "2026-01-07T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: "approval-v1",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

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
    validationCommands: ["npm test"],
    allowedMutationScope: ["local-files"],
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

function createReadiness(overrides: Partial<ExecutionReadiness> = {}): ExecutionReadiness {
  const projectId = overrides.projectId ?? "daily-proof";
  const executionPlanId = overrides.executionPlanId ?? createExecutionPlanId(projectId, "session-1");
  return {
    readinessId: createExecutionReadinessId(projectId, executionPlanId),
    projectId,
    executionPlanId,
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadinessResult(overrides: Partial<ExecutionReadinessResult> = {}): ExecutionReadinessResult {
  const projectId = overrides.projectId ?? "daily-proof";
  const executionPlanId = overrides.executionPlanId ?? createExecutionPlanId(projectId, "session-1");
  return {
    id: `${projectId}:execution-readiness-result:${executionPlanId}:readiness-v1`,
    projectId,
    executionPlanId,
    readinessId: createExecutionReadinessId(projectId, executionPlanId),
    status: "Ready",
    reasonCodes: ["READY"],
    primaryReason: "READY",
    passedCheckCount: 10,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    ...overrides,
  };
}
