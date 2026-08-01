import { describe, expect, it, vi } from "vitest";

import type { ReviewerRuntimeOutcome } from "./reviewer-runtime/ReviewerRuntimeTypes";
import { resolveReviewTarget } from "./reviewer-runtime/ReviewTarget";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  getControllerInternals,
  realUpsertResult,
  type ControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";

const PROJECT_ID = "daily-proof";

describe("OfficeProjectPortalController Review Decision human promotion gate", () => {
  it("records exactly one immutable Review Promotion, with all safety flags false, when the human presses Promote against a Completed+Approved chain", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToApprovedReviewer(controller, internals);

    controller.updateInput(createInput({ promoteReviewPressed: true }));

    const promotions = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions;
    expect(promotions).toHaveLength(1);
    const promotion = promotions![0];
    expect(promotion.decision).toBe("Approved");
    expect(promotion.promotedBy).toBe("Local Human");
    expect(promotion.validationStarted).toBe(false);
    expect(promotion.repositoryMutationStarted).toBe(false);
    expect(promotion.githubMutationStarted).toBe(false);

    const results = internals.state.reviewPromotionResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].granted).toBe(true);

    void promotedTaskId;
  });

  it("is idempotent: a second Promote press for the same Reviewer Runtime returns the existing record and creates no duplicate", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    controller.updateInput(createInput({ promoteReviewPressed: true }));
    const firstPromotion = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions[0];

    controller.updateInput(createInput({ promoteReviewPressed: true }));
    const promotions = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions;

    expect(promotions).toHaveLength(1);
    expect(promotions![0]).toEqual(firstPromotion);
    // The result id is itself deterministic (projectId + reviewerRuntimeId),
    // so a second Promote overwrites the same result record rather than
    // appending a new one -- that overwrite is the idempotency proof.
    const results = internals.state.reviewPromotionResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].reasonCodes).toContain("REVIEW_PROMOTION_ALREADY_PROMOTED");
  });

  it("blocks Promote and records no Review Promotion when the chain has gone Stale before Promote is pressed", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    // Directly poke a Stale-inducing drift into an already-passed upstream
    // stage (mirrors OfficeProjectPortalController.reviewer-runtime.test.ts's
    // own direct-state-mutation technique) without going through the
    // clearRuntimePreflightForProject deletion cascade -- this proves
    // ReviewDecisionService's own fresh chain revalidation inside promote()
    // catches drift independently of that cascade. Per
    // contracts/human-promotion-contract.md's precondition 2, any Stale
    // classification (regardless of which specific stage drifted) surfaces
    // as the single generic REVIEW_PROMOTION_REVIEWER_STALE reason code, not
    // a per-stage-specific one.
    const approval = internals.state.humanExecutionApprovalCollections[PROJECT_ID]?.approvals[0];
    if (!approval) throw new Error("Test setup failed to reach a Human Execution Approval.");
    approval.executionPlanId = "some-other-plan-id";

    controller.updateInput(createInput({ promoteReviewPressed: true }));

    expect(internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions ?? []).toHaveLength(0);
    const results = internals.state.reviewPromotionResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].granted).toBe(false);
    expect(results![0].reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
  });

  it("keeps a previously recorded Review Promotion after a later, unrelated upstream invalidation clears the current Reviewer Runtime chain", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    controller.updateInput(createInput({ promoteReviewPressed: true }));
    const recordedPromotion = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions[0];
    expect(recordedPromotion).toBeDefined();

    // Invalidate the plan the same way the existing stale-branch regression
    // tests do, then re-run the readiness evaluation cascade that deletes
    // every downstream collection -- Review Promotion must be the one
    // collection that survives this, per FR-011.
    internals.state.repositorySyncSnapshots[PROJECT_ID] = {
      ...internals.state.repositorySyncSnapshots[PROJECT_ID],
      currentBranch: "some-other-branch",
    };
    controller.updateInput(createInput({ enterPressed: true }));

    expect(internals.state.reviewerRuntimeCollections[PROJECT_ID]).toBeUndefined();
    expect(internals.state.reviewerRuntimeResultCollections[PROJECT_ID]).toBeUndefined();
    expect(internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions).toEqual([recordedPromotion]);
  });
});

