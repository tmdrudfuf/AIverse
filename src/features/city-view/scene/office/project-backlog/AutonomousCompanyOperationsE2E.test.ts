import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { BrowserOfficeSessionService } from "../browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "../browser-session/BrowserOfficeSessionTypes";
import { OfficeProjectPortalController } from "../OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  flushPromises,
  getControllerInternals,
} from "../OfficeProjectPortalController.testHelpers";
import type {
  StartExternalProjectAdosExecutionInput,
  StartExternalProjectAdosExecutionOutcome,
} from "../external-ados-execution/ExternalProjectAdosExecutionService";
import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import type {
  ProjectBacklogSuggestionProvider,
  ProjectBacklogSuggestionProviderCandidate,
} from "./ProjectBacklogSuggestionTypes";

// Spec 148 - Autonomous Company Operations End-to-End Verification.
//
// This file drives the real OfficeProjectPortalController and the real
// Spec 141-147 services through one controlled autonomous cycle:
//
//   Spec 147 bounded suggestion generation
//     -> Spec 145 controlled acceptance -> Spec 141 backlog
//     -> Spec 146 controlled Ready promotion
//     -> Spec 144 controlled autonomous execution
//     -> Spec 142 / Spec 138 development bridge -> ADOS.
//
// The Spec 143 suggestion provider is a deterministic fixture (allowed by the
// authoritative requirement 23) and the ADOS process boundary uses the
// existing injectable externalProjectAdosExecutionService.start adapter (as the
// Spec 144 suite does). No production source is changed by Spec 148.

const HIGH = "high" as const;

