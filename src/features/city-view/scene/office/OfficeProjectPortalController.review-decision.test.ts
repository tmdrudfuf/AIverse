import { describe, expect, it, vi } from "vitest";

import { resolveCurrentExecutionPlan, type ExecutionPlan } from "./execution-plans/ExecutionPlanTypes";
import { parsePromotedProjectTaskProvenance } from "./confirmed-assignments/ConfirmedEmployeeAssignmentService";
import { createImplementerRuntimeId, createImplementerRuntimeResultId } from "./implementer-runtime/ImplementerRuntimeTypes";
import type { RuntimeStart } from "./runtime-start/RuntimeStartTypes";
import type { ReviewerRuntimeOutcome, ReviewerRuntimeDecision, ReviewerRuntimeStatus } from "./reviewer-runtime/ReviewerRuntimeTypes";
import { createReviewerRuntimeId, createReviewerRuntimeResultId } from "./reviewer-runtime/ReviewerRuntimeTypes";
import { resolveReviewTarget } from "./reviewer-runtime/ReviewTarget";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { ReviewDecisionService, findCurrentReviewPromotion, resolveReviewDecisionInput } from "./review-decision/ReviewDecisionService";
import { createReviewDecisionDisplayRows } from "./review-decision/ReviewDecisionView";
import { createReviewFixPlanId } from "./review-fix-plans/ReviewFixPlanTypes";
import { createReviewFixRuntimeId } from "./review-fix-runtime/ReviewFixRuntimeTypes";
import {
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  flushPromises,
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

  // Round 7 P1-001: a pre-spawn Blocked/Failed Reviewer Runtime outcome
  // never constructs a ReviewerRuntime record, only a "result-only"
  // ReviewerRuntimeResult. Both the [REVIEW DECISION] dashboard row
  // (OfficeProjectPortalView) and the Promote precondition
  // (promoteReviewForPromotion) must read that outcome identically, since
  // both call resolveReviewDecisionInput + ReviewDecisionService.classify
  // against the same state.
  it.each(["Blocked", "Failed"] as const)(
    "surfaces a result-only %s Reviewer Runtime outcome identically to the dashboard classification, blocks Promote, and creates no ReviewPromotion",
    async (status) => {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);
      await driveDailyProofToResultOnlyReviewer(controller, internals, status);

      const classification = classifyCurrentReviewDecision(internals);
      expect(classification.state).toBe(status);
      expect(classification.reviewerRuntimeId).toBeUndefined();

      controller.updateInput(createInput({ promoteReviewPressed: true }));

      expect(internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions ?? []).toHaveLength(0);
      const results = internals.state.reviewPromotionResultCollections?.[PROJECT_ID]?.results;
      expect(results).toHaveLength(1);
      expect(results![0].granted).toBe(false);
    },
  );

  // Round 8 P2-002: an invalid actor must never receive granted: true, and
  // the dashboard (which reads the same classify() result, independent of
  // actor) must never show a success row for a request that Promote blocked.
  it.each(["Codex", "Claude", "release-bot", "automation-script"] as const)(
    "blocks Promote for a %s actor against an otherwise-Approved chain, and the dashboard never shows a success row for it",
    async (actor) => {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);
      await driveDailyProofToApprovedReviewer(controller, internals);

      const plan = internals.state.executionPlanCollections[PROJECT_ID]?.plans[0];
      if (!plan) throw new Error("Test setup failed to reach an Execution Plan.");
      const input = resolveReviewDecisionInput({
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
        reviewTarget: internals.state.reviewTargets?.[PROJECT_ID],
        reviewerRuntimeCollection: internals.state.reviewerRuntimeCollections[PROJECT_ID],
        reviewerRuntimeResultCollection: internals.state.reviewerRuntimeResultCollections[PROJECT_ID],
      });

      const service = new ReviewDecisionService();
      const outcome = service.promote(input, {
        projectId: PROJECT_ID,
        reviewerRuntimeId: input.reviewerRuntime?.reviewerRuntimeId ?? "",
        actor,
        requestedAt: new Date().toISOString(),
      });

      expect(outcome.result.granted).toBe(false);
      expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_INVALID_ACTOR");
      expect(outcome.promotion).toBeUndefined();

      // The dashboard's own classify() call is unaffected by actor validity
      // (Promote-only concern) and still reports Approved; what proves the
      // shared classification path is that the dashboard never renders a
      // success row, because no promotion collection was ever produced.
      const classification = service.classify(input);
      expect(classification.state).toBe("Approved");
      const currentPromotion = findCurrentReviewPromotion(PROJECT_ID, classification, outcome.promotionCollection);
      const rows = createReviewDecisionDisplayRows(classification, currentPromotion);
      expect(rows.statusText).not.toContain("Promoted by");
      expect(rows.statusText).toContain("Promote (P)");
    },
  );

  // P2-001: dashboard classification (OfficeProjectPortalView) resolved the
  // latest Execution Plan by array position while Promote
  // (promoteReviewForPromotion) resolved the first task/candidate match --
  // with multiple plans for the same task, those two selections could
  // diverge. Both now consume the one shared resolveCurrentExecutionPlan, so
  // planting a stale, older decoy plan for the same task/candidate must
  // neither change the dashboard's classification nor let Promote record a
  // promotion against the decoy.
  it("records exactly one immutable Review Fix Request when the human presses Request Fixes against a Completed+ChangesRequested chain", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));

    const requests = internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests;
    expect(requests).toHaveLength(1);
    const request = requests![0];
    expect(request.decision).toBe("ChangesRequested");
    expect(request.requestedBy).toBe("Local Human");
    expect(request.fixExecutionStarted).toBe(false);
    expect(request.validationRuntimeStarted).toBe(false);
    expect(request.codexStarted).toBe(false);
    expect(request.claudeStarted).toBe(false);
    expect(request.subprocessStarted).toBe(false);
    expect(request.validationStarted).toBe(false);
    expect(request.repositoryMutationStarted).toBe(false);
    expect(request.githubMutationStarted).toBe(false);

    const results = internals.state.reviewFixRequestResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("Requested");
    expect(results![0].requested).toBe(true);
  });

  it("does not record a Review Fix Request from render, navigation, Enter, or Promote inputs", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ promoteReviewPressed: true }));

    expect(internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests ?? []).toHaveLength(0);
    expect(internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions ?? []).toHaveLength(0);
  });

  it("is idempotent: repeated Request Fixes creates no duplicate and returns AlreadyRequested after revalidation", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    const firstRequest = internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests[0];

    controller.updateInput(createInput({ requestReviewFixPressed: true }));

    const requests = internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests;
    expect(requests).toHaveLength(1);
    expect(requests![0]).toEqual(firstRequest);
    const results = internals.state.reviewFixRequestResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("AlreadyRequested");
    expect(results![0].reasonCodes).toContain("REVIEW_FIX_REQUEST_ALREADY_REQUESTED");
  });

  it("blocks Request Fixes for an Approved reviewer decision and creates no fix request", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));

    expect(internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests ?? []).toHaveLength(0);
    const results = internals.state.reviewFixRequestResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("Blocked");
    expect(results![0].reasonCodes).toContain("REVIEW_FIX_REQUEST_DECISION_APPROVED");
  });

  it("does not return AlreadyRequested for a stale repeated fix request", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    const firstRequest = internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests[0];
    const approval = internals.state.humanExecutionApprovalCollections[PROJECT_ID]?.approvals[0];
    if (!approval) throw new Error("Test setup failed to reach a Human Execution Approval.");
    approval.executionPlanId = "stale-plan";

    controller.updateInput(createInput({ requestReviewFixPressed: true }));

    expect(internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests).toEqual([firstRequest]);
    const results = internals.state.reviewFixRequestResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("Blocked");
    expect(results![0].reasonCodes).toContain("REVIEW_FIX_REQUEST_REVIEWER_STALE");
  });

  it("records exactly one immutable Review Fix Plan only after a separate Plan Fixes input", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    const request = internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests[0];
    expect(request).toBeDefined();

    controller.updateInput(createInput({ planReviewFixPressed: true }));

    const plans = internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans;
    expect(plans).toHaveLength(1);
    const plan = plans![0];
    expect(plan.reviewFixPlanId).toBe(createReviewFixPlanId(PROJECT_ID, request!.reviewFixRequestId));
    expect(plan.reviewFixRequestId).toBe(request!.reviewFixRequestId);
    expect(plan.decision).toBe("ChangesRequested");
    expect(plan.plannedBy).toBe("Local Human");
    expect(plan.fixExecutionStarted).toBe(false);
    expect(plan.validationRuntimeStarted).toBe(false);
    expect(plan.codexStarted).toBe(false);
    expect(plan.claudeStarted).toBe(false);
    expect(plan.subprocessStarted).toBe(false);
    expect(plan.validationStarted).toBe(false);
    expect(plan.repositoryMutationStarted).toBe(false);
    expect(plan.githubMutationStarted).toBe(false);

    const results = internals.state.reviewFixPlanResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("Planned");
    expect(results![0].planned).toBe(true);
  });

  it("does not create a Review Fix Plan from render, navigation, Enter, Promote, or Request Fixes inputs alone", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ promoteReviewPressed: true }));
    controller.updateInput(createInput({ requestReviewFixPressed: true }));

    expect(internals.state.reviewFixRequestCollections?.[PROJECT_ID]?.requests).toHaveLength(1);
    expect(internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans ?? []).toHaveLength(0);
  });

  it("is idempotent: repeated Plan Fixes creates no duplicate and returns AlreadyPlanned after revalidation", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    controller.updateInput(createInput({ planReviewFixPressed: true }));
    const firstPlan = internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans[0];

    controller.updateInput(createInput({ planReviewFixPressed: true }));

    const plans = internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans;
    expect(plans).toHaveLength(1);
    expect(plans![0]).toEqual(firstPlan);
    const results = internals.state.reviewFixPlanResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(1);
    expect(results![0].status).toBe("AlreadyPlanned");
    expect(results![0].reasonCodes).toContain("REVIEW_FIX_PLAN_ALREADY_PLANNED");
  });

  it("starts Review Fix Runtime only from the distinct X input after a plan exists", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);
    internals.reviewFixRuntimeService = {
      startFixRuntime: vi.fn(async (_input, command) => ({
        result: {
          id: `${PROJECT_ID}:review-fix-runtime-result:${command.reviewFixPlanId}:review-fix-runtime-v1`,
          projectId: PROJECT_ID,
          reviewFixPlanId: command.reviewFixPlanId,
          reviewFixRuntimeId: createReviewFixRuntimeId(PROJECT_ID, command.reviewFixPlanId),
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
          resultAt: command.startedAt,
          rulesVersion: "review-fix-runtime-v1",
        },
      })),
    };

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    controller.updateInput(createInput({ planReviewFixPressed: true }));
    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ planReviewFixPressed: true }));
    await flushPromises();
    expect(internals.reviewFixRuntimeService.startFixRuntime).not.toHaveBeenCalled();

    controller.updateInput(createInput({ startReviewFixRuntimePressed: true }));
    await flushPromises();

    expect(internals.reviewFixRuntimeService.startFixRuntime).toHaveBeenCalledTimes(1);
    const command = vi.mocked(internals.reviewFixRuntimeService.startFixRuntime).mock.calls[0]![1];
    expect(command.actor).toBe("Local Human");
    expect(command.reviewFixPlanId).toBeDefined();
  });

  it("blocks stale repeated Review Fix Plans instead of returning AlreadyPlanned", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToChangesRequestedReviewer(controller, internals);

    controller.updateInput(createInput({ requestReviewFixPressed: true }));
    controller.updateInput(createInput({ planReviewFixPressed: true }));
    const firstPlan = internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans[0];
    const approval = internals.state.humanExecutionApprovalCollections[PROJECT_ID]?.approvals[0];
    if (!approval) throw new Error("Test setup failed to reach a Human Execution Approval.");
    approval.executionPlanId = "stale-plan";

    controller.updateInput(createInput({ planReviewFixPressed: true }));

    expect(internals.state.reviewFixPlanCollections?.[PROJECT_ID]?.plans).toEqual([firstPlan]);
    const results = internals.state.reviewFixPlanResultCollections?.[PROJECT_ID]?.results;
    expect(results).toHaveLength(2);
    expect(results!.at(-1)?.status).toBe("Blocked");
    expect(results!.at(-1)?.reasonCodes).toContain("REVIEW_FIX_PLAN_REQUEST_MISSING");
  });
  it("resolves the same current Execution Plan for the dashboard and Promote even when a stale, older plan exists for the same task/candidate", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    const planCollection = internals.state.executionPlanCollections[PROJECT_ID];
    const currentPlan = planCollection?.plans[0];
    if (!planCollection || !currentPlan) throw new Error("Test setup failed to reach an Execution Plan.");

    const decoyPlan: ExecutionPlan = {
      ...currentPlan,
      planId: `${currentPlan.planId}:decoy`,
      createdAt: "2020-01-01T00:00:00.000Z",
    };
    internals.state.executionPlanCollections[PROJECT_ID] = {
      ...planCollection,
      plans: [decoyPlan, currentPlan],
      planCount: 2,
    };

    const classification = classifyCurrentReviewDecision(internals);
    expect(classification.state).toBe("Approved");

    controller.updateInput(createInput({ promoteReviewPressed: true }));

    const promotions = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions;
    expect(promotions).toHaveLength(1);
    expect(promotions![0].planId).toBe(currentPlan.planId);
    expect(promotions![0].planId).not.toBe(decoyPlan.planId);
  });

  // The decoy-plan case above only proves ordering is stable for the *same*
  // task's plans. A shared resolver called with two different filters can
  // still diverge across *different* tasks -- the dashboard must resolve the
  // plan for the human's actual selected candidate/task, not merely "the
  // project's newest plan overall", or it could silently classify a task the
  // human never selected while Promote still acts on the selected one.
  it("keeps the dashboard scoped to the selected candidate task even when a different task's plan is newer (cross-task isolation, combined round 2 P2-001)", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToApprovedReviewer(controller, internals);

    const planCollection = internals.state.executionPlanCollections[PROJECT_ID];
    const selectedPlan = planCollection?.plans[0];
    if (!planCollection || !selectedPlan) throw new Error("Test setup failed to reach an Execution Plan.");

    const otherTaskPlan: ExecutionPlan = {
      ...selectedPlan,
      planId: `${selectedPlan.planId}:other-task`,
      projectTaskId: `${selectedPlan.projectTaskId}:other-task`,
      candidateTaskId: `${selectedPlan.candidateTaskId}:other-task`,
      createdAt: "2099-01-01T00:00:00.000Z",
    };
    internals.state.executionPlanCollections[PROJECT_ID] = {
      ...planCollection,
      plans: [selectedPlan, otherTaskPlan],
      planCount: 2,
    };

    const classification = classifyCurrentReviewDecision(internals);
    expect(classification.state).toBe("Approved");

    controller.updateInput(createInput({ promoteReviewPressed: true }));

    const promotions = internals.state.reviewPromotionCollections?.[PROJECT_ID]?.promotions;
    expect(promotions).toHaveLength(1);
    expect(promotions![0].planId).toBe(selectedPlan.planId);
    expect(promotions![0].planId).not.toBe(otherTaskPlan.planId);
  });
});

