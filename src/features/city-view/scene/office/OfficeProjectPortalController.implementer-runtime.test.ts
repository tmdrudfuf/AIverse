import { describe, expect, it, vi } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { ActiveWorkSessionStartResultCollection } from "./active-work-sessions/ActiveWorkSessionTypes";
import type { ExecutionPlanCollection, ExecutionPlanResultCollection } from "./execution-plans/ExecutionPlanTypes";
import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResultCollection,
} from "./execution-readiness/ExecutionReadinessTypes";
import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResultCollection,
} from "./human-execution-approvals/HumanExecutionApprovalTypes";
import type {
  RuntimeStartCollection,
  RuntimeStartResultCollection,
} from "./runtime-start/RuntimeStartTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import type {
  ImplementerRuntimeCollection,
  ImplementerRuntimeResultCollection,
  ImplementerRuntimeInput,
  ImplementerRuntimeOutcome,
} from "./implementer-runtime/ImplementerRuntimeTypes";
import {
  ClaudeImplementerRuntimeProvider,
  SPAWN_ALLOW_ENV_VAR,
} from "./implementer-runtime/ClaudeImplementerRuntimeProvider";
import { ImplementerRuntimeService } from "./implementer-runtime/ImplementerRuntimeService";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type {
  PreparedWorkSessionRecord,
  PreparedWorkSessionResultCollection,
} from "./prepared-work-sessions/PreparedWorkSessionTypes";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

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

  it("wires a real ImplementerRuntimeService and ClaudeImplementerRuntimeProvider end to end via the explicit startImplementerPressed input", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToRuntimeStart(controller, internals);

    // IMPORTANT: do not use the controller's own default-wired service here.
    // That default config's command is the literal `claude` CLI with
    // `--dangerously-skip-permissions`, and this test previously spawned five
    // real, live, unsupervised Claude Code agent processes against this
    // actual worktree before being caught and killed -- exactly the danger
    // quickstart.md's "Safe Manual Smoke Test" section exists to fence off
    // as opt-in and human-triggered, never something the automated suite
    // runs. To still prove the real ImplementerRuntimeService + real
    // ClaudeImplementerRuntimeProvider wiring (guarded dynamic import,
    // command-safety validation, prompt substitution, real spawnSync, real
    // result mapping) without spawning anything dangerous, inject a harmless
    // instant command (`node --version`) in place of the real Claude
    // command config.
    internals.implementerRuntimeService = new ImplementerRuntimeService(new ClaudeImplementerRuntimeProvider(), {
      command: process.execPath,
      arguments: ["--version"],
      inputMode: "argument",
      timeoutMs: 5000,
    });

    // ClaudeImplementerRuntimeProvider additionally requires an explicit
    // AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN=1 opt-in before it will ever
    // resolve the real node:child_process spawnSync (added after the
    // incident described above) -- set it only for this one deliberate,
    // harmless invocation, and always restore it afterward.
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
    expect(result).toBeDefined();
    expect(result?.status).toBe("Completed");
    expect(result?.agentStarted).toBe(true);
    expect(result?.reviewerStarted).toBe(false);
    expect(result?.validationStarted).toBe(false);
    expect(result?.githubMutationStarted).toBe(false);
  });

  it("reports Blocked (not a real spawn) when the explicit spawn-allow env var is not set, even through the full controller wiring", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    await driveDailyProofToRuntimeStart(controller, internals);

    internals.implementerRuntimeService = new ImplementerRuntimeService(new ClaudeImplementerRuntimeProvider(), {
      command: process.execPath,
      arguments: ["--version"],
      inputMode: "argument",
      timeoutMs: 5000,
    });

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
    expect(result?.status).toBe("Blocked");
    expect(result?.agentStarted).toBe(false);
  });
});

