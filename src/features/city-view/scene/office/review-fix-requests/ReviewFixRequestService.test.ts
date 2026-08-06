import { describe, expect, it } from "vitest";

import { resolveReviewDecisionInput } from "../review-decision/ReviewDecisionService";
import { createImplementerRuntimeId, createImplementerRuntimeResultId } from "../implementer-runtime/ImplementerRuntimeTypes";
import { resolveReviewTarget } from "../reviewer-runtime/ReviewTarget";
import { createReviewerRuntimeCollection, createReviewerRuntimeId, createReviewerRuntimeResultCollection, createReviewerRuntimeResultId } from "../reviewer-runtime/ReviewerRuntimeTypes";
import { OfficeProjectPortalController } from "../OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  getControllerInternals,
  type ControllerInternals,
} from "../OfficeProjectPortalController.testHelpers";
import { ReviewFixRequestService, findCurrentReviewFixRequestResult } from "./ReviewFixRequestService";
import {
  REVIEW_FIX_REQUEST_RULES_VERSION,
  createReviewFixRequestCollection,
  createReviewFixRequestId,
  createReviewFixRequestResultCollection,
} from "./ReviewFixRequestTypes";

const PROJECT_ID = "daily-proof";

describe("ReviewFixRequestService", () => {
  it("creates one exact-context fix request for a concrete ChangesRequested review", async () => {
    const { input } = await createChangesRequestedInput();
    const service = new ReviewFixRequestService();

    const outcome = service.requestFix(input, {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-05T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Requested");
    expect(outcome.request?.reviewFixRequestId).toBe(createReviewFixRequestId(PROJECT_ID, input.reviewerRuntime!.reviewerRuntimeId));
    expect(outcome.request?.decision).toBe("ChangesRequested");
    expect(outcome.request?.validationCommands).toEqual(input.executionPlan!.validationCommands);
    expect(outcome.request?.mutationScope).toEqual(input.executionPlan!.allowedMutationScope);
    expect(outcome.request?.fixExecutionStarted).toBe(false);
    expect(outcome.request?.validationRuntimeStarted).toBe(false);
    expect(outcome.request?.codexStarted).toBe(false);
    expect(outcome.request?.claudeStarted).toBe(false);
    expect(outcome.request?.subprocessStarted).toBe(false);
    expect(outcome.request?.repositoryMutationStarted).toBe(false);
    expect(outcome.request?.githubMutationStarted).toBe(false);
  });

  it("returns AlreadyRequested only after current revalidation and exact-context comparison", async () => {
    const { input } = await createChangesRequestedInput();
    const service = new ReviewFixRequestService();
    const command = {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-05T00:00:00.000Z",
    };

    const first = service.requestFix(input, command);
    const second = service.requestFix({
      ...input,
      existingFixRequests: first.requestCollection,
      existingFixRequestResults: first.resultCollection,
    }, { ...command, requestedAt: "2026-08-05T00:01:00.000Z" });

    expect(second.result.status).toBe("AlreadyRequested");
    expect(second.requestCollection?.requests).toHaveLength(1);
    expect(second.request?.requestedAt).toBe("2026-08-05T00:00:00.000Z");
  });

  it("blocks invalid actors before idempotent success", async () => {
    const { input } = await createChangesRequestedInput();
    const service = new ReviewFixRequestService();
    const first = service.requestFix(input, {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-05T00:00:00.000Z",
    });

    const blocked = service.requestFix({ ...input, existingFixRequests: first.requestCollection }, {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Codex",
      requestedAt: "2026-08-05T00:01:00.000Z",
    });

    expect(blocked.result.status).toBe("Blocked");
    expect(blocked.result.reasonCodes).toContain("REVIEW_FIX_REQUEST_INVALID_ACTOR");
    expect(blocked.request).toBeUndefined();
  });


  it("scopes dashboard results by the current reviewerRuntimeId instead of the project-wide last result", () => {
    const resultCollection = createReviewFixRequestResultCollection({
      projectId: PROJECT_ID,
      results: [{
        id: "daily-proof:review-fix-request-result:other-reviewer:review-fix-request-v1",
        projectId: PROJECT_ID,
        reviewerRuntimeId: "other-reviewer",
        status: "Blocked",
        requested: false,
        alreadyRequested: false,
        reasonCodes: ["REVIEW_FIX_REQUEST_REVIEWER_STALE"],
        fixExecutionStarted: false,
        validationRuntimeStarted: false,
        codexStarted: false,
        claudeStarted: false,
        subprocessStarted: false,
        validationStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        resultAt: "2026-08-05T00:00:00.000Z",
        rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
      }],
      rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    });

    const scoped = findCurrentReviewFixRequestResult(PROJECT_ID, {
      state: "ChangesRequested",
      reviewerRuntimeId: "current-reviewer",
      decision: "ChangesRequested",
    }, resultCollection);

    expect(scoped).toBeUndefined();
  });
  it("blocks stale repeated requests instead of returning AlreadyRequested", async () => {
    const { input } = await createChangesRequestedInput();
    const service = new ReviewFixRequestService();
    const first = service.requestFix(input, {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-05T00:00:00.000Z",
    });

    const stale = service.requestFix({
      ...input,
      approval: { ...input.approval!, executionPlanId: "stale-plan" },
      existingFixRequests: first.requestCollection,
      existingFixRequestResults: first.resultCollection,
    }, {
      projectId: PROJECT_ID,
      reviewerRuntimeId: input.reviewerRuntime!.reviewerRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-05T00:02:00.000Z",
    });

    expect(stale.result.status).toBe("Blocked");
    expect(stale.result.reasonCodes).toContain("REVIEW_FIX_REQUEST_REVIEWER_STALE");
    expect(stale.requestCollection).toBeUndefined();
  });
});

async function createChangesRequestedInput() {
  const controller = new OfficeProjectPortalController(createSceneStub());
  const internals = getControllerInternals(controller);
  const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);
  controller.updateInput(createInput({ actionPressed: true }));

  const plan = internals.state.executionPlanCollections[PROJECT_ID]!.plans[0];
  const runtimeStart = internals.state.runtimeStartCollections[PROJECT_ID]!.starts[0];
  const implementerRuntimeId = createImplementerRuntimeId(PROJECT_ID, runtimeStart.runtimeStartId);
  const implementerRuntime = {
    implementerRuntimeId,
    projectId: PROJECT_ID,
    runtimeStartId: runtimeStart.runtimeStartId,
    executionPlanId: plan.planId,
    humanExecutionApprovalId: runtimeStart.humanExecutionApprovalId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    promptId: `${PROJECT_ID}:implementer-prompt:${runtimeStart.runtimeStartId}:claude-implementer-v1`,
    status: "Completed" as const,
    startedBy: "Local Human",
    startedAt: "2026-08-05T00:00:00.000Z",
    executionStarted: true as const,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false as const,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    evidence: {
      providerId: "claude",
      agentId: "Claude",
      role: "Implementer" as const,
      commandDisplay: "claude --version",
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
    rulesVersion: "claude-implementer-v1",
  };
  const implementerRuntimeResult = {
    id: createImplementerRuntimeResultId(PROJECT_ID, runtimeStart.runtimeStartId),
    projectId: PROJECT_ID,
    runtimeStartId: runtimeStart.runtimeStartId,
    executionPlanId: plan.planId,
    implementerRuntimeId,
    status: "Completed" as const,
    reasonCodes: ["IMPLEMENTER_RUNTIME_STARTED" as const],
    started: true,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false as const,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    resultAt: "2026-08-05T00:00:00.000Z",
    rulesVersion: "claude-implementer-v1",
  };
  internals.state.implementerRuntimeCollections[PROJECT_ID] = {
    projectId: PROJECT_ID,
    runtimes: [implementerRuntime],
    runtimeCount: 1,
    rulesVersion: "claude-implementer-v1",
  };
  internals.state.implementerRuntimeResultCollections[PROJECT_ID] = {
    projectId: PROJECT_ID,
    results: [implementerRuntimeResult],
    resultCount: 1,
    rulesVersion: "claude-implementer-v1",
  };

  const reviewTarget = { ...resolveReviewTarget(plan, runtimeStart, implementerRuntime), workingTreeState: "Clean" as const };
  internals.state.reviewTargets![PROJECT_ID] = reviewTarget;
  const reviewerRuntimeId = createReviewerRuntimeId(PROJECT_ID, reviewTarget.reviewTargetId);
  const reviewerRuntimeResultId = createReviewerRuntimeResultId(PROJECT_ID, reviewTarget.reviewTargetId);
  const reviewerRuntime = {
    reviewerRuntimeId,
    projectId: PROJECT_ID,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId,
    reviewTargetId: reviewTarget.reviewTargetId,
    reviewPromptId: `${PROJECT_ID}:reviewer-prompt:${reviewTarget.reviewTargetId}:codex-reviewer-v1`,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    status: "Completed" as const,
    decision: "ChangesRequested" as const,
    findings: [],
    startedBy: "Local Human",
    startedAt: "2026-08-05T00:00:00.000Z",
    executionStarted: true as const,
    agentStarted: true,
    implementerStarted: true as const,
    reviewerStarted: true,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    evidence: {
      providerId: "codex",
      agentId: "Codex",
      role: "Reviewer" as const,
      commandDisplay: "codex --version",
      workingDirectory: plan.worktreePath,
      reviewTargetSha: reviewTarget.reviewTargetSha,
      started: true,
      completed: true,
      timedOut: false,
      exitCode: 0,
      durationMs: 1,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "codex-reviewer-v1",
  };
  const reviewerRuntimeResult = {
    id: reviewerRuntimeResultId,
    projectId: PROJECT_ID,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId,
    reviewerRuntimeId,
    status: "Completed" as const,
    decision: "ChangesRequested" as const,
    blockingFindingCount: 1,
    nonBlockingFindingCount: 0,
    reasonCodes: ["REVIEWER_RUNTIME_STARTED" as const],
    started: true,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true as const,
    reviewerStarted: true,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    resultAt: "2026-08-05T00:00:00.000Z",
    rulesVersion: "codex-reviewer-v1",
  };
  internals.state.reviewerRuntimeCollections[PROJECT_ID] = createReviewerRuntimeCollection({
    projectId: PROJECT_ID,
    runtimes: [reviewerRuntime],
    rulesVersion: "codex-reviewer-v1",
  });
  internals.state.reviewerRuntimeResultCollections[PROJECT_ID] = createReviewerRuntimeResultCollection({
    projectId: PROJECT_ID,
    results: [reviewerRuntimeResult],
    rulesVersion: "codex-reviewer-v1",
  });

  const input = {
    ...resolveReviewDecisionInput({
      projectId: PROJECT_ID,
      plan,
      readinessCollection: internals.state.executionReadinessCollections[PROJECT_ID],
      readinessResultCollection: internals.state.executionReadinessResultCollections[PROJECT_ID],
      approvalCollection: internals.state.humanExecutionApprovalCollections[PROJECT_ID],
      preflightCollection: internals.state.runtimePreflightCollections[PROJECT_ID],
      preflightResultCollection: internals.state.runtimePreflightResultCollections[PROJECT_ID],
      runtimeStartCollection: internals.state.runtimeStartCollections[PROJECT_ID],
      runtimeStartResultCollection: internals.state.runtimeStartResultCollections[PROJECT_ID],
      implementerRuntimeCollection: internals.state.implementerRuntimeCollections[PROJECT_ID],
      implementerRuntimeResultCollection: internals.state.implementerRuntimeResultCollections[PROJECT_ID],
      reviewTarget: internals.state.reviewTargets![PROJECT_ID],
      reviewerRuntimeCollection: internals.state.reviewerRuntimeCollections[PROJECT_ID],
      reviewerRuntimeResultCollection: internals.state.reviewerRuntimeResultCollections[PROJECT_ID],
    }),
    existingFixRequests: createReviewFixRequestCollection({ projectId: PROJECT_ID, requests: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION }),
    existingFixRequestResults: createReviewFixRequestResultCollection({ projectId: PROJECT_ID, results: [], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION }),
  };

  void promotedTaskId;
  return { input };
}