import { describe, expect, it, vi } from "vitest";

import {
  CodexReviewerRuntimeProvider,
  REVIEWER_SPAWN_ALLOW_ENV_VAR,
} from "./reviewer-runtime/CodexReviewerRuntimeProvider";
import { ReviewerRuntimeService } from "./reviewer-runtime/ReviewerRuntimeService";
import type { ReviewerRuntimeInput, ReviewerRuntimeOutcome } from "./reviewer-runtime/ReviewerRuntimeTypes";
import { resolveReviewTarget } from "./reviewer-runtime/ReviewTarget";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createDeferred,
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  flushPromises,
  getControllerInternals,
  realUpsertResult,
  type ControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";

describe("OfficeProjectPortalController Reviewer Runtime concurrency and isolation", () => {
  it("blocks a duplicate concurrent Start-Reviewer attempt without invoking the provider a second time", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controller, internals);

    const deferred = createDeferred<ReviewerRuntimeOutcome>();
    const startReviewer = vi.fn(() => deferred.promise);
    internals.reviewerRuntimeService = { startReviewer, upsertResult: realUpsertReviewerResult(internals) };

    const first = internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);
    const second = internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);

    // Whichever of the two concurrent attempts loses the active-key race
    // resolves immediately to a stored Blocked "already active" result
    // without waiting on the other attempt's still-pending real provider
    // call -- flushing microtasks (not awaiting `first`/`second` directly)
    // proves that resolution doesn't depend on the deferred provider call
    // settling first, regardless of which of the two settles fastest.
    await flushPromises();
    expect(startReviewer).toHaveBeenCalledTimes(1);
    expect(internals.state.reviewerRuntimeResultCollections["daily-proof"]?.results.at(-1)).toMatchObject({
      status: "Blocked",
      reasonCodes: ["REVIEWER_RUNTIME_ALREADY_ACTIVE"],
      duplicateActiveAttempt: true,
    });

    deferred.resolve(createReviewerOutcome("Completed", "Approved", 0));
    await Promise.all([first, second]);
    expect(startReviewer).toHaveBeenCalledTimes(1);
  });

  it("allows a fresh explicit Start-Reviewer action after a prior attempt reached a terminal result", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controller, internals);

    const startReviewer = vi.fn(async () => createReviewerOutcome("Completed", "Approved", 0));
    internals.reviewerRuntimeService = { startReviewer, upsertResult: realUpsertReviewerResult(internals) };

    await internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(startReviewer).toHaveBeenCalledTimes(1);

    // A second, later explicit action is a fresh request, not a concurrent
    // duplicate -- the active-attempt guard has already been released, so
    // the provider is consulted again (duplicate-start protection is about
    // overlapping in-flight calls, not about forbidding all future retries).
    await internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(startReviewer).toHaveBeenCalledTimes(2);
  });

  it("never touches project B's Reviewer Runtime state when project A's attempt is triggered", async () => {
    const controllerA = new OfficeProjectPortalController(createSceneStub());
    const internalsA = getControllerInternals(controllerA);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controllerA, internalsA);

    internalsA.reviewerRuntimeService = {
      startReviewer: vi.fn(async () => createReviewerOutcome("Completed", "Approved", 0)),
      upsertResult: realUpsertReviewerResult(internalsA),
    };

    await internalsA.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);

    expect(internalsA.state.reviewerRuntimeResultCollections["daily-proof"]?.results.length).toBeGreaterThan(0);
    expect(internalsA.state.reviewerRuntimeCollections["portfolio"]).toBeUndefined();
    expect(internalsA.state.reviewerRuntimeResultCollections["portfolio"]).toBeUndefined();
  });

  it("does not create, modify, or remove any task as a side effect of a Reviewer Runtime attempt", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controller, internals);

    internals.reviewerRuntimeService = {
      startReviewer: vi.fn(async () => createReviewerOutcome("Completed", "Approved", 0)),
      upsertResult: realUpsertReviewerResult(internals),
    };

    const beforeTasks = JSON.parse(JSON.stringify(internals.state.taskCollections));
    await internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(internals.state.taskCollections).toEqual(beforeTasks);
  });

  it("clears a stale Reviewer Runtime record when the upstream plan is invalidated by a branch change", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controller, internals);

    internals.reviewerRuntimeService = {
      startReviewer: vi.fn(async () => createReviewerOutcome("Completed", "Approved", 0)),
      upsertResult: realUpsertReviewerResult(internals),
    };
    await internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(internals.state.reviewerRuntimeCollections["daily-proof"]?.runtimes.length).toBeGreaterThan(0);

    // Invalidate the plan the same way the existing stale-branch regression
    // test does: change the synced branch out from under the recorded plan.
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      ...internals.state.repositorySyncSnapshots["daily-proof"],
      currentBranch: "some-other-branch",
    };

    controller.updateInput(createInput({ enterPressed: true }));

    expect(internals.state.reviewerRuntimeCollections["daily-proof"]).toBeUndefined();
    expect(internals.state.reviewerRuntimeResultCollections["daily-proof"]).toBeUndefined();
  });

  it("reports a Blocked stale-chain result (not a Failed/malformed command) when the Implementer Runtime is invalidated between the guard check and the service call", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToCompletedImplementer(controller, internals);

    const startReviewer = vi.fn(async () => createReviewerOutcome("Completed", "Approved", 0));
    internals.reviewerRuntimeService = { startReviewer, upsertResult: realUpsertReviewerResult(internals) };

    // Invalidate the plan the same way the existing stale-branch regression
    // test does, but then call startReviewerRuntimeForPromotion directly
    // (rather than the generic Enter cascade) so its internal Implementer
    // Runtime revalidation runs and comes back stale right before the
    // reviewer service would otherwise be called.
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      ...internals.state.repositorySyncSnapshots["daily-proof"],
      currentBranch: "some-other-branch",
    };

    await internals.startReviewerRuntimeForPromotion("daily-proof", promotedTaskId);

    expect(startReviewer).not.toHaveBeenCalled();
    const result = internals.state.reviewerRuntimeResultCollections["daily-proof"]?.results.at(-1);
    expect(result?.status).toBe("Blocked");
    expect(result?.status).not.toBe("Failed");
  });

  it("wires the controller's real default ReviewerRuntimeService and CodexReviewerRuntimeProvider end to end, safely blocking at the always-Uncommitted review-target gate without spawning", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToCompletedImplementer(controller, internals);

    // IMPORTANT: uses the controller's own default-wired ReviewerRuntimeService
    // and its real, unmodified, approved Codex command configuration -- no
    // substituted command, no stubbing of the Reviewer Runtime path itself.
    // Only the Implementer Runtime service above is stubbed (to reach a
    // Completed Implementer Runtime without a real Claude spawn).
    //
    // This does NOT reach the spawn-allow env-var gate: ReviewTarget.ts's
    // resolveReviewTarget (which the controller always calls fresh) can only
    // ever report workingTreeState "Uncommitted" -- this repository has no
    // real git-backed stage yet, so a controller-driven attempt blocks at
    // validateReviewTarget's REVIEWER_RUNTIME_TARGET_UNCOMMITTED check,
    // strictly before the command-config check and long before
    // provider.invoke is ever called. That's what this test actually proves:
    // the controller's real wiring reaches the real service and blocks
    // safely, without spawning, before any command is even assembled. The
    // spawn-allow env-var gate itself is exercised separately below, via a
    // direct ReviewerRuntimeService call with a "Clean" ReviewTarget fixture
    // (the only way to reach past this gate -- see ReviewTarget.ts's docs).
    const originalSpawnAllowEnv = process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    try {
      controller.updateInput(createInput({ startReviewerPressed: true }));
      await flushPromises();
    } finally {
      if (originalSpawnAllowEnv === undefined) delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
      else process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = originalSpawnAllowEnv;
    }

    const result = internals.state.reviewerRuntimeResultCollections["daily-proof"]?.results.at(-1);
    expect(result).toBeDefined();
    expect(result?.status).toBe("Blocked");
    expect(result?.reasonCodes).toContain("REVIEWER_RUNTIME_TARGET_UNCOMMITTED");
    expect(result?.agentStarted).toBe(false);
    expect(result?.reviewerStarted).toBe(false);
    expect(result?.validationStarted).toBe(false);
    expect(result?.githubMutationStarted).toBe(false);
  });
});