describe("Spec 148 autonomous company operations end-to-end", () => {
  it("composes one controlled cycle in order with each transition exactly once (Tests A-F, H-N, X, Y)", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([
      { title: "A11y audit doc", description: "Add a short accessibility checklist to docs/.", priority: HIGH },
      { title: "Bounded-out extra", description: "This second candidate must be bounded out.", priority: HIGH },
    ]);
    const start = vi.fn(startedOutcome);
    const controller = createController(storage, provider);
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = start;
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");

    // --- Test A: four automation controls toggle independently -------------
    expect(internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] }))
      .toBe(true);
    expectPolicyFlags(controller, { accept: true, ready: false, execute: false, suggest: false });

    expect(controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] })).toBe(true);
    await flushPromises();
    expectPolicyFlags(controller, { accept: true, ready: false, execute: true, suggest: false });

    expect(internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 }))
      .toBe(true);
    await flushPromises();
    // Enabling Auto Suggestions is the single bounded lifecycle event.
    expectPolicyFlags(controller, { accept: true, ready: false, execute: true, suggest: true });

    // --- Test B: Spec 147 generated a bounded, project-scoped suggestion ---
    const suggestionsA = internals.state.projectBacklogSuggestionCollections["project-a"]?.candidates ?? [];
    expect(suggestionsA).toHaveLength(1); // bounded to maxSuggestionsPerEvaluation
    expect(suggestionsA[0]).toMatchObject({ projectId: "project-a", status: "proposed" });
    const suggestionId = suggestionsA[0].id;
    // Spec 147 must not create a backlog task directly.
    expect(internals.state.projectBacklogCollections["project-a"]?.tasks ?? []).toEqual([]);
    // Project B received nothing.
    expect(internals.state.projectBacklogSuggestionCollections["project-b"]).toBeUndefined();

    // --- Test I: duplicate planning event does not duplicate the suggestion
    expect(await internals.evaluateSelectedProjectAutonomousSuggestionGeneration("replay-planning-event")).toBe(false);
    expect(internals.state.projectBacklogSuggestionCollections["project-a"].candidates).toHaveLength(1);

    // --- Test C: Spec 145 acceptance produces a backlog task, not Ready ----
    expect(internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()).toBe(true);
    const acceptedTasks = internals.state.projectBacklogCollections["project-a"].tasks;
    expect(acceptedTasks).toHaveLength(1);
    const acceptedTask = acceptedTasks[0];
    expect(acceptedTask).toMatchObject({
      projectId: "project-a",
      status: "backlog",
      suggestionAcceptanceMode: "automatic",
      sourceSuggestionId: suggestionId,
    });
    expect(acceptedTask.status).not.toBe("ready");
    // Spec 146 is still disabled -> no promotion happened as a side effect.
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionEnabled).toBe(false);
    const acceptedTaskId = acceptedTask.id;

    // --- Test J: duplicate acceptance evaluation does not duplicate the task
    internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept();
    expect(internals.state.projectBacklogCollections["project-a"].tasks).toHaveLength(1);

    // --- Test D: Spec 146 promotes backlog -> Ready exactly once ----------
    expect(internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    })).toBe(true);
    expectPolicyFlags(controller, { accept: true, ready: true, execute: true, suggest: true });
    const promotedTask = internals.state.projectBacklogCollections["project-a"].tasks
      .find((task) => task.id === acceptedTaskId)!;
    expect(promotedTask.status).toBe("ready");
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionPromotedCount).toBe(1);
    // Spec 146 must not start development directly.
    expect(start).not.toHaveBeenCalled();
    expect(promotedTask.executionRunId).toBeUndefined();

    // --- Test K: duplicate readiness evaluation does not duplicate --------
    expect(internals.evaluateSelectedProjectBacklogReadinessPromotion()).toBe(false);
    const readyTasks = internals.state.projectBacklogCollections["project-a"].tasks.filter((t) => t.status === "ready");
    expect(readyTasks).toHaveLength(1);
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionPromotedCount).toBe(0);

    // --- Test E: Spec 144 alone authorizes autonomous execution ----------
    expect(await controller.reevaluateSelectedProjectAutonomy()).toBe(true);
    expect(start).toHaveBeenCalledTimes(1);
    const executedTask = internals.state.projectBacklogCollections["project-a"].tasks
      .find((task) => task.id === acceptedTaskId)!;
    expect(executedTask.status).toBe("in_progress");
    expect(executedTask.executionRunId).toBe("project-a:run");

    // --- Test F: Spec 142/138 bridge received exact project/task context --
    const draftKeys = Object.keys(internals.state.externalProjectDevelopmentRequestDrafts);
    expect(draftKeys).toEqual([`project-a:backlog-task:${acceptedTaskId}`]);
    const draft = internals.state.externalProjectDevelopmentRequestDrafts[draftKeys[0]];
    expect(draft.projectId).toBe("project-a");
    expect(draft.sourceBacklogTaskId).toBe(acceptedTaskId);
    const prep = internals.state.externalProjectAdosRunPreparations[draftKeys[0]];
    expect(prep.projectId).toBe("project-a");
    const startArg = start.mock.calls[0][0] as StartExternalProjectAdosExecutionInput;
    expect(startArg.projectId).toBe("project-a");
    expect(JSON.stringify(startArg)).not.toContain("project-b");

    // --- Test X: completion state reflects the actual ADOS adapter outcome
    const executionResult = Object.values(internals.state.externalProjectAdosExecutionResults)[0];
    expect(executionResult?.status).toBe("Completed"); // from startedOutcome, not hardcoded
    expect(executionResult?.executionId).toBe("project-a:run");

    // --- Test L: duplicate execution event does not create a duplicate run
    await controller.reevaluateSelectedProjectAutonomy();
    expect(start).toHaveBeenCalledTimes(1);
    expect(Object.values(internals.state.externalProjectAdosExecutions)).toHaveLength(1);

    // --- Test M: active run blocks prohibited extra planning/Ready/exec ---
    internals.state.projectAutonomousSuggestionPolicies["project-a"] = {
      ...internals.state.projectAutonomousSuggestionPolicies["project-a"]!,
      lastEvaluation: undefined,
    };
    expect(await internals.evaluateSelectedProjectAutonomousSuggestionGeneration("during-active-run")).toBe(false);
    expect(internals.state.projectBacklogSuggestionCollections["project-a"].candidates).toHaveLength(1);
    expect(internals.state.projectAutonomousSuggestionPolicies["project-a"]?.lastEvaluation?.latestResultText)
      .toBe("Skipped: active execution exists");

    expect(controller.createBacklogTaskFromInput({
      title: "Extra high while active",
      description: "Must stay in backlog while an execution is active.",
      priority: HIGH,
    })).toBe(true);
    const extraTask = internals.state.projectBacklogCollections["project-a"].tasks
      .find((task) => task.title === "Extra high while active")!;
    expect(extraTask.status).toBe("backlog"); // Spec 146 skipped: active execution
    expect(internals.state.projectBacklogReadinessPromotionPolicies["project-a"].lastEvaluation?.latestResultText)
      .toBe("Skipped: active execution exists");

    await controller.reevaluateSelectedProjectAutonomy();
    expect(start).toHaveBeenCalledTimes(1); // Spec 144 concurrency limit holds
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyState: "blocked",
      autonomyReason: "ActiveRunExists",
    });

    // --- Test N: Project B is untouched by Project A automation -----------
    expect(internals.state.projectBacklogSuggestionCollections["project-b"]).toBeUndefined();
    expect(internals.state.projectBacklogCollections["project-b"]).toBeUndefined();
    for (const record of [
      internals.state.externalProjectDevelopmentRequestDrafts,
      internals.state.externalProjectAdosRunPreparations,
      internals.state.externalProjectAdosExecutions,
      internals.state.externalProjectAdosRunStatuses,
    ]) {
      expect(Object.values(record).some((entry) => (entry as { projectId: string }).projectId === "project-b"))
        .toBe(false);
    }
    openBacklog(controller, internals, "project-b");
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      projectId: "project-b",
      autonomousSuggestionEnabled: false,
      suggestionAutoAcceptEnabled: false,
      backlogReadinessPromotionEnabled: false,
      autonomyEnabled: false,
    });

    // --- Test Y: no fabricated percentage-progress field is introduced ----
    const probeKeys = Object.keys(controller.getProjectBacklogProbeState());
    expect(probeKeys.some((key) => /percent|progress/i.test(key))).toBe(false);

    // Identities recorded in runtime-evidence.json for this deterministic cycle.
    expect(suggestionId).toBe("project-a:suggestion:1");
    expect(acceptedTaskId).toBe("project-a:backlog:1");
    expect(draft.id).toBe("project-a:backlog-task:project-a:backlog:1:external-development-request-draft");
    expect(executedTask.executionRunId).toBe("project-a:run");
  });

  it("keeps the four automation controls independently disableable (Tests A, Z)", async () => {
    const storage = createMemoryStorage();
    const controller = createController(storage, providerWith([{ title: "x", description: "y", priority: HIGH }]));
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");

    internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 });
    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    internals.updateSelectedProjectBacklogReadinessPromotionPolicy({ enabled: true, allowedPriorities: [HIGH] });
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] });
    await flushPromises();
    expectPolicyFlags(controller, { accept: true, ready: true, execute: true, suggest: true });

    // Disable one at a time; the other three are unaffected.
    internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: false });
    expectPolicyFlags(controller, { accept: true, ready: true, execute: true, suggest: false });
    controller.updateSelectedProjectAutonomyPolicy({ enabled: false, allowedPriorities: [HIGH] });
    expectPolicyFlags(controller, { accept: true, ready: true, execute: false, suggest: false });
    internals.updateSelectedProjectBacklogReadinessPromotionPolicy({ enabled: false, allowedPriorities: [HIGH] });
    expectPolicyFlags(controller, { accept: true, ready: false, execute: false, suggest: false });
    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: false, allowedPriorities: [HIGH] });
    expectPolicyFlags(controller, { accept: false, ready: false, execute: false, suggest: false });

    // --- Test Z: manual workflows still work with automation off ---------
    expect(controller.createBacklogTaskFromInput({
      title: "Manual task",
      description: "Created by the operator by hand.",
      priority: "normal",
    })).toBe(true);
    const manualTask = internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(manualTask.status).toBe("backlog");
    expect(controller.updateSelectedBacklogTaskFromInput({
      title: manualTask.title,
      description: manualTask.description,
      priority: manualTask.priority,
      status: "ready",
    })).toBe(true);
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].status).toBe("ready");
    // Manual suggestion generation still available.
    await internals.generateProjectBacklogSuggestions();
    expect(internals.state.projectBacklogSuggestionCollections["project-a"].candidates.length).toBeGreaterThan(0);
  });

  it("attributes accept and promote to their own policy audit records when both are enabled", async () => {
    const storage = createMemoryStorage();
    const controller = createController(storage, providerWith([
      { title: "Cascade doc task", description: "Add a short docs note about the cascade.", priority: HIGH },
    ]));
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");

    // Auto Accept and Auto Ready both on; a suggestion then cascades 145 -> 146
    // in one synchronous controller call (Spec 146 FR-016 sanctioned trigger).
    internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    });
    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    await internals.generateProjectBacklogSuggestions();

    const task = internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(task.status).toBe("ready");
    // Each transition is recorded against its own policy's audit trail.
    expect(controller.getProjectBacklogProbeState().suggestionAutoAcceptAcceptedCount).toBe(1);
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionPromotedCount).toBe(1);
    // Spec 145 itself never set "ready": the task carries automatic acceptance
    // provenance and Spec 146 origin eligibility, and no execution started.
    expect(task.suggestionAcceptanceMode).toBe("automatic");
    expect(task.executionRunId).toBeUndefined();
  });

  it("does not import ADOS execution or the Spec 142 bridge from Specs 145-147 (Test G)", () => {
    const files = [
      "ProjectAutonomousSuggestionPolicyService.ts",
      "ProjectAutonomousSuggestionCoordinator.ts",
      "ProjectBacklogSuggestionAcceptancePolicyService.ts",
      "ProjectBacklogReadinessPromotionPolicyService.ts",
    ];
    for (const file of files) {
      const source = readFileSync(fileURLToPath(new URL(`./${file}`, import.meta.url)), "utf8");
      expect(source, `${file} must not reach ADOS/bridge/agent processes directly`).not.toMatch(
        /ExternalProjectAdosExecution|ProjectBacklogDevelopmentBridge|child_process|execFile|spawn\(|codex exec|claude -p/,
      );
    }
  });

  it("preserves policy and lifecycle state across reload without restarting completed stages (Test O)", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([{ title: "Reload doc task", description: "Add a docs note.", priority: HIGH }]);
    const first = createController(storage, provider);
    const firstInternals = getControllerInternals(first);
    firstInternals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(firstInternals);
    first.open();
    first.updateInput(createInput({}));
    openBacklog(first, firstInternals, "project-a");

    firstInternals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    first.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] });
    firstInternals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 });
    await flushPromises();
    firstInternals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept();
    firstInternals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    });
    await first.reevaluateSelectedProjectAutonomy();
    const originalTaskId = firstInternals.state.projectBacklogCollections["project-a"].tasks[0].id;
    expect(firstInternals.state.projectBacklogCollections["project-a"].tasks[0].status).toBe("in_progress");

    // Reload: brand new controller over the same persisted storage.
    const reloaded = createController(storage, provider);
    const reloadedInternals = getControllerInternals(reloaded);
    const reloadedStart = vi.fn(startedOutcome);
    reloadedInternals.externalProjectAdosExecutionService.start = reloadedStart;
    seedTwoProjects(reloadedInternals);
    reloaded.open();
    reloaded.updateInput(createInput({}));
    openBacklog(reloaded, reloadedInternals, "project-a");

    expect(reloaded.getProjectBacklogProbeState()).toMatchObject({
      autonomousSuggestionEnabled: true,
      suggestionAutoAcceptEnabled: true,
      backlogReadinessPromotionEnabled: true,
      autonomyEnabled: true,
    });
    const reloadedTask = reloadedInternals.state.projectBacklogCollections["project-a"].tasks
      .find((task) => task.id === originalTaskId)!;
    expect(reloadedTask.status).toBe("in_progress");
    expect(reloadedTask.executionRunId).toBe("project-a:run");

    await reloaded.reevaluateSelectedProjectAutonomy();
    expect(reloadedStart).not.toHaveBeenCalled(); // completed stage not restarted
    expect(Object.values(reloadedInternals.state.externalProjectAdosExecutions)).toHaveLength(1);

    // Project B stays disabled after reload (no consent granted on remount).
    openBacklog(reloaded, reloadedInternals, "project-b");
    expect(reloaded.getProjectBacklogProbeState().autonomousSuggestionEnabled).toBe(false);
  });
});