/**
 * Drives a promoted Daily Proof candidate task through the full existing
 * chain (approve -> promote -> confirm assignment -> prepare -> start ->
 * create execution plan -> evaluate readiness -> approve execution -> run
 * runtime preflight -> explicit runtime start), reusing the exact sequence
 * established in OfficeProjectPortalController.issue-sync.test.ts's "creates
 * an execution plan only after a separate input following work-session
 * start" test. Returns the resulting promoted ProjectTask's id.
 */
async function driveDailyProofToRuntimeStart(
  controller: OfficeProjectPortalController,
  internals: ControllerInternals,
): Promise<{ promotedTaskId: string }> {
  setDailyProofIdentity(internals);
  internals.state.projects.find((project) => project.id === "daily-proof")!.repositoryIdentity = {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-075",
    connectionState: "Available",
  };
  internals.state.repositorySyncSnapshots["daily-proof"] = {
    provider: "github",
    availability: "available",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    currentBranch: "codex/075-claude-implementer-runtime-foundation",
    syncStatus: "Succeeded",
    workingTreeState: "clean",
  };
  internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
  internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
  internals.issueSyncService = {
    readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
  };

  controller.open();
  controller.updateInput(createInput({}));
  internals.state.viewMode = "project-dashboard";
  internals.state.selectedProjectDashboardProjectId = "daily-proof";
  await internals.syncIssueSnapshots("daily-proof");

  controller.updateInput(createInput({ enterPressed: true })); // approve
  controller.updateInput(createInput({ enterPressed: true })); // promote
  controller.updateInput(createInput({ enterPressed: true })); // confirm assignment
  controller.updateInput(createInput({ enterPressed: true })); // prepare
  controller.updateInput(createInput({ enterPressed: true })); // start
  controller.updateInput(createInput({ enterPressed: true })); // create execution plan
  controller.updateInput(createInput({ enterPressed: true })); // evaluate execution readiness
  controller.updateInput(createInput({ enterPressed: true })); // approve execution
  controller.updateInput(createInput({ enterPressed: true })); // run runtime preflight
  controller.updateInput(createInput({ enterPressed: true })); // explicit runtime start

  const starts = internals.state.runtimeStartCollections["daily-proof"]?.starts ?? [];
  if (starts.length !== 1) {
    throw new Error(
      `Test setup failed to reach a single Runtime Start record (found ${starts.length}) -- fixture drifted from the real controller flow.`,
    );
  }

  const plan = internals.state.executionPlanCollections["daily-proof"]?.plans[0];
  if (!plan) throw new Error("Test setup failed to reach an Execution Plan.");

  return { promotedTaskId: plan.candidateTaskId ?? plan.projectTaskId };
}

function realUpsertResult(internals: ControllerInternals) {
  // Mirrors the real ImplementerRuntimeService.upsertResult behavior closely
  // enough for the controller's own duplicate-active-attempt block path,
  // which calls upsertResult directly against whatever service is wired in.
  return (collection: ImplementerRuntimeResultCollection | undefined, result: ImplementerRuntimeResultCollection["results"][number]) => {
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

function succeededIssueCollectionWithBug(): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [createIssue("ai-verse/daily-proof#1", 1, "Fix crash", ["bug"])],
    openCount: 1,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
  };
}

function createIssue(id: string, number: number, title: string, labels: string[] = [], state: "Open" | "Closed" = "Open") {
  return {
    id,
    number,
    title,
    state,
    assignees: [],
    labels,
    provider: "github",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: "2026-01-01T00:00:00.000Z",
  };
}

type ProjectPortalProjectLike = {
  id: string;
  repositoryIdentity?: unknown;
};