// ReviewTarget.ts's resolveReviewTarget always reports workingTreeState
// "Uncommitted" (this repository has no real git-backed stage yet), so no
// controller-driven attempt can ever clear validateReviewTarget to reach the
// checks below it -- see ReviewTarget.ts's own docs, which prescribe
// constructing a ReviewTarget fixture directly and calling
// ReviewerRuntimeService.startReviewer directly, rather than through the
// controller's promotion flow, to exercise them.
describe("ReviewerRuntimeService direct validation beyond the review-target gate", () => {
  it("blocks a non-approved substituted command before it ever reaches the provider, even when the spawn-allow env var is set", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToCompletedImplementer(controller, internals);

    const input = buildValidReviewerInput(internals);

    // Two independent gates must both hold: the service's exact-approved-
    // command check, and the provider's spawn-allow env-var check. This
    // proves the first gate alone is sufficient to block a substituted
    // command -- REVIEWER_RUNTIME_COMMAND_UNSAFE can only be produced by the
    // service's own config check, never by the provider, so seeing it here
    // (even with the env var set) proves the service intercepted this before
    // the provider was ever consulted.
    const service = new ReviewerRuntimeService(new CodexReviewerRuntimeProvider(), {
      command: process.execPath,
      arguments: ["--version"],
      inputMode: "argument",
      timeoutMs: 5000,
    });

    const originalSpawnAllowEnv = process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = "1";
    let outcome: ReviewerRuntimeOutcome;
    try {
      outcome = await service.startReviewer(input);
    } finally {
      if (originalSpawnAllowEnv === undefined) delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
      else process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = originalSpawnAllowEnv;
    }

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
    expect(outcome.result.agentStarted).toBe(false);
  });

  it("with the real approved Codex command config and a Clean review target, blocks at the spawn-allow env-var gate without ever attempting node:child_process", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToCompletedImplementer(controller, internals);

    const input = buildValidReviewerInput(internals);

    // The real, unmodified, approved Codex command config -- no substituted
    // command -- so this reaches all the way to provider.invoke. The
    // sibling Implementer Runtime test's documented incident (an early
    // version spawned five real, live, unsupervised Claude Code agent
    // processes before being caught and killed) is exactly why
    // AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN exists; this test deliberately
    // leaves it unset, so the real provider safely reports Blocked at its
    // own env-var gate without ever attempting node:child_process.
    const service = new ReviewerRuntimeService(new CodexReviewerRuntimeProvider());

    const originalSpawnAllowEnv = process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
    let outcome: ReviewerRuntimeOutcome;
    try {
      outcome = await service.startReviewer(input);
    } finally {
      if (originalSpawnAllowEnv === undefined) delete process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR];
      else process.env[REVIEWER_SPAWN_ALLOW_ENV_VAR] = originalSpawnAllowEnv;
    }

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_PROVIDER_UNAVAILABLE");
    expect(outcome.result.agentStarted).toBe(false);
  });
});