/**
 * Drives a promoted Daily Proof candidate task all the way through a
 * stubbed, Completed+Approved Reviewer Runtime, duplicating (not importing)
 * OfficeProjectPortalController.reviewer-runtime.test.ts's own
 * driveDailyProofToCompletedImplementer/createImplementerOutcomeForPlan
 * helpers, per this repository's established per-test-file fixture
 * duplication convention. The reviewer outcome fixture is parameterized by
 * the real driven plan/runtimeStart/implementerRuntime ids (unlike that
 * sibling file's hardcoded "test" ids, which promoteReviewForPromotion's own
 * implementerRuntimeId-keyed lookup would not match).
 */
async function driveDailyProofToApprovedReviewer(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
): Promise<{ promotedTaskId: string }> {
  const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

  const plan = internals.state.executionPlanCollections[PROJECT_ID]?.plans[0];
  const runtimeStart = internals.state.runtimeStartCollections[PROJECT_ID]?.starts[0];
  if (!plan || !runtimeStart) {
    throw new Error("Test setup failed to reach an Execution Plan and Runtime Start.");
  }

  internals.implementerRuntimeService = {
    startImplementer: vi.fn(async () =>
      createImplementerOutcomeForPlan(plan.planId, runtimeStart.runtimeStartId, plan.worktreePath, plan.branchName, plan.specPath, "Completed"),
    ),
    upsertResult: realUpsertResult(internals),
  };
  await internals.startImplementerRuntimeForPromotion(PROJECT_ID, promotedTaskId);

  const implementerRuntime = internals.state.implementerRuntimeCollections[PROJECT_ID]?.runtimes[0];
  if (!implementerRuntime || implementerRuntime.status !== "Completed") {
    throw new Error("Test setup failed to reach a Completed Implementer Runtime.");
  }

  const reviewTarget = resolveReviewTarget(plan, runtimeStart, implementerRuntime);
  internals.reviewerRuntimeService = {
    startReviewer: vi.fn(async () =>
      createReviewerOutcomeForRuntime(
        runtimeStart.runtimeStartId,
        implementerRuntime.implementerRuntimeId,
        reviewTarget.reviewTargetId,
        plan.worktreePath,
        plan.branchName,
        plan.specPath,
        "Completed",
        "Approved",
      ),
    ),
    upsertResult: realUpsertReviewerResult(internals),
  };
  await internals.startReviewerRuntimeForPromotion(PROJECT_ID, promotedTaskId);

  const reviewerResult = internals.state.reviewerRuntimeResultCollections[PROJECT_ID]?.results.at(-1);
  if (reviewerResult?.status !== "Completed" || reviewerResult.decision !== "Approved") {
    throw new Error(
      `Test setup failed to reach a Completed+Approved Reviewer Runtime (found ${reviewerResult?.status}/${reviewerResult?.decision}) -- fixture drifted from the real controller flow.`,
    );
  }

  return { promotedTaskId };
}

function createImplementerOutcomeForPlan(
  planId: string,
  runtimeStartId: string,
  worktreePath: string,
  branch: string,
  specificationPath: string,
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
) {
  const spawned = status === "Completed" || status === "TimedOut";
  const result = {
    id: `${PROJECT_ID}:implementer-runtime-result:${planId}:${status}`,
    projectId: PROJECT_ID,
    runtimeStartId,
    executionPlanId: planId,
    implementerRuntimeId: spawned ? `${PROJECT_ID}:implementer-runtime:${runtimeStartId}:claude-implementer-v1` : undefined,
    status,
    reasonCodes: ["IMPLEMENTER_RUNTIME_STARTED" as const],
    started: spawned,
    duplicateActiveAttempt: false,
    agentStarted: spawned,
    implementerStarted: spawned,
    reviewerStarted: false as const,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    resultAt: new Date().toISOString(),
    rulesVersion: "claude-implementer-v1",
  };

  const runtime = {
    implementerRuntimeId: `${PROJECT_ID}:implementer-runtime:${runtimeStartId}:claude-implementer-v1`,
    projectId: PROJECT_ID,
    runtimeStartId,
    executionPlanId: planId,
    humanExecutionApprovalId: "test-approval",
    runtimePreflightId: "test-preflight",
    taskId: "test-task",
    confirmedAssignmentId: "test-assignment",
    preparedSessionId: "test-prepared",
    activeSessionId: "test-session",
    employeeId: "gpt-engineer",
    repositoryId: "github:ai-verse/daily-proof",
    worktreePath,
    branch,
    specificationPath,
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    promptId: `${PROJECT_ID}:implementer-prompt:${runtimeStartId}:claude-implementer-v1`,
    status,
    startedBy: "Local Human",
    startedAt: new Date().toISOString(),
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
      commandDisplay: "claude --dangerously-skip-permissions -p ...",
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-077",
      started: true,
      completed: status === "Completed",
      timedOut: status === "TimedOut",
      cancelled: false,
      exitCode: status === "Completed" ? 0 : undefined,
      durationMs: 10,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "claude-implementer-v1",
  };

  return {
    result,
    runtime,
    resultCollection: { projectId: PROJECT_ID, results: [result], resultCount: 1, rulesVersion: "claude-implementer-v1" },
    runtimeCollection: { projectId: PROJECT_ID, runtimes: [runtime], runtimeCount: 1, rulesVersion: "claude-implementer-v1" },
  };
}