type ControllerInternals = {
  state: {
    viewMode: string;
    selectedProjectDashboardProjectId: string | undefined;
    projects: ProjectPortalProjectLike[];
    repositorySummaries: Record<string, { connectionStatus: string }>;
    repositorySyncSnapshots: ProjectPortalState["repositorySyncSnapshots"];
    issueSyncCollections: Record<string, IssueSnapshotCollection>;
    candidateTaskCollections: Record<string, CandidateTaskCollection>;
    candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
    candidatePromotionReviewCollections: Record<string, CandidatePromotionReviewCollection>;
    candidatePromotionDecisionRecords: Record<string, CandidatePromotionDecision>;
    candidateProjectTaskPromotionResultCollections: Record<string, CandidateProjectTaskPromotionResultCollection>;
    confirmedEmployeeAssignmentRecords: ProjectPortalState["confirmedEmployeeAssignmentRecords"];
    confirmedEmployeeAssignmentResultCollections: ProjectPortalState["confirmedEmployeeAssignmentResultCollections"];
    preparedWorkSessionRecords: Record<string, PreparedWorkSessionRecord>;
    preparedWorkSessionResultCollections: Record<string, PreparedWorkSessionResultCollection>;
    activeWorkSessionStartResultCollections: Record<string, ActiveWorkSessionStartResultCollection>;
    executionPlanCollections: Record<string, ExecutionPlanCollection>;
    executionPlanResultCollections: Record<string, ExecutionPlanResultCollection>;
    executionReadinessCollections: Record<string, ExecutionReadinessCollection>;
    executionReadinessResultCollections: Record<string, ExecutionReadinessResultCollection>;
    humanExecutionApprovalCollections: Record<string, HumanExecutionApprovalCollection>;
    humanExecutionApprovalResultCollections: Record<string, HumanExecutionApprovalResultCollection>;
    runtimePreflightCollections: ProjectPortalState["runtimePreflightCollections"];
    runtimePreflightResultCollections: ProjectPortalState["runtimePreflightResultCollections"];
    runtimeStartCollections: Record<string, RuntimeStartCollection>;
    runtimeStartResultCollections: Record<string, RuntimeStartResultCollection>;
    implementerRuntimeCollections: Record<string, ImplementerRuntimeCollection>;
    implementerRuntimeResultCollections: Record<string, ImplementerRuntimeResultCollection>;
    taskCollections: Record<string, TaskCollection>;
    employees: Employee[];
    workSessions: Record<string, WorkSession[]>;
  };
  issueSyncService: {
    readIssueSnapshots: (identity: { owner?: string; name?: string; provider: string }) => Promise<IssueSnapshotCollection>;
  };
  implementerRuntimeService: {
    startImplementer: (input: ImplementerRuntimeInput) => Promise<ImplementerRuntimeOutcome>;
    upsertResult: (
      collection: ImplementerRuntimeResultCollection | undefined,
      result: ImplementerRuntimeResultCollection["results"][number],
    ) => ImplementerRuntimeResultCollection;
  };
  syncIssueSnapshots: (projectId: string) => Promise<void>;
  startImplementerRuntimeForPromotion: (projectId: string, candidateTaskId: string) => Promise<boolean>;
};

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: [],
    description: "Employee",
    ...overrides,
  };
}

function setDailyProofIdentity(internals: ControllerInternals) {
  const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof");
  if (dailyProof) {
    dailyProof.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    startImplementerPressed: false,
    ...overrides,
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function createSceneStub(): PhaserScene {
  const createChainable = () => ({
    setOrigin: () => createChainable(),
    setScrollFactor: () => createChainable(),
    setDepth: () => createChainable(),
    setVisible: () => createChainable(),
    destroy: () => undefined,
  });
  const createGraphics = () => {
    const graphics = {
      fillStyle: () => graphics,
      fillRoundedRect: () => graphics,
      lineStyle: () => graphics,
      strokeRoundedRect: () => graphics,
      lineBetween: () => graphics,
    };
    return graphics;
  };
  const createContainer = () => ({
    add: () => undefined,
    removeAll: () => undefined,
    setScrollFactor: () => createContainer(),
    setDepth: () => createContainer(),
    setVisible: () => createContainer(),
    destroy: () => undefined,
  });

  return {
    scale: {
      width: 1024,
      height: 768,
    },
    add: {
      rectangle: () => createChainable(),
      graphics: () => createGraphics(),
      container: () => createContainer(),
      text: () => createChainable(),
    },
  } as unknown as PhaserScene;
}
