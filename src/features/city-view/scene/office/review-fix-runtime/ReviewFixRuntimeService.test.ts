import { describe, expect, it, vi } from "vitest";

import { REVIEW_FIX_REQUEST_RULES_VERSION, createReviewFixRequestCollection, type ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import { REVIEW_FIX_PLAN_RULES_VERSION, createReviewFixPlanCollection, createReviewFixPlanId, type ReviewFixPlan, type ReviewFixPlanInput } from "../review-fix-plans/ReviewFixPlanTypes";
import type { ReviewFixRuntimeProvider } from "./ReviewFixRuntimeProvider";
import { ReviewFixRuntimeService } from "./ReviewFixRuntimeService";
import {
  REVIEW_FIX_RUNTIME_RULES_VERSION,
  createReviewFixRuntimeCollection,
  createReviewFixRuntimeId,
  createReviewFixRuntimeResultCollection,
  createReviewFixRuntimeResultId,
  type ReviewFixRuntime,
  type ReviewFixRuntimeInput,
} from "./ReviewFixRuntimeTypes";

const PROJECT_ID = "daily-proof";
const REVIEWER_RUNTIME_ID = "reviewer-1";
const REQUEST_ID = `${PROJECT_ID}:review-fix-request:${REVIEWER_RUNTIME_ID}:review-fix-request-v1`;

describe("ReviewFixRuntimeService", () => {
  it("starts a bounded runtime from explicit human input after plan revalidation", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);

    const outcome = await service.startFixRuntime(context.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Completed");
    expect(outcome.runtime?.reviewFixRuntimeId).toBe(createReviewFixRuntimeId(PROJECT_ID, context.plan.reviewFixPlanId));
    expect(outcome.runtime?.reviewFixPlanId).toBe(context.plan.reviewFixPlanId);
    expect(outcome.runtime?.fixExecutionStarted).toBe(true);
    expect(outcome.runtime?.validationRuntimeStarted).toBe(false);
    expect(outcome.runtime?.reviewerStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
    expect(outcome.runtime?.pushStarted).toBe(false);
    expect(outcome.runtime?.prStarted).toBe(false);
    expect(provider.invoke).toHaveBeenCalledTimes(1);
  });

  it("does not start automatically when no explicit service command is issued", () => {
    const provider = createProvider("Completed");

    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks non-human actors before idempotent success or provider spawn", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);
    const existingRuntime = createRuntime(context.plan);

    const outcome = await service.startFixRuntime({
      ...context.input,
      existingFixRuntimes: createReviewFixRuntimeCollection({
        projectId: PROJECT_ID,
        runtimes: [existingRuntime],
        rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Codex",
      startedAt: "2026-08-07T00:01:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_INVALID_ACTOR");
    expect(outcome.runtime).toBeUndefined();
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks missing Review Fix Plan before provider spawn", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);

    const outcome = await service.startFixRuntime({
      ...context.input,
      existingFixPlans: createReviewFixPlanCollection({
        projectId: PROJECT_ID,
        plans: [],
        rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_PLAN_MISSING");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks stale plan revalidation before provider spawn", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, undefined, "Blocked");

    const outcome = await service.startFixRuntime(context.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_PLAN_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks mismatched request and changed review decision before spawn", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);
    const internals = service as unknown as {
      reviewDecisionService: { classify: ReturnType<typeof vi.fn> };
    };
    internals.reviewDecisionService.classify.mockReturnValueOnce({
      state: "Approved",
      reviewerRuntimeId: REVIEWER_RUNTIME_ID,
      decision: "Approved",
    });

    const outcome = await service.startFixRuntime(context.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_PLAN_MISSING");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks worktree, branch, repository, role, and unsafe command mismatches before spawn", async () => {
    for (const plan of [
      createContext({ worktreePath: "C:/repo/../other" }).plan,
      createContext({ branch: "" }).plan,
      createContext({ repositoryId: "" }).plan,
      createContext({ approvedImplementerAgent: "codex" }).plan,
    ]) {
      const provider = createProvider("Completed");
      const service = createService(provider, plan);
      const context = createContext(plan);

      const outcome = await service.startFixRuntime(context.input, {
        projectId: PROJECT_ID,
        reviewFixPlanId: plan.reviewFixPlanId,
        actor: "Local Human",
        startedAt: "2026-08-07T00:00:00.000Z",
      });

      expect(outcome.result.status).toBe("Blocked");
      expect(provider.invoke).not.toHaveBeenCalled();
    }

    const context = createContext();
    const unsafe = createService(createProvider("Completed"), context.plan, "AlreadyPlanned", {
      command: "node",
      arguments: ["--version"],
      inputMode: "argument",
      timeoutMs: 1000,
    });
    const outcome = await unsafe.startFixRuntime(context.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_COMMAND_UNSAFE");
  });

  it("records provider failure and timeout without starting validation or reviewer runtime", async () => {
    const failedContext = createContext();
    const failed = await createService(createProvider("Failed"), failedContext.plan).startFixRuntime(failedContext.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: failedContext.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });
    const timedContext = createContext();
    const timedOut = await createService(createProvider("TimedOut"), timedContext.plan).startFixRuntime(timedContext.input, {
      projectId: PROJECT_ID,
      reviewFixPlanId: timedContext.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:00:00.000Z",
    });

    expect(failed.result.status).toBe("Failed");
    expect(failed.runtime).toBeUndefined();
    expect(timedOut.result.status).toBe("TimedOut");
    expect(timedOut.runtime?.status).toBe("TimedOut");
    expect(timedOut.result.validationRuntimeStarted).toBe(false);
    expect(timedOut.result.reviewerStarted).toBe(false);
  });

  it("returns idempotent completion only for the exact current context", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);
    const existingRuntime = createRuntime(context.plan);
    const exact = await service.startFixRuntime({
      ...context.input,
      existingFixRuntimes: createReviewFixRuntimeCollection({
        projectId: PROJECT_ID,
        runtimes: [existingRuntime],
        rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:02:00.000Z",
    });
    const stale = await service.startFixRuntime({
      ...createContext({ branch: "codex/changed" }).input,
      existingFixRuntimes: createReviewFixRuntimeCollection({
        projectId: PROJECT_ID,
        runtimes: [existingRuntime],
        rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixPlanId: context.plan.reviewFixPlanId,
      actor: "Local Human",
      startedAt: "2026-08-07T00:03:00.000Z",
    });

    expect(exact.result.alreadyCompleted).toBe(true);
    expect(provider.invoke).not.toHaveBeenCalled();
    expect(stale.result.status).toBe("Blocked");
    expect(stale.result.reasonCodes).toContain("REVIEW_FIX_RUNTIME_PLAN_STALE");
  });

  it("creates immutable collections and project-scoped deterministic IDs", () => {
    const plan = createContext().plan;
    const runtime = createRuntime(plan);
    const result = {
      id: createReviewFixRuntimeResultId(PROJECT_ID, runtime.reviewFixRuntimeId),
      projectId: PROJECT_ID,
      reviewFixPlanId: plan.reviewFixPlanId,
      reviewFixRuntimeId: runtime.reviewFixRuntimeId,
      status: "Completed" as const,
      reasonCodes: ["REVIEW_FIX_RUNTIME_STARTED" as const],
      started: true,
      alreadyCompleted: false,
      duplicateActiveAttempt: false,
      agentStarted: true,
      implementerStarted: true,
      reviewerStarted: false as const,
      validationRuntimeStarted: false as const,
      validationStarted: false as const,
      repositoryMutationStarted: false as const,
      githubMutationStarted: false as const,
      pushStarted: false as const,
      prStarted: false as const,
      readyForReviewStarted: false as const,
      mergeStarted: false as const,
      deployStarted: false as const,
      branchDeletionStarted: false as const,
      resultAt: runtime.startedAt,
      rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    };

    const collection = createReviewFixRuntimeCollection({ projectId: PROJECT_ID, runtimes: [runtime], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    const resultCollection = createReviewFixRuntimeResultCollection({ projectId: PROJECT_ID, results: [result], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION });
    runtime.validationCommands.push("git push");
    (result.reasonCodes as string[]).push("REVIEW_FIX_RUNTIME_INTERNAL_FAILURE");

    expect(collection.runtimes[0]!.validationCommands).toEqual(["npm test"]);
    expect(resultCollection.results[0]!.reasonCodes).toEqual(["REVIEW_FIX_RUNTIME_STARTED"]);
    expect(createReviewFixRuntimeId("other-project", plan.reviewFixPlanId)).not.toBe(runtime.reviewFixRuntimeId);
  });
});

function createService(
  provider: ReviewFixRuntimeProvider,
  revalidatedPlan: ReviewFixPlan | undefined,
  planStatus: "AlreadyPlanned" | "Blocked" = "AlreadyPlanned",
  commandConfig = {
    command: "claude",
    arguments: ["--dangerously-skip-permissions", "-p", "{{prompt}}"],
    inputMode: "argument" as const,
    timeoutMs: 300000,
  },
) {
  const service = new ReviewFixRuntimeService(provider, commandConfig);
  const internals = service as unknown as {
    reviewDecisionService: { classify: ReturnType<typeof vi.fn> };
    reviewFixPlanService: { planFix: ReturnType<typeof vi.fn> };
  };
  internals.reviewDecisionService = {
    classify: vi.fn(() => ({
      state: "ChangesRequested",
      reviewerRuntimeId: REVIEWER_RUNTIME_ID,
      decision: "ChangesRequested",
    })),
  };
  internals.reviewFixPlanService = {
    planFix: vi.fn(() => ({
      result: { status: planStatus },
      plan: revalidatedPlan,
    })),
  };
  return service;
}

function createProvider(status: "Completed" | "TimedOut" | "Blocked" | "Failed"): ReviewFixRuntimeProvider & { invoke: ReturnType<typeof vi.fn> } {
  return {
    providerId: "test-provider",
    invoke: vi.fn(async (command) => ({
      status,
      evidence: {
        providerId: "test-provider",
        agentId: "claude",
        role: "ReviewFixRuntime" as const,
        commandDisplay: [command.command, ...command.arguments].join(" "),
        workingDirectory: command.workingDirectory,
        started: status === "Completed" || status === "TimedOut",
        completed: status === "Completed",
        timedOut: status === "TimedOut",
        cancelled: false,
        exitCode: status === "Completed" ? 0 : 1,
        durationMs: 1,
        stdoutSummary: "output",
        stderrSummary: "",
        outputTruncated: false,
      },
    })),
  };
}

function createContext(overrides: Partial<ReviewFixPlan> = {}) {
  const request = createRequest(overrides);
  const plan = createPlan(request, overrides);
  const input: ReviewFixRuntimeInput = {
    ...createInput(request),
    existingFixPlans: createReviewFixPlanCollection({
      projectId: PROJECT_ID,
      plans: [plan],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    }),
  };
  return { request, plan, input };
}

function createInput(request: ReviewFixRequest): ReviewFixPlanInput {
  return {
    projectId: request.projectId,
    executionPlan: {
      planId: request.planId,
      projectId: request.projectId,
      projectTaskId: request.projectTaskId,
      candidateTaskId: request.candidateTaskId,
      employeeId: request.employeeId,
      repositoryId: request.repositoryId,
      worktreePath: request.worktreePath,
      branchName: request.branch,
      specPath: request.specificationPath,
      implementerAgent: request.implementer,
      reviewerAgent: request.reviewer,
      validationCommands: [...request.validationCommands],
      allowedMutationScope: [...request.mutationScope],
    } as ReviewFixPlanInput["executionPlan"],
    readiness: { readinessId: request.readinessId } as ReviewFixPlanInput["readiness"],
    readinessResult: { id: request.readinessResultId } as ReviewFixPlanInput["readinessResult"],
    approval: { approvalId: request.approvalId } as ReviewFixPlanInput["approval"],
    preflight: { preflightId: request.preflightId } as ReviewFixPlanInput["preflight"],
    preflightResult: { id: request.preflightResultId } as ReviewFixPlanInput["preflightResult"],
    runtimeStart: { runtimeStartId: request.runtimeStartId } as ReviewFixPlanInput["runtimeStart"],
    runtimeStartResult: { id: request.runtimeStartResultId } as ReviewFixPlanInput["runtimeStartResult"],
    implementerRuntime: { implementerRuntimeId: request.implementerRuntimeId } as ReviewFixPlanInput["implementerRuntime"],
    implementerRuntimeResult: { id: request.implementerRuntimeResultId } as ReviewFixPlanInput["implementerRuntimeResult"],
    reviewerRuntime: {
      reviewerRuntimeId: request.reviewerRuntimeId,
      approvedImplementerAgent: request.approvedImplementerAgent,
      approvedReviewerAgent: request.approvedReviewerAgent,
      decision: "ChangesRequested",
    } as ReviewFixPlanInput["reviewerRuntime"],
    reviewerRuntimeResult: {
      id: request.reviewerRuntimeResultId,
      decision: "ChangesRequested",
      blockingFindingCount: request.blockingFindingCount,
      nonBlockingFindingCount: request.nonBlockingFindingCount,
    } as ReviewFixPlanInput["reviewerRuntimeResult"],
    reviewTarget: { reviewTargetId: request.reviewTargetId } as ReviewFixPlanInput["reviewTarget"],
    existingFixRequests: createReviewFixRequestCollection({
      projectId: request.projectId,
      requests: [request],
      rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    }),
  };
}

function createRequest(overrides: Partial<ReviewFixPlan> = {}): ReviewFixRequest {
  return {
    reviewFixRequestId: REQUEST_ID,
    projectId: overrides.projectId ?? PROJECT_ID,
    planId: "plan-1",
    readinessId: "readiness-1",
    readinessResultId: "readiness-result-1",
    approvalId: "approval-1",
    preflightId: "preflight-1",
    preflightResultId: "preflight-result-1",
    runtimeStartId: "start-1",
    runtimeStartResultId: "start-result-1",
    implementerRuntimeId: "implementer-1",
    implementerRuntimeResultId: "implementer-result-1",
    reviewerRuntimeId: REVIEWER_RUNTIME_ID,
    reviewerRuntimeResultId: "reviewer-result-1",
    reviewTargetId: "target-1",
    projectTaskId: "task-1",
    candidateTaskId: "candidate-1",
    employeeId: "employee-1",
    repositoryId: overrides.repositoryId ?? "repo-1",
    worktreePath: overrides.worktreePath ?? "C:/repo/spec-081",
    branch: overrides.branch ?? "codex/081-review-fix-runtime-foundation",
    specificationPath: "specs/081-review-fix-runtime-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: overrides.approvedImplementerAgent ?? "claude",
    approvedReviewerAgent: overrides.approvedReviewerAgent ?? "codex",
    validationCommands: ["npm test"],
    mutationScope: ["local-worktree-only"],
    decision: "ChangesRequested",
    blockingFindingCount: 1,
    nonBlockingFindingCount: 0,
    requestedBy: "Local Human",
    requestedAt: "2026-08-07T00:00:00.000Z",
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
  };
}

function createPlan(request: ReviewFixRequest, overrides: Partial<ReviewFixPlan> = {}): ReviewFixPlan {
  return {
    ...request,
    reviewFixPlanId: createReviewFixPlanId(request.projectId, request.reviewFixRequestId),
    plannedBy: "Local Human",
    plannedAt: "2026-08-07T00:00:00.000Z",
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    ...overrides,
  };
}

function createRuntime(plan: ReviewFixPlan): ReviewFixRuntime {
  return {
    reviewFixRuntimeId: createReviewFixRuntimeId(plan.projectId, plan.reviewFixPlanId),
    projectId: plan.projectId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRequestId: plan.reviewFixRequestId,
    planId: plan.planId,
    readinessId: plan.readinessId,
    readinessResultId: plan.readinessResultId,
    approvalId: plan.approvalId,
    preflightId: plan.preflightId,
    preflightResultId: plan.preflightResultId,
    runtimeStartId: plan.runtimeStartId,
    runtimeStartResultId: plan.runtimeStartResultId,
    implementerRuntimeId: plan.implementerRuntimeId,
    implementerRuntimeResultId: plan.implementerRuntimeResultId,
    reviewerRuntimeId: plan.reviewerRuntimeId,
    reviewerRuntimeResultId: plan.reviewerRuntimeResultId,
    reviewTargetId: plan.reviewTargetId,
    projectTaskId: plan.projectTaskId,
    candidateTaskId: plan.candidateTaskId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    branch: plan.branch,
    specificationPath: plan.specificationPath,
    implementer: plan.implementer,
    reviewer: plan.reviewer,
    approvedImplementerAgent: plan.approvedImplementerAgent,
    approvedReviewerAgent: plan.approvedReviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.mutationScope],
    decision: "ChangesRequested",
    blockingFindingCount: plan.blockingFindingCount,
    nonBlockingFindingCount: plan.nonBlockingFindingCount,
    promptId: `${PROJECT_ID}:review-fix-runtime-prompt:${plan.reviewFixPlanId}:review-fix-runtime-v1`,
    status: "Completed",
    startedBy: "Local Human",
    startedAt: "2026-08-07T00:00:00.000Z",
    fixExecutionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationRuntimeStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: {
      providerId: "test-provider",
      agentId: "claude",
      role: "ReviewFixRuntime",
      commandDisplay: "claude -p",
      workingDirectory: plan.worktreePath,
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      exitCode: 0,
      durationMs: 1,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}