// --- helpers ----------------------------------------------------------------

function expectPolicyFlags(
  controller: OfficeProjectPortalController,
  expected: { accept: boolean; ready: boolean; execute: boolean; suggest: boolean },
) {
  const probe = controller.getProjectBacklogProbeState();
  expect({
    accept: probe.suggestionAutoAcceptEnabled,
    ready: probe.backlogReadinessPromotionEnabled,
    execute: probe.autonomyEnabled,
    suggest: probe.autonomousSuggestionEnabled,
  }).toEqual(expected);
}

function createController(storage: BrowserOfficeSessionStorage, provider: ProjectBacklogSuggestionProvider) {
  return new OfficeProjectPortalController(createSceneStub(), {
    browserOfficeSessionService: new BrowserOfficeSessionService({ storage, now: () => "2026-09-03T00:00:00.000Z" }),
    projectBacklogSuggestionProvider: provider,
  });
}

function providerWith(candidates: ProjectBacklogSuggestionProviderCandidate[]): ProjectBacklogSuggestionProvider {
  return { generateSuggestions: vi.fn(() => candidates) };
}

function openBacklog(
  controller: OfficeProjectPortalController,
  internals: ReturnType<typeof getControllerInternals>,
  projectId: string,
) {
  internals.state.selectedBacklogProjectId = projectId;
  internals.state.viewMode = "project-backlog";
  (controller as unknown as { openProjectBacklog: (id: string) => void }).openProjectBacklog(projectId);
  controller.updateInput(createInput({}));
}

