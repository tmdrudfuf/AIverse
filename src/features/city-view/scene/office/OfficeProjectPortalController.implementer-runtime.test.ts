import { describe, expect, it, vi } from "vitest";

import type { ImplementerRuntimeOutcome } from "./implementer-runtime/ImplementerRuntimeTypes";
import {
  ClaudeImplementerRuntimeProvider,
  SPAWN_ALLOW_ENV_VAR,
} from "./implementer-runtime/ClaudeImplementerRuntimeProvider";
import { ImplementerRuntimeService } from "./implementer-runtime/ImplementerRuntimeService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createDeferred,
  createInput,
  createSceneStub,
  driveDailyProofToRuntimeStart,
  flushPromises,
  getControllerInternals,
  realUpsertResult,
} from "./OfficeProjectPortalController.testHelpers";

describe("OfficeProjectPortalController Implementer Runtime concurrency and isolation", () => {
  it("blocks a duplicate concurrent Start-Implementer attempt without invoking the provider a second time", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    const deferred = createDeferred<ImplementerRuntimeOutcome>();
    const startImplementer = vi.fn(() => deferred.promise);
    internals.implementerRuntimeService = { startImplementer, upsertResult: realUpsertResult(internals) };

    const first = internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);
    const second = internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);

    // The second call must resolve to "handled" (a stored Blocked result) without
    // waiting on the first attempt's provider call at all.
    await second;
    expect(startImplementer).toHaveBeenCalledTimes(1);
    expect(internals.state.implementerRuntimeResultCollections["daily-proof"]?.results.at(-1)).toMatchObject({
      status: "Blocked",
      reasonCodes: ["IMPLEMENTER_RUNTIME_ALREADY_ACTIVE"],
      duplicateActiveAttempt: true,
    });

    deferred.resolve(createOutcome("Completed"));
    await first;
    expect(startImplementer).toHaveBeenCalledTimes(1);
  });

  it("allows a fresh explicit Start-Implementer action after a prior attempt reached a terminal result", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    const startImplementer = vi.fn(async () => createOutcome("Completed"));
    internals.implementerRuntimeService = { startImplementer, upsertResult: realUpsertResult(internals) };

    await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(startImplementer).toHaveBeenCalledTimes(1);

    // A second, later explicit action is a fresh request, not a concurrent
    // duplicate -- the active-attempt guard has already been released, so
    // the provider is consulted again (duplicate-start protection is about
    // overlapping in-flight calls, not about forbidding all future retries).
    await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(startImplementer).toHaveBeenCalledTimes(2);
  });

  it("never touches project B's Implementer Runtime state when project A's attempt is triggered", async () => {
    const controllerA = new OfficeProjectPortalController(createSceneStub());
    const internalsA = getControllerInternals(controllerA);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controllerA, internalsA);

    internalsA.implementerRuntimeService = {
      startImplementer: vi.fn(async () => createOutcome("Completed")),
      upsertResult: realUpsertResult(internalsA),
    };

    await internalsA.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);

    expect(internalsA.state.implementerRuntimeResultCollections["daily-proof"]?.results.length).toBeGreaterThan(0);
    expect(internalsA.state.implementerRuntimeCollections["portfolio"]).toBeUndefined();
    expect(internalsA.state.implementerRuntimeResultCollections["portfolio"]).toBeUndefined();
  });

  it("does not create, modify, or remove any task as a side effect of an Implementer Runtime attempt", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    internals.implementerRuntimeService = {
      startImplementer: vi.fn(async () => createOutcome("Completed")),
      upsertResult: realUpsertResult(internals),
    };

    const beforeTasks = JSON.parse(JSON.stringify(internals.state.taskCollections));
    await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(internals.state.taskCollections).toEqual(beforeTasks);
  });

  it("clears a stale Implementer Runtime record when the upstream plan is invalidated by a branch change", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    internals.implementerRuntimeService = {
      startImplementer: vi.fn(async () => createOutcome("Completed")),
      upsertResult: realUpsertResult(internals),
    };
    await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);
    expect(internals.state.implementerRuntimeCollections["daily-proof"]?.runtimes.length).toBeGreaterThan(0);

    // Invalidate the plan the same way the existing stale-branch regression
    // test does: change the synced branch out from under the recorded plan.
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      ...internals.state.repositorySyncSnapshots["daily-proof"],
      currentBranch: "some-other-branch",
    };

    controller.updateInput(createInput({ enterPressed: true }));

    expect(internals.state.implementerRuntimeCollections["daily-proof"]).toBeUndefined();
    expect(internals.state.implementerRuntimeResultCollections["daily-proof"]).toBeUndefined();
  });

  it("reports a Blocked stale-chain result (not a Failed/malformed command) when Runtime Start is invalidated between the guard check and the service call", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    const { promotedTaskId } = await driveDailyProofToRuntimeStart(controller, internals);

    const startImplementer = vi.fn(async () => createOutcome("Completed"));
    internals.implementerRuntimeService = { startImplementer, upsertResult: realUpsertResult(internals) };

    // Invalidate the plan the same way the existing stale-branch regression
    // test does, but then call startImplementerRuntimeForPromotion directly
    // (rather than the generic Enter cascade) so revalidation runs and
    // Runtime Start comes back missing/stale right before the service would
    // otherwise be called.
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      ...internals.state.repositorySyncSnapshots["daily-proof"],
      currentBranch: "some-other-branch",
    };

    await internals.startImplementerRuntimeForPromotion("daily-proof", promotedTaskId);

    expect(startImplementer).not.toHaveBeenCalled();
    const result = internals.state.implementerRuntimeResultCollections["daily-proof"]?.results.at(-1);
    expect(result?.status).toBe("Blocked");
    expect(result?.reasonCodes).toContain("IMPLEMENTER_RUNTIME_START_STALE");
    expect(result?.status).not.toBe("Failed");
    expect(result?.reasonCodes).not.toContain("IMPLEMENTER_RUNTIME_MALFORMED");
  });

  it("wires the controller's real default ImplementerRuntimeService and ClaudeImplementerRuntimeProvider end to end, safely stopping at the spawn-allow env-var gate", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToRuntimeStart(controller, internals);

    // IMPORTANT: uses the controller's own default-wired service and its
    // real, unmodified, approved Claude command configuration -- no
    // substituted command. ImplementerRuntimeService now rejects any
    // command configuration that is not an exact match for the approved
    // one (a Codex review finding: a harmless-but-different substitute like
    // `node --version` must not be treated as equivalent to "approved"), so
    // a test wanting to reach the real ClaudeImplementerRuntimeProvider
    // through the service can no longer inject a safe substitute -- it must
    // use the real config. That real config's command is the literal
    // `claude` CLI with `--dangerously-skip-permissions`; an early version
    // of this test spawned five real, live, unsupervised Claude Code agent
    // processes against this actual worktree before being caught and
    // killed, which is exactly why AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN
    // exists. This test deliberately leaves that variable unset, so the
    // real service correctly accepts the real config and reaches the real
    // provider, which then safely reports Blocked at the env-var gate
    // without ever attempting node:child_process at all -- proving the full
    // wiring is correct without spawning anything.
    const originalSpawnAllowEnv = process.env[SPAWN_ALLOW_ENV_VAR];
    delete process.env[SPAWN_ALLOW_ENV_VAR];
    try {
      controller.updateInput(createInput({ startImplementerPressed: true }));
      await flushPromises();
    } finally {
      if (originalSpawnAllowEnv === undefined) delete process.env[SPAWN_ALLOW_ENV_VAR];
      else process.env[SPAWN_ALLOW_ENV_VAR] = originalSpawnAllowEnv;
    }

    const result = internals.state.implementerRuntimeResultCollections["daily-proof"]?.results.at(-1);
    expect(result).toBeDefined();
    expect(result?.status).toBe("Blocked");
    expect(result?.agentStarted).toBe(false);
    expect(result?.reviewerStarted).toBe(false);
    expect(result?.validationStarted).toBe(false);
    expect(result?.githubMutationStarted).toBe(false);
  });

  it("blocks a non-approved substituted command before it ever reaches the provider, even when the spawn-allow env var is set", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToRuntimeStart(controller, internals);

    // Two independent gates must both hold: the service's exact-approved-
    // command check, and the provider's spawn-allow env-var check. This
    // proves the first gate alone is sufficient to block a substituted
    // command -- IMPLEMENTER_RUNTIME_COMMAND_UNSAFE can only be produced by
    // the service's own config check, never by the provider, so seeing it
    // here (even with the env var set) proves the service intercepted this
    // before the provider was ever consulted.
    internals.implementerRuntimeService = new ImplementerRuntimeService(new ClaudeImplementerRuntimeProvider(), {
      command: process.execPath,
      arguments: ["--version"],
      inputMode: "argument",
      timeoutMs: 5000,
    });

    const originalSpawnAllowEnv = process.env[SPAWN_ALLOW_ENV_VAR];
    process.env[SPAWN_ALLOW_ENV_VAR] = "1";
    try {
      controller.updateInput(createInput({ startImplementerPressed: true }));
      await flushPromises();
    } finally {
      if (originalSpawnAllowEnv === undefined) delete process.env[SPAWN_ALLOW_ENV_VAR];
      else process.env[SPAWN_ALLOW_ENV_VAR] = originalSpawnAllowEnv;
    }

    const result = internals.state.implementerRuntimeResultCollections["daily-proof"]?.results.at(-1);
    expect(result?.status).toBe("Blocked");
    expect(result?.reasonCodes).toContain("IMPLEMENTER_RUNTIME_COMMAND_UNSAFE");
    expect(result?.agentStarted).toBe(false);
  });
});