/**
 * Drives a promoted Daily Proof candidate task all the way through Runtime
 * Start (reusing driveDailyProofToRuntimeStart) and then through a stubbed,
 * Completed Implementer Runtime -- the precondition
 * startReviewerRuntimeForPromotion requires before a Reviewer Runtime
 * attempt can proceed at all (see ReviewerRuntimeView's Codex-unavailable
 * gating). The stub is left wired on the controller afterward, since
 * startReviewerRuntimeForPromotion internally revalidates the Implementer
 * Runtime on every call.
 */
async function driveDailyProofToCompletedImplementer(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
): Promise<{ promotedTaskId: string }> {
  const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

  const plan = internals.state.executionPlanCollections["daily-proof"]?.plans[0];
  const runtimeStart = internals.state.runtimeStartCollections["daily-proof"]?.starts[0];
  if (!plan || !runtimeStart) {
    throw new Error("Test setup failed to reach an Execution Plan and Runtime Start.");
  }

  // The Reviewer Runtime gate below matches the driven Implementer Runtime
  // result to the real Execution Plan by executionPlanId (see
  // OfficeProjectPortalController.startReviewerRuntimeForPromotion's
  // hadCompletedImplementerRuntime check), so this stub must carry the real
  // plan/runtime-start ids rather than the sibling Implementer Runtime
  // test's hardcoded "test-plan" fixture.
  internals.implementerRuntimeService = {
    startImplementer: vi.fn(async () =>
      createImplementerOutcomeForPlan(
        plan.planId,
        runtimeStart.runtimeStartId,
        plan.worktreePath,
        plan.branchName,
        plan.specPath,
        "Completed",
      ),
    ),
    upsertResult: realUpsertResult(internals),
  };
  await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);

  const completed = internals.state.implementerRuntimeResultCollections["daily-proof"]?.results.at(-1);
  if (completed?.status !== "Completed") {
    throw new Error(
      `Test setup failed to reach a Completed Implementer Runtime (found ${completed?.status}) -- fixture drifted from the real controller flow.`,
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
  // Mirrors ImplementerRuntimeService's own createResult, which only ever
  // populates implementerRuntimeId once an ImplementerRuntime record exists
  // (i.e. a spawned Completed/TimedOut attempt) -- a drift from that real
  // behavior here would let this fixture silently pass checks the real
  // service-produced result could never pass.
  const result = {
    id: `daily-proof:implementer-runtime-result:${planId}:${status}`,
    projectId: "daily-proof",
    runtimeStartId,
    executionPlanId: planId,
    implementerRuntimeId: spawned ? `daily-proof:implementer-runtime:${runtimeStartId}:claude-implementer-v1` : undefined,
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
    implementerRuntimeId: `daily-proof:implementer-runtime:${runtimeStartId}:claude-implementer-v1`,
    projectId: "daily-proof",
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
    promptId: `daily-proof:implementer-prompt:${runtimeStartId}:claude-implementer-v1`,
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
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-076",
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
    resultCollection: { projectId: "daily-proof", results: [result], resultCount: 1, rulesVersion: "claude-implementer-v1" },
    runtimeCollection: { projectId: "daily-proof", runtimes: [runtime], runtimeCount: 1, rulesVersion: "claude-implementer-v1" },
  };
}

/**
 * Assembles a fully valid ReviewerRuntimeInput from the real state
 * driveDailyProofToCompletedImplementer leaves behind, mirroring
 * startReviewerRuntimeForPromotion's own lookup chain exactly -- except the
 * reviewTarget's workingTreeState is forced to "Clean". resolveReviewTarget
 * always reports "Uncommitted" until a real git-backed stage exists (see
 * ReviewTarget.ts), so no controller-driven path can ever produce a target
 * that clears validateReviewTarget; only a direct fixture can, exactly as
 * ReviewTarget.ts's own docs prescribe for exercising checks beyond it.
 */
function buildValidReviewerInput(internals: ControllerInternals): ReviewerRuntimeInput {
  const projectId = "daily-proof";
  const plan = internals.state.executionPlanCollections[projectId]?.plans[0];
  if (!plan) throw new Error("Test setup failed to reach an Execution Plan.");

  const readiness = internals.state.executionReadinessCollections[projectId]?.readiness.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const readinessResult = internals.state.executionReadinessResultCollections[projectId]?.results.find(
    (item) => item.executionPlanId === plan.planId && item.readinessId === readiness?.readinessId,
  );
  const approval = internals.state.humanExecutionApprovalCollections[projectId]?.approvals.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const preflight = internals.state.runtimePreflightCollections[projectId]?.preflights.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const preflightResult = internals.state.runtimePreflightResultCollections[projectId]?.results.find(
    (item) => item.executionPlanId === plan.planId && item.preflightId === preflight?.preflightId,
  );
  const runtimeStart = internals.state.runtimeStartCollections[projectId]?.starts.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const runtimeStartResult = internals.state.runtimeStartResultCollections[projectId]?.results.find(
    (item) => item.executionPlanId === plan.planId && item.runtimeStartId === runtimeStart?.runtimeStartId,
  );
  const implementerRuntime = internals.state.implementerRuntimeCollections[projectId]?.runtimes.find(
    (item) => item.executionPlanId === plan.planId,
  );
  const implementerRuntimeResult = internals.state.implementerRuntimeResultCollections[projectId]?.results.find(
    (item) =>
      item.executionPlanId === plan.planId &&
      item.implementerRuntimeId === implementerRuntime?.implementerRuntimeId &&
      item.status === "Completed",
  );
  if (!readiness || !readinessResult || !approval || !preflight || !preflightResult || !runtimeStart || !runtimeStartResult || !implementerRuntime || !implementerRuntimeResult) {
    throw new Error("Test setup failed to reach a fully valid Reviewer Runtime context.");
  }

  const reviewTarget = { ...resolveReviewTarget(plan, runtimeStart, implementerRuntime), workingTreeState: "Clean" as const };

  return {
    command: {
      projectId,
      runtimeStartId: runtimeStart.runtimeStartId,
      executionPlanId: plan.planId,
      approvedImplementerAgent: "claude",
      approvedReviewerAgent: "codex",
      startedBy: "Local Human",
      requestedAt: new Date().toISOString(),
    },
    executionPlan: plan,
    readiness,
    readinessResult,
    approval,
    preflight,
    preflightResult,
    runtimeStart,
    runtimeStartResult,
    implementerRuntime,
    implementerRuntimeResult,
    reviewTarget,
  };
}

function realUpsertReviewerResult(internals: ControllerInternals) {
  // Mirrors the real ReviewerRuntimeService.upsertResult behavior closely
  // enough for the controller's own duplicate-active-attempt block path,
  // which calls upsertResult directly against whatever service is wired in.
  return (
    collection: ControllerInternals["state"]["reviewerRuntimeResultCollections"][string] | undefined,
    result: ControllerInternals["state"]["reviewerRuntimeResultCollections"][string]["results"][number],
  ) => {
    const existing = collection?.results ?? [];
    const nextResults = existing.some((item) => item.id === result.id)
      ? existing.map((item) => (item.id === result.id ? result : item))
      : [...existing, result];
    return {
      projectId: collection?.projectId ?? result.projectId,
      results: nextResults,
      resultCount: nextResults.length,
      generatedAt: result.resultAt,
      rulesVersion: result.rulesVersion,
    };
  };
}

function createReviewerOutcome(
  status: "Completed" | "TimedOut" | "Blocked" | "Failed",
  decision: "Approved" | "ChangesRequested" | "Unknown" = "Unknown",
  blockingFindingCount = 0,
): ReviewerRuntimeOutcome {
  const spawned = status === "Completed" || status === "TimedOut";
  const result = {
    id: `daily-proof:reviewer-runtime-result:test:${status}`,
    projectId: "daily-proof",
    status,
    decision,
    blockingFindingCount,
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
    return { result, resultCollection: { projectId: "daily-proof", results: [result], resultCount: 1, rulesVersion: "codex-reviewer-v1" } };
  }

  const runtime = {
    reviewerRuntimeId: "daily-proof:reviewer-runtime:test:codex-reviewer-v1",
    projectId: "daily-proof",
    runtimeStartId: "daily-proof:runtime-start:test:start-v1",
    implementerRuntimeId: "daily-proof:implementer-runtime:test:claude-implementer-v1",
    reviewTargetId: "daily-proof:review-target:test",
    reviewPromptId: "daily-proof:reviewer-prompt:test:codex-reviewer-v1",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-076",
    branch: "codex/076-codex-reviewer-runtime-foundation",
    specificationPath: "specs/076-codex-reviewer-runtime-foundation/spec.md",
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
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-076",
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
    resultCollection: { projectId: "daily-proof", results: [result], resultCount: 1, rulesVersion: "codex-reviewer-v1" },
    runtimeCollection: { projectId: "daily-proof", runtimes: [runtime], runtimeCount: 1, rulesVersion: "codex-reviewer-v1" },
  };
}