/**
 * Classifies the project's current Review Decision the exact same way
 * OfficeProjectPortalView.render does (resolveReviewDecisionInput +
 * ReviewDecisionService.classify against the live controller state), so a
 * test can assert the dashboard and the Promote precondition agree without
 * duplicating ReviewDecisionService's own classify() unit tests here.
 */
function classifyCurrentReviewDecision(internals: ControllerInternals) {
  const selectedCandidatePromotionReview = internals.state.candidatePromotionReviewCollections[PROJECT_ID]
    ?.reviews[internals.state.selectedCandidatePromotionIndex];
  const selectedPromotedTask = selectedCandidatePromotionReview
    ? internals.state.taskCollections[PROJECT_ID]?.tasks.find((task) =>
      parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === selectedCandidatePromotionReview.candidateTaskId
    )
    : undefined;
  const plan = resolveCurrentExecutionPlan(
    internals.state.executionPlanCollections[PROJECT_ID],
    selectedPromotedTask
      ? { projectTaskId: selectedPromotedTask.id, candidateTaskId: selectedCandidatePromotionReview!.candidateTaskId }
      : undefined,
  );
  if (!plan) throw new Error("Test setup failed to reach an Execution Plan.");

  return new ReviewDecisionService().classify(
    resolveReviewDecisionInput({
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
      reviewTarget: internals.state.reviewTargets?.[PROJECT_ID],
      reviewerRuntimeCollection: internals.state.reviewerRuntimeCollections[PROJECT_ID],
      reviewerRuntimeResultCollection: internals.state.reviewerRuntimeResultCollections[PROJECT_ID],
    }),
  );
}

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
      createImplementerOutcomeForPlan(plan, runtimeStart, plan.worktreePath, plan.branchName, plan.specPath, "Completed"),
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
        reviewTarget.reviewTargetSha,
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

  // The controller resolves its own Review Target internally (independent of
  // the stubbed startReviewer above) via the real resolveReviewTarget, which
  // always reports "Uncommitted" in this represented pipeline -- the same
  // limitation OfficeProjectPortalController.reviewer-runtime.test.ts already
  // documents and forces past. Promote's own chain revalidation now requires
  // a Clean target (see ReviewDecisionService.validateChain), so this test's
  // stored Review Target is forced Clean the same way.
  const storedReviewTarget = internals.state.reviewTargets?.[PROJECT_ID];
  if (storedReviewTarget) {
    internals.state.reviewTargets![PROJECT_ID] = { ...storedReviewTarget, workingTreeState: "Clean" };
  }

  return { promotedTaskId };
}