function createOutcome(status: "Completed" | "TimedOut" | "Blocked" | "Failed"): ImplementerRuntimeOutcome {
  const spawned = status === "Completed" || status === "TimedOut";
  const result = {
    id: `daily-proof:implementer-runtime-result:test:${status}`,
    projectId: "daily-proof",
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
  if (!spawned) {
    return { result, resultCollection: { projectId: "daily-proof", results: [result], resultCount: 1, rulesVersion: "claude-implementer-v1" } };
  }

  const runtime = {
    implementerRuntimeId: "daily-proof:implementer-runtime:test:claude-implementer-v1",
    projectId: "daily-proof",
    runtimeStartId: "daily-proof:runtime-start:test:start-v1",
    executionPlanId: "test-plan",
    humanExecutionApprovalId: "test-approval",
    runtimePreflightId: "test-preflight",
    taskId: "test-task",
    confirmedAssignmentId: "test-assignment",
    preparedSessionId: "test-prepared",
    activeSessionId: "test-session",
    employeeId: "gpt-engineer",
    repositoryId: "github:ai-verse/daily-proof",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-075",
    branch: "codex/075-claude-implementer-runtime-foundation",
    specificationPath: "specs/075-claude-implementer-runtime-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    promptId: "daily-proof:implementer-prompt:test:claude-implementer-v1",
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
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-075",
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