function createReviewerOutcomeForRuntime(
  runtimeStartId: string,
  implementerRuntimeId: string,
  reviewTargetId: string,
  worktreePath: string,
  branch: string,
  specificationPath: string,
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
  decision: "Approved" | "ChangesRequested" | "Unknown",
): ReviewerRuntimeOutcome {
  const spawned = status === "Completed" || status === "TimedOut";
  const reviewerRuntimeId = `${PROJECT_ID}:reviewer-runtime:${runtimeStartId}:codex-reviewer-v1`;
  const result = {
    id: `${PROJECT_ID}:reviewer-runtime-result:${runtimeStartId}:${status}`,
    projectId: PROJECT_ID,
    runtimeStartId,
    implementerRuntimeId,
    reviewerRuntimeId: spawned ? reviewerRuntimeId : undefined,
    status,
    decision,
    blockingFindingCount: 0,
    nonBlockingFindingCount: 0,
    reasonCodes: ["REVIEWER_RUNTIME_STARTED" as const],
    started: spawned,
    duplicateActiveAttempt: false,
    agentStarted: spawned,
    implementerStarted: true as const,
    reviewerStarted: spawned,
    validationStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    resultAt: new Date().toISOString(),
    rulesVersion: "codex-reviewer-v1",
  };
  if (!spawned) {
    return { result, resultCollection: { projectId: PROJECT_ID, results: [result], resultCount: 1, rulesVersion: "codex-reviewer-v1" } };
  }

  const runtime = {
    reviewerRuntimeId,
    projectId: PROJECT_ID,
    runtimeStartId,
    implementerRuntimeId,
    reviewTargetId,
    reviewPromptId: `${PROJECT_ID}:reviewer-prompt:${runtimeStartId}:codex-reviewer-v1`,
    worktreePath,
    branch,
    specificationPath,
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    status,
    decision,
    findings: [],
    startedBy: "Local Human",
    startedAt: new Date().toISOString(),
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
      commandDisplay: "codex --sandbox danger-full-access --ask-for-approval never exec ...",
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-077",
      reviewTargetSha: "0000000000000000000000000000000000000000",
      started: true,
      completed: status === "Completed",
      timedOut: status === "TimedOut",
      exitCode: status === "Completed" ? 0 : undefined,
      durationMs: 10,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "codex-reviewer-v1",
  };

  return {
    result,
    runtime,
    resultCollection: { projectId: PROJECT_ID, results: [result], resultCount: 1, rulesVersion: "codex-reviewer-v1" },
    runtimeCollection: { projectId: PROJECT_ID, runtimes: [runtime], runtimeCount: 1, rulesVersion: "codex-reviewer-v1" },
  };
}

function realUpsertReviewerResult(internals: ControllerInternals) {
  return (
    collection: ControllerInternals["state"]["reviewerRuntimeResultCollections"][string] | undefined,
    result: ControllerInternals["state"]["reviewerRuntimeResultCollections"][string]["results"][number],
  ) => {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return {
      projectId: collection?.projectId ?? PROJECT_ID,
      results: nextResults,
      resultCount: nextResults.length,
      generatedAt: result.resultAt,
      rulesVersion: result.rulesVersion,
    };
  };
}