function seedTwoProjects(internals: ReturnType<typeof getControllerInternals>) {
  internals.state.projectRegistryEntries = [projectEntry("project-a"), projectEntry("project-b")];
  internals.state.projects = internals.state.projectRegistryEntries.map((entry) => ({
    id: entry.id,
    name: entry.displayName,
    status: "Active",
    type: "Company",
    enabled: true,
    description: entry.shortDescription,
    linkedServices: [],
    nextAction: { label: "Open", enabled: true, placeholder: true },
    ownerCompany: entry.owner.companyName,
    localRepositoryLabel: entry.localRepository.label,
    localRepositoryBinding: entry.localRepositoryBinding,
    repositoryIdentity: entry.repositoryIdentity,
  }));
  internals.state.projectCompanyBindings = internals.state.projectRegistryEntries.map((entry) => ({
    bindingId: entry.id,
    buildingId: entry.id,
    projectId: entry.id,
    companyName: entry.owner.companyName,
    status: "bound" as const,
  }));
}

function projectEntry(id: string): ProjectRegistryEntry {
  return {
    id,
    displayName: id === "project-a" ? "Project A" : "Project B",
    shortDescription: `${id} project`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: { connected: true, label: "Bound (local)" },
    localRepositoryBinding: {
      projectId: id,
      repositoryPath: `C:/repos/${id}`,
      worktreePath: `C:/worktrees/${id}`,
    },
    repositoryIdentity: { provider: "local", connectionState: "Configured", localPath: `C:/worktrees/${id}` },
    owner: { companyName: `${id} company` },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

async function startedOutcome(
  input: StartExternalProjectAdosExecutionInput,
): Promise<StartExternalProjectAdosExecutionOutcome> {
  return {
    execution: execution(input.projectId, input.preparation!),
    result: {
      id: `${input.projectId}:result`,
      projectId: input.projectId,
      preparationId: input.preparation!.id,
      executionId: `${input.projectId}:run`,
      status: "Completed",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      started: true,
      duplicateExistingExecution: false,
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      resultAt: "2026-09-03T00:05:00.000Z",
      rulesVersion: "external-ados-execution-v1",
    },
  };
}

function execution(projectId: string, prep: ExternalProjectAdosRunPreparation): ExternalProjectAdosExecution {
  return {
    id: `${projectId}:run`,
    projectId,
    preparationId: prep.id,
    developmentRequestDraftId: prep.developmentRequestDraftId,
    status: "Completed",
    featureId: prep.featureId,
    featureBranch: prep.featureBranch,
    authoritativeBaseSha: prep.authoritativeBaseSha,
    specPath: prep.specPath,
    requirementsFilePath: prep.requirementsFilePath,
    repositoryPath: `C:/repos/${projectId}`,
    worktreePath: `C:/worktrees/${projectId}`,
    validationCommands: [...prep.validationCommands],
    reviewerCommand: prep.reviewerCommand,
    executionPolicyVersion: prep.executionPolicyVersion,
    trustedLocalExecutionApproved: true,
    startedBy: "Local Human",
    startedAt: "2026-09-03T00:04:00.000Z",
    implementerStarted: true,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    evidence: {
      providerId: "stub",
      agentId: "Stub",
      role: "Implementer",
      commandDisplay: "claude -p",
      workingDirectory: `C:/worktrees/${projectId}`,
      started: true,
      completed: false,
      timedOut: false,
      cancelled: false,
      durationMs: 1,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "external-ados-execution-v1",
  };
}

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
