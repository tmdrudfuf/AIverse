import { describe, expect, it, vi } from "vitest";

import { REVIEW_FIX_PLAN_RULES_VERSION, createReviewFixPlanCollection, createReviewFixPlanId, type ReviewFixPlan, type ReviewFixPlanInput } from "../review-fix-plans/ReviewFixPlanTypes";
import { REVIEW_FIX_REQUEST_RULES_VERSION, createReviewFixRequestCollection, type ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import { REVIEW_FIX_RUNTIME_RULES_VERSION, createReviewFixRuntimeCollection, createReviewFixRuntimeId, createReviewFixRuntimeResultCollection, createReviewFixRuntimeResultId, type ReviewFixRuntime, type ReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeTypes";
import type { ValidationRuntimeProvider } from "./ValidationRuntimeProvider";
import { ValidationRuntimeService } from "./ValidationRuntimeService";
import {
  VALIDATION_RUNTIME_RULES_VERSION,
  createValidationRuntimeCollection,
  createValidationRuntimeId,
  createValidationRuntimeResultCollection,
  type ValidationRuntime,
  type ValidationRuntimeInput,
} from "./ValidationRuntimeTypes";

const PROJECT_ID = "daily-proof";
const REVIEWER_RUNTIME_ID = "reviewer-1";
const REQUEST_ID = `${PROJECT_ID}:review-fix-request:${REVIEWER_RUNTIME_ID}:review-fix-request-v1`;

describe("ValidationRuntimeService", () => {
  it("runs only configured validation commands after completed Review Fix Runtime revalidation", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);

    const outcome = await service.startValidation(context.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Completed");
    expect(outcome.runtime?.validationRuntimeId).toBe(createValidationRuntimeId(PROJECT_ID, context.runtime.reviewFixRuntimeId));
    expect(outcome.runtime?.validationCommands).toEqual(["npm test", "npx tsc --noEmit"]);
    expect(outcome.runtime?.expectedHead).toBe("review-target-sha-1");
    expect(outcome.runtime?.validationRuntimeStarted).toBe(true);
    expect(outcome.runtime?.validationStarted).toBe(true);
    expect(outcome.runtime?.reviewerStarted).toBe(false);
    expect(outcome.runtime?.reviewTargetCreated).toBe(false);
    expect(outcome.runtime?.promotionStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
    expect(provider.invoke).toHaveBeenCalledWith({
      workingDirectory: context.plan.worktreePath,
      expectedHead: "review-target-sha-1",
      commands: ["npm test", "npx tsc --noEmit"],
      timeoutMs: 300000,
    });
  });

  it("blocks stale or incomplete context before command execution", async () => {
    const context = createContext();
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);

    const missingResult = await service.startValidation({
      ...context.input,
      existingFixRuntimeResults: createReviewFixRuntimeResultCollection({
        projectId: PROJECT_ID,
        results: [],
        rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });
    const stalePlan = await createService(provider, createContext({ branch: "codex/changed" }).plan).startValidation(context.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(missingResult.result.status).toBe("Blocked");
    expect(missingResult.result.reasonCodes).toContain("VALIDATION_RUNTIME_CONTEXT_MISSING");
    expect(stalePlan.result.status).toBe("Blocked");
    expect(stalePlan.result.reasonCodes).toContain("VALIDATION_RUNTIME_CONTEXT_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("requires a completed Review Fix Runtime and human actor", async () => {
    const context = createContext(undefined, "TimedOut");
    const provider = createProvider("Completed");
    const service = createService(provider, context.plan);

    const automated = await service.startValidation(context.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      actor: "Codex",
      startedAt: "2026-08-08T00:00:00.000Z",
    });
    const notCompleted = await service.startValidation(context.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(automated.result.reasonCodes).toContain("VALIDATION_RUNTIME_INVALID_ACTOR");
    expect(notCompleted.result.reasonCodes).toContain("VALIDATION_RUNTIME_REVIEW_FIX_NOT_COMPLETED");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("records command failure and timeout without starting review or GitHub mutation", async () => {
    const failedContext = createContext();
    const failed = await createService(createProvider("Failed"), failedContext.plan).startValidation(failedContext.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: failedContext.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });
    const timeoutContext = createContext();
    const timedOut = await createService(createProvider("TimedOut"), timeoutContext.plan).startValidation(timeoutContext.input, {
      projectId: PROJECT_ID,
      reviewFixRuntimeId: timeoutContext.runtime.reviewFixRuntimeId,
      actor: "Local Human",
      startedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(failed.result.status).toBe("Failed");
    expect(failed.runtime?.evidence.failedCommandCount).toBe(1);
    expect(failed.runtime?.reviewerStarted).toBe(false);
    expect(timedOut.result.status).toBe("TimedOut");
    expect(timedOut.runtime?.evidence.timedOutCommandCount).toBe(1);
    expect(timedOut.runtime?.githubMutationStarted).toBe(false);
  });

  it("creates immutable collections and deterministic project-scoped IDs", () => {
    const context = createContext();
    const runtime = createValidationRuntime(context.plan, context.runtime, context.runtimeResult.id);
    const result = {
      id: `${PROJECT_ID}:validation-runtime-result:${runtime.validationRuntimeId}:validation-runtime-v1`,
      projectId: PROJECT_ID,
      reviewFixRuntimeId: context.runtime.reviewFixRuntimeId,
      validationRuntimeId: runtime.validationRuntimeId,
      status: "Completed" as const,
      reasonCodes: ["VALIDATION_RUNTIME_STARTED" as const],
      started: true,
      alreadyCompleted: false,
      commandCount: 1,
      completedCommandCount: 1,
      failedCommandCount: 0,
      timedOutCommandCount: 0,
      validationRuntimeStarted: true,
      validationStarted: true,
      commandExecutionStarted: true,
      reviewerStarted: false as const,
      reviewTargetCreated: false as const,
      promotionStarted: false as const,
      repositoryMutationStarted: false as const,
      githubMutationStarted: false as const,
      pushStarted: false as const,
      prStarted: false as const,
      readyForReviewStarted: false as const,
      mergeStarted: false as const,
      deployStarted: false as const,
      branchDeletionStarted: false as const,
      resultAt: runtime.startedAt,
      rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
    };

    const collection = createValidationRuntimeCollection({ projectId: PROJECT_ID, runtimes: [runtime], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });
    const resultCollection = createValidationRuntimeResultCollection({ projectId: PROJECT_ID, results: [result], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION });
    runtime.validationCommands.push("git push");
    runtime.evidence.commands[0]!.stdoutSummary = "mutated";
    (result.reasonCodes as string[]).push("VALIDATION_RUNTIME_INTERNAL_FAILURE");

    expect(collection.runtimes[0]!.validationCommands).toEqual(["npm test"]);
    expect(collection.runtimes[0]!.evidence.commands[0]!.stdoutSummary).toBe("ok");
    expect(resultCollection.results[0]!.reasonCodes).toEqual(["VALIDATION_RUNTIME_STARTED"]);
    expect(createValidationRuntimeId("other", context.runtime.reviewFixRuntimeId)).not.toBe(runtime.validationRuntimeId);
  });
});

function createService(
  provider: ValidationRuntimeProvider & { invoke: ReturnType<typeof vi.fn> },
  revalidatedPlan: ReviewFixPlan | undefined,
  planStatus: "AlreadyPlanned" | "Blocked" = "AlreadyPlanned",
) {
  const service = new ValidationRuntimeService(provider);
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

function createProvider(status: "Completed" | "TimedOut" | "Blocked" | "Failed"): ValidationRuntimeProvider & { invoke: ReturnType<typeof vi.fn> } {
  return {
    providerId: "test-validation",
    invoke: vi.fn(async (command) => ({
      status,
      evidence: {
        providerId: "test-validation",
        role: "ValidationRuntime" as const,
        workingDirectory: command.workingDirectory,
        expectedHead: command.expectedHead,
        commandCount: command.commands.length,
        completedCommandCount: status === "Completed" ? command.commands.length : 0,
        failedCommandCount: status === "Failed" ? 1 : 0,
        timedOutCommandCount: status === "TimedOut" ? 1 : 0,
        commands: command.commands.map((commandDisplay: string, index: number) => ({
          commandDisplay,
          started: status !== "Blocked",
          completed: status === "Completed",
          timedOut: status === "TimedOut" && index === 0,
          exitCode: status === "Completed" ? 0 : 1,
          durationMs: 1,
          stdoutSummary: "ok",
          stderrSummary: status === "Failed" ? "failed" : "",
          outputTruncated: false,
        })),
      },
    })),
  };
}

function createContext(overrides: Partial<ReviewFixPlan> = {}, runtimeStatus: ReviewFixRuntime["status"] = "Completed") {
  const request = createRequest(overrides);
  const plan = createPlan(request, overrides);
  const runtime = createReviewFixRuntime(plan, runtimeStatus);
  const runtimeResult = createReviewFixRuntimeResult(plan, runtime);
  const input: ValidationRuntimeInput = {
    ...createInput(request),
    reviewTarget: { reviewTargetId: request.reviewTargetId, reviewTargetSha: "review-target-sha-1" } as ValidationRuntimeInput["reviewTarget"],
    existingFixPlans: createReviewFixPlanCollection({
      projectId: PROJECT_ID,
      plans: [plan],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    }),
    existingFixRuntimes: createReviewFixRuntimeCollection({
      projectId: PROJECT_ID,
      runtimes: [runtime],
      rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    }),
    existingFixRuntimeResults: createReviewFixRuntimeResultCollection({
      projectId: PROJECT_ID,
      results: [runtimeResult],
      rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    }),
  };
  return { request, plan, runtime, runtimeResult, input };
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
    reviewTarget: { reviewTargetId: request.reviewTargetId, reviewTargetSha: "review-target-sha-1" } as ReviewFixPlanInput["reviewTarget"],
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
    worktreePath: overrides.worktreePath ?? "C:/repo/spec-082",
    branch: overrides.branch ?? "codex/082-validation-runtime-foundation",
    specificationPath: "specs/082-validation-runtime-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    mutationScope: ["local-worktree-only"],
    decision: "ChangesRequested",
    blockingFindingCount: 1,
    nonBlockingFindingCount: 0,
    requestedBy: "Local Human",
    requestedAt: "2026-08-08T00:00:00.000Z",
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
    plannedAt: "2026-08-08T00:00:00.000Z",
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    ...overrides,
  };
}

function createReviewFixRuntime(plan: ReviewFixPlan, status: ReviewFixRuntime["status"]): ReviewFixRuntime {
  return {
    ...plan,
    reviewFixRuntimeId: createReviewFixRuntimeId(plan.projectId, plan.reviewFixPlanId),
    promptId: "prompt-1",
    status,
    startedBy: "Local Human",
    startedAt: "2026-08-08T00:00:00.000Z",
    fixExecutionStarted: true,
    agentStarted: status === "Completed" || status === "TimedOut",
    implementerStarted: status === "Completed" || status === "TimedOut",
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
      started: status === "Completed" || status === "TimedOut",
      completed: status === "Completed",
      timedOut: status === "TimedOut",
      cancelled: false,
      exitCode: status === "Completed" ? 0 : 1,
      durationMs: 1,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}

function createReviewFixRuntimeResult(plan: ReviewFixPlan, runtime: ReviewFixRuntime): ReviewFixRuntimeResult {
  return {
    id: createReviewFixRuntimeResultId(PROJECT_ID, runtime.reviewFixRuntimeId),
    projectId: PROJECT_ID,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: runtime.reviewFixRuntimeId,
    status: runtime.status,
    reasonCodes: [runtime.status === "Completed" ? "REVIEW_FIX_RUNTIME_STARTED" : "REVIEW_FIX_RUNTIME_TIMED_OUT"],
    started: runtime.status === "Completed" || runtime.status === "TimedOut",
    alreadyCompleted: false,
    duplicateActiveAttempt: false,
    agentStarted: runtime.status === "Completed" || runtime.status === "TimedOut",
    implementerStarted: runtime.status === "Completed" || runtime.status === "TimedOut",
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
    resultAt: runtime.startedAt,
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}

function createValidationRuntime(
  plan: ReviewFixPlan,
  reviewFixRuntime: ReviewFixRuntime,
  reviewFixRuntimeResultId: string,
): ValidationRuntime {
  return {
    validationRuntimeId: createValidationRuntimeId(PROJECT_ID, reviewFixRuntime.reviewFixRuntimeId),
    projectId: PROJECT_ID,
    reviewFixRequestId: plan.reviewFixRequestId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: reviewFixRuntime.reviewFixRuntimeId,
    reviewFixRuntimeResultId,
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
    expectedHead: "review-target-sha-1",
    specificationPath: plan.specificationPath,
    implementer: plan.implementer,
    reviewer: plan.reviewer,
    validationCommands: ["npm test"],
    mutationScope: ["local-worktree-only"],
    reviewFixRuntimeRulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    status: "Completed",
    startedBy: "Local Human",
    startedAt: "2026-08-08T00:00:00.000Z",
    validationRuntimeStarted: true,
    validationStarted: true,
    commandExecutionStarted: true,
    reviewerStarted: false,
    reviewTargetCreated: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: {
      providerId: "test-validation",
      role: "ValidationRuntime",
      workingDirectory: plan.worktreePath,
      expectedHead: "review-target-sha-1",
      commandCount: 1,
      completedCommandCount: 1,
      failedCommandCount: 0,
      timedOutCommandCount: 0,
      commands: [{
        commandDisplay: "npm test",
        started: true,
        completed: true,
        timedOut: false,
        exitCode: 0,
        durationMs: 1,
        stdoutSummary: "ok",
        stderrSummary: "",
        outputTruncated: false,
      }],
    },
    rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
  };
}
