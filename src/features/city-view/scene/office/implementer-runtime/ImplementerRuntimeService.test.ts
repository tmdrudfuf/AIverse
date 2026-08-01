import { describe, expect, it, vi } from "vitest";

import { EXECUTION_PLAN_RULES_VERSION, createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import {
  EXECUTION_READINESS_RULES_VERSION,
  createExecutionReadinessId,
  createExecutionReadinessResultId,
  type ExecutionReadiness,
  type ExecutionReadinessResult,
} from "../execution-readiness/ExecutionReadinessTypes";
import { HUMAN_EXECUTION_APPROVAL_RULES_VERSION, type HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import {
  RUNTIME_PREFLIGHT_RULES_VERSION,
  createRuntimePreflightId,
  createRuntimePreflightResultId,
  type RuntimePreflight,
  type RuntimePreflightResult,
} from "../runtime-preflight/RuntimePreflightTypes";
import {
  RUNTIME_START_RULES_VERSION,
  createRuntimeStartId,
  createRuntimeStartResultId,
  type RuntimeStart,
  type RuntimeStartResult,
} from "../runtime-start/RuntimeStartTypes";
import type { ImplementerRuntimeProvider, ImplementerRuntimeProviderCommand, ImplementerRuntimeProviderResult } from "./ImplementerRuntimeProvider";
import { ImplementerRuntimeService } from "./ImplementerRuntimeService";
import type { ImplementerRuntimeCommand, ImplementerRuntimeInput } from "./ImplementerRuntimeTypes";

const PROJECT_ID = "daily-proof";
const ACTIVE_SESSION_ID = "session-1";

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const planId = createExecutionPlanId(PROJECT_ID, ACTIVE_SESSION_ID);
  return {
    planId,
    projectId: PROJECT_ID,
    featureId: "075-claude-implementer-runtime-foundation",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: ACTIVE_SESSION_ID,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/worktrees/075",
    branchName: "codex/075-claude-implementer-runtime-foundation",
    specPath: "specs/075-claude-implementer-runtime-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-worktree-only"],
    createdAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: EXECUTION_PLAN_RULES_VERSION,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadiness(plan: ExecutionPlan, overrides: Partial<ExecutionReadiness> = {}): ExecutionReadiness {
  return {
    readinessId: createExecutionReadinessId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadinessResult(readiness: ExecutionReadiness, overrides: Partial<ExecutionReadinessResult> = {}): ExecutionReadinessResult {
  return {
    id: createExecutionReadinessResultId(readiness.projectId, readiness.executionPlanId),
    projectId: readiness.projectId,
    executionPlanId: readiness.executionPlanId,
    readinessId: readiness.readinessId,
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
    evaluatedAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    ...overrides,
  };
}

function createApproval(plan: ExecutionPlan, readiness: ExecutionReadiness, overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
  return {
    approvalId: `${plan.projectId}:approval:${plan.planId}:${HUMAN_EXECUTION_APPROVAL_RULES_VERSION}`,
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    readinessId: readiness.readinessId,
    activeSessionId: plan.activeSessionId,
    projectTaskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    implementerAgent: plan.implementerAgent,
    reviewerAgent: plan.reviewerAgent,
    validationCommands: [...plan.validationCommands],
    allowedMutationScope: [...plan.allowedMutationScope],
    decision: "Approved",
    executionApproved: true,
    approvedAt: "2026-07-30T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflight(plan: ExecutionPlan, approval: HumanExecutionApproval, readiness: ExecutionReadiness, overrides: Partial<RuntimePreflight> = {}): RuntimePreflight {
  return {
    preflightId: createRuntimePreflightId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    readinessId: readiness.readinessId,
    approvalId: approval.approvalId,
    activeSessionId: plan.activeSessionId,
    projectTaskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflightResult(preflight: RuntimePreflight, overrides: Partial<RuntimePreflightResult> = {}): RuntimePreflightResult {
  return {
    id: createRuntimePreflightResultId(preflight.projectId, preflight.executionPlanId),
    projectId: preflight.projectId,
    executionPlanId: preflight.executionPlanId,
    preflightId: preflight.preflightId,
    approvalId: preflight.approvalId,
    readinessId: preflight.readinessId,
    status: "Ready",
    reasonCodes: ["READY"],
    passedCheckCount: 10,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    runtimePreflightPassed: true,
    executionApproved: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    ...overrides,
  };
}

function createRuntimeStart(plan: ExecutionPlan, approval: HumanExecutionApproval, preflight: RuntimePreflight, overrides: Partial<RuntimeStart> = {}): RuntimeStart {
  return {
    runtimeStartId: createRuntimeStartId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    executionReadinessResultId: "readiness-result-1",
    humanExecutionApprovalId: approval.approvalId,
    runtimePreflightId: preflight.preflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    repositoryRoot: plan.repositoryPath,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.allowedMutationScope],
    startedBy: "Local Human",
    startedAt: "2026-07-30T00:00:00.000Z",
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: RUNTIME_START_RULES_VERSION,
    ...overrides,
  };
}

function createRuntimeStartResult(runtimeStart: RuntimeStart, overrides: Partial<RuntimeStartResult> = {}): RuntimeStartResult {
  return {
    id: createRuntimeStartResultId(runtimeStart.projectId, runtimeStart.executionPlanId),
    projectId: runtimeStart.projectId,
    executionPlanId: runtimeStart.executionPlanId,
    runtimeStartId: runtimeStart.runtimeStartId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    approvalId: runtimeStart.humanExecutionApprovalId,
    status: "Started",
    reasonCodes: ["STARTED"],
    started: true,
    duplicateExistingStart: false,
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-07-30T00:00:00.000Z",
    rulesVersion: RUNTIME_START_RULES_VERSION,
    ...overrides,
  };
}

function createValidChain() {
  const plan = createPlan();
  const readiness = createReadiness(plan);
  const readinessResult = createReadinessResult(readiness);
  const approval = createApproval(plan, readiness);
  const preflight = createPreflight(plan, approval, readiness);
  const preflightResult = createPreflightResult(preflight);
  const runtimeStart = createRuntimeStart(plan, approval, preflight);
  const runtimeStartResult = createRuntimeStartResult(runtimeStart);
  return { plan, readiness, readinessResult, approval, preflight, preflightResult, runtimeStart, runtimeStartResult };
}

function createCommand(runtimeStart: RuntimeStart, overrides: Partial<ImplementerRuntimeCommand> = {}): ImplementerRuntimeCommand {
  return {
    projectId: runtimeStart.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    executionPlanId: runtimeStart.executionPlanId,
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    startedBy: "Local Human",
    requestedAt: "2026-07-30T00:00:01.000Z",
    ...overrides,
  };
}

function createInput(chain: ReturnType<typeof createValidChain>, commandOverrides: Partial<ImplementerRuntimeCommand> = {}): ImplementerRuntimeInput {
  return {
    command: createCommand(chain.runtimeStart, commandOverrides),
    executionPlan: chain.plan,
    readiness: chain.readiness,
    readinessResult: chain.readinessResult,
    approval: chain.approval,
    preflight: chain.preflight,
    preflightResult: chain.preflightResult,
    runtimeStart: chain.runtimeStart,
    runtimeStartResult: chain.runtimeStartResult,
  };
}

function createStubProvider(result: ImplementerRuntimeProviderResult): ImplementerRuntimeProvider & { invoke: ReturnType<typeof vi.fn> } {
  const invoke = vi.fn(async (_command: ImplementerRuntimeProviderCommand) => result);
  return { providerId: "claude", invoke };
}

function createCompletedResult(): ImplementerRuntimeProviderResult {
  return {
    status: "Completed",
    evidence: {
      providerId: "claude",
      agentId: "Claude",
      role: "Implementer",
      commandDisplay: "claude --dangerously-skip-permissions -p ...",
      workingDirectory: "C:/worktrees/075",
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      exitCode: 0,
      durationMs: 10,
      stdoutSummary: "ok",
      stderrSummary: "",
      outputTruncated: false,
    },
  };
}

describe("ImplementerRuntimeService", () => {
  it("invokes the provider with the approved command and produces a Completed result on a valid chain", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain));

    expect(outcome.result.status).toBe("Completed");
    expect(outcome.runtime?.status).toBe("Completed");
    expect(outcome.runtime?.agentStarted).toBe(true);
    expect(outcome.runtime?.implementerStarted).toBe(true);
    expect(outcome.runtime?.reviewerStarted).toBe(false);
    expect(outcome.runtime?.validationStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
    expect(provider.invoke).toHaveBeenCalledTimes(1);
  });

  it("passes the approved Claude command (not the repository-default-derived command) to the provider", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    await service.startImplementer(createInput(chain));

    const [providerCommand] = provider.invoke.mock.calls[0]!;
    expect(providerCommand.command).toBe("claude");
    // The generic pipeline label is still "Implementer" (unchanged), which the
    // repository's own normalizeAgentCommand would resolve to "codex" -- proving
    // this service does not consult that default resolver.
    expect(chain.plan.implementerAgent).toBe("Implementer");
    expect(providerCommand.command).not.toBe("codex");
  });

  it("rejects the repository's unswapped default binding (Codex configured as the approved Implementer)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(
      createInput(chain, { approvedImplementerAgent: "codex", approvedReviewerAgent: "claude" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_CLAUDE_NOT_IMPLEMENTER");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("rejects Claude configured as the approved Reviewer even when Claude is also correctly the Implementer", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(
      createInput(chain, { approvedImplementerAgent: "claude", approvedReviewerAgent: "claude" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_CODEX_REVIEWER_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("rejects the same agent bound to both roles under a third, unapproved agent name", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(
      createInput(chain, { approvedImplementerAgent: "gemini", approvedReviewerAgent: "gemini" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_CLAUDE_NOT_IMPLEMENTER");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the generic role labels are inconsistent across the upstream chain", async () => {
    const chain = createValidChain();
    const mismatchedApproval = { ...chain.approval, implementerAgent: "SomethingElse" };
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer({ ...createInput(chain), approval: mismatchedApproval });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_ROLE_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("validates in the documented order and never calls the provider after an upstream block", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const staleReadiness = { ...chain.readiness, status: "Blocked" as const };
    const outcome = await service.startImplementer({ ...createInput(chain), readiness: staleReadiness });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_READINESS_NOT_READY");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the plan has changed since Runtime Start was recorded (stale planId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const changedPlan = { ...chain.plan, planId: "a-different-plan-id-after-recreation" };
    const outcome = await service.startImplementer({ ...createInput(chain), executionPlan: changedPlan });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_PLAN_INVALID");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the approval has changed since Runtime Start was recorded (stale executionPlanId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const changedApproval = { ...chain.approval, executionPlanId: "a-different-plan-id" };
    const outcome = await service.startImplementer({ ...createInput(chain), approval: changedApproval });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_APPROVAL_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the preflight has changed since Runtime Start was recorded (stale preflightId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const changedPreflight = { ...chain.preflight, preflightId: "a-different-preflight-id" };
    const outcome = await service.startImplementer({ ...createInput(chain), preflight: changedPreflight });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the plan is missing", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer({ ...createInput(chain), executionPlan: undefined });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_PLAN_INVALID");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the approval is missing", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer({ ...createInput(chain), approval: undefined });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_APPROVAL_MISSING");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the preflight is not Ready", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const blockedPreflight = { ...chain.preflight, status: "Blocked" as const };
    const outcome = await service.startImplementer({ ...createInput(chain), preflight: blockedPreflight });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_PREFLIGHT_NOT_READY");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when Runtime Start is missing", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer({ ...createInput(chain), runtimeStart: undefined });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_START_MISSING");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when Runtime Start's own agentStarted has already been set (stale/inconsistent state)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const staleRuntimeStart = { ...chain.runtimeStart, agentStarted: true as unknown as false };
    const outcome = await service.startImplementer({ ...createInput(chain), runtimeStart: staleRuntimeStart });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_START_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a worktree mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, worktreePath: "C:/some/other/worktree" };
    const outcome = await service.startImplementer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_WORKTREE_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a branch mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, branch: "some-other-branch" };
    const outcome = await service.startImplementer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_BRANCH_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a specification path mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, specificationPath: "specs/some-other-spec/spec.md" };
    const outcome = await service.startImplementer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_SPEC_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("rejects an actor label equivalent to Claude, Codex, agent, bot, automation, or workflow", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    for (const actor of ["Claude", "Codex", "agent-runner", "MyBot", "automation-script", "release-workflow"]) {
      const outcome = await service.startImplementer(createInput(chain, { startedBy: actor }));
      // Matches RuntimeStartService's own precedent: malformed/invalid-actor
      // command validation reports status "Failed", not "Blocked".
      expect(outcome.result.status).toBe("Failed");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_INVALID_ACTOR");
    }
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks a malformed command missing required fields", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain, { runtimeStartId: "" }));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_MALFORMED");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("returns the existing terminal result idempotently on a repeat request, without invoking the provider again", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const first = await service.startImplementer(createInput(chain));
    expect(provider.invoke).toHaveBeenCalledTimes(1);

    const second = await service.startImplementer({
      ...createInput(chain),
      existingRuntimes: first.runtimeCollection,
      existingResults: first.resultCollection,
    });

    expect(provider.invoke).toHaveBeenCalledTimes(1);
    expect(second.result.status).toBe("Completed");
    expect(second.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_ALREADY_COMPLETED");
  });

  it("maps a Blocked provider result (e.g. browser-guard unavailable) without setting agentStarted/implementerStarted", async () => {
    const chain = createValidChain();
    const provider = createStubProvider({
      status: "Blocked",
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: "claude ...",
        workingDirectory: "C:/worktrees/075",
        started: false,
        completed: false,
        timedOut: false,
        cancelled: false,
        durationMs: 0,
        stdoutSummary: "",
        stderrSummary: "provider unavailable",
        outputTruncated: false,
      },
    });
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain));

    expect(outcome.result.status).toBe("Blocked");
    // A pre-spawn Blocked outcome never creates an ImplementerRuntime record
    // at all (per data-model.md) -- only the result carries the false flags.
    expect(outcome.runtime).toBeUndefined();
    expect(outcome.result.agentStarted).toBe(false);
    expect(outcome.result.implementerStarted).toBe(false);
  });

  it("does not create an ImplementerRuntime record for a Failed provider result (only a result)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider({
      status: "Failed",
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: "claude ...",
        workingDirectory: "C:/worktrees/075",
        started: true,
        completed: false,
        timedOut: false,
        cancelled: false,
        durationMs: 5,
        stdoutSummary: "",
        stderrSummary: "spawn failed",
        outputTruncated: false,
      },
    });
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.runtime).toBeUndefined();
    expect(outcome.runtimeCollection).toBeUndefined();
    expect(outcome.result.agentStarted).toBe(false);
    expect(outcome.result.implementerStarted).toBe(false);
  });

  it("maps a provider exception to a Failed result without setting agentStarted", async () => {
    const chain = createValidChain();
    const provider: ImplementerRuntimeProvider = {
      providerId: "claude",
      invoke: vi.fn(async () => {
        throw new Error("unexpected");
      }),
    };
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.result.agentStarted).toBe(false);
  });

  it("keeps reviewerStarted, validationStarted, and githubMutationStarted false on every outcome status", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createCompletedResult());
    const service = new ImplementerRuntimeService(provider);

    const outcome = await service.startImplementer(createInput(chain));

    expect(outcome.result.reviewerStarted).toBe(false);
    expect(outcome.result.validationStarted).toBe(false);
    expect(outcome.result.githubMutationStarted).toBe(false);
    expect(outcome.runtime?.reviewerStarted).toBe(false);
    expect(outcome.runtime?.validationStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
  });

  describe("command safety uses the exact same shared check the provider itself applies", () => {
    it("blocks a destructive git verb (git commit) that the provider's isSafeCommandLine rejects, without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "git",
        arguments: ["commit", "-m", "oops"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks a cmd /c wrapper that only the additional implementer-specific check rejects, without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "cmd",
        arguments: ["/c", "claude -p hello"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks an -EncodedCommand PowerShell wrapper without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "powershell",
        arguments: ["-EncodedCommand", "ZABlAGwAIAAvAHMA"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("accepts the approved Claude command configuration and reaches the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider);

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Completed");
      expect(provider.invoke).toHaveBeenCalledTimes(1);
    });

    it("blocks a harmless, otherwise-safe command that is not the exact approved Claude configuration, without invoking the provider", async () => {
      // node --version passes every safety-regex check (no destructive verb,
      // no chaining, no GitHub mutation) but is not the approved
      // claude --dangerously-skip-permissions -p {{prompt}} configuration --
      // "safe" must never be treated as a substitute for "approved".
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "node",
        arguments: ["--version"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the arguments differ from the approved configuration even if the command matches", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "claude",
        arguments: ["--dangerously-skip-permissions", "-p", "{{prompt}}", "--extra-flag"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the input mode differs from the approved configuration even if command and arguments match", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createCompletedResult());
      const service = new ImplementerRuntimeService(provider, {
        command: "claude",
        arguments: ["--dangerously-skip-permissions", "-p", "{{prompt}}"],
        inputMode: "stdin",
        timeoutMs: 60000,
      });

      const outcome = await service.startImplementer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });
  });
});