async function driveDailyProofToChangesRequestedReviewer(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
): Promise<{ promotedTaskId: string }> {
  const result = await driveDailyProofToApprovedReviewer(controller, internals);
  const runtime = internals.state.reviewerRuntimeCollections[PROJECT_ID]?.runtimes[0];
  const reviewerResult = internals.state.reviewerRuntimeResultCollections[PROJECT_ID]?.results[0];
  if (!runtime || !reviewerResult) throw new Error("Test setup failed to reach Reviewer Runtime.");
  runtime.decision = "ChangesRequested";
  reviewerResult.decision = "ChangesRequested";
  return result;
}
/**
 * Drives a promoted Daily Proof candidate task through a Completed
 * Implementer Runtime, then stubs a pre-spawn Blocked/Failed Reviewer
 * Runtime outcome -- the real "result-only" shape ReviewerRuntimeService
 * produces when it never constructs a ReviewerRuntime record (see
 * createReviewerOutcomeForRuntime's !spawned branch below).
 */
async function driveDailyProofToResultOnlyReviewer(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
  status: "Blocked" | "Failed",
): Promise<{ promotedTaskId: string }> {
  const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

  const plan = internals.state.executionPlanCollections[PROJECT_ID]?.plans[0];
  const runtimeStart = internals.state.runtimeStartCollections[PROJECT_ID]?.starts[0];
  if (!plan || !runtimeStart) {
    throw new Error("Test setup failed to reach an Execution Plan and Runtime Start.");
  }

  internals.implementerRuntimeService = {
    startImplementer: vi.fn(async () =>
      createImplementerOutcomeForPlan(plan, runtimeStart, plan.worktreePath, plan.branchName, plan.specPath, "Completed"),
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
        reviewTarget.reviewTargetSha,
        plan.worktreePath,
        plan.branchName,
        plan.specPath,
        status,
        "Unknown",
      ),
    ),
    upsertResult: realUpsertReviewerResult(internals),
  };
  await internals.startReviewerRuntimeForPromotion(PROJECT_ID, promotedTaskId);

  const reviewerResult = internals.state.reviewerRuntimeResultCollections[PROJECT_ID]?.results.at(-1);
  if (reviewerResult?.status !== status || reviewerResult.reviewerRuntimeId !== undefined) {
    throw new Error(
      `Test setup failed to reach a result-only ${status} Reviewer Runtime Result (found status ${reviewerResult?.status}, reviewerRuntimeId ${reviewerResult?.reviewerRuntimeId}) -- fixture drifted from the real controller flow.`,
    );
  }
  expect(internals.state.reviewerRuntimeCollections[PROJECT_ID]).toBeUndefined();

  return { promotedTaskId };
}

function createImplementerOutcomeForPlan(
  plan: ExecutionPlan,
  runtimeStart: RuntimeStart,
  worktreePath: string,
  branch: string,
  specificationPath: string,
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
) {
  const planId = plan.planId;
  const runtimeStartId = runtimeStart.runtimeStartId;
  const spawned = status === "Completed" || status === "TimedOut";
  const result = {
    id: createImplementerRuntimeResultId(PROJECT_ID, runtimeStartId),
    projectId: PROJECT_ID,
    runtimeStartId,
    executionPlanId: planId,
    implementerRuntimeId: spawned ? createImplementerRuntimeId(PROJECT_ID, runtimeStartId) : undefined,
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
    implementerRuntimeId: createImplementerRuntimeId(PROJECT_ID, runtimeStartId),
    projectId: PROJECT_ID,
    runtimeStartId,
    executionPlanId: planId,
    humanExecutionApprovalId: runtimeStart.humanExecutionApprovalId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
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
      workingDirectory: worktreePath,
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
  reviewTargetSha: string,
  worktreePath: string,
  branch: string,
  specificationPath: string,
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
  decision: "Approved" | "ChangesRequested" | "Unknown",
): ReviewerRuntimeOutcome {
  const spawned = status === "Completed" || status === "TimedOut";
  const reviewerRuntimeId = createReviewerRuntimeId(PROJECT_ID, reviewTargetId);
  const result = {
    id: createReviewerRuntimeResultId(PROJECT_ID, reviewTargetId),
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
      workingDirectory: worktreePath,
      reviewTargetSha,
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
