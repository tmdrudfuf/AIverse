import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { resolveEffectiveRoles } from "../../../../../../tools/agent-workflow/roleResolver.js";
import { CONVERGENCE_STATUSES, computeConvergenceStatus } from "../../../../../../tools/agent-workflow/reviewConvergence.js";
import { BrowserOfficeSessionService } from "../browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "../browser-session/BrowserOfficeSessionTypes";
import { OfficeProjectPortalController } from "../OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  flushPromises,
  getControllerInternals,
} from "../OfficeProjectPortalController.testHelpers";
import { ExternalProjectAdosExecutionService } from "../external-ados-execution/ExternalProjectAdosExecutionService";
import { deriveExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusService";
import type {
  StartExternalProjectAdosExecutionInput,
  StartExternalProjectAdosExecutionOutcome,
} from "../external-ados-execution/ExternalProjectAdosExecutionService";
import type {
  ImplementerRuntimeProvider,
  ImplementerRuntimeProviderCommand,
  ImplementerRuntimeProviderResult,
} from "../implementer-runtime/ImplementerRuntimeProvider";
import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import { createDefaultProjectRegistryEntries } from "../project-registry/ProjectRegistrySeedData";
import { ProjectRegistryService } from "../project-registry/ProjectRegistryService";
import { toProjectPortalProject } from "../project-registry/ProjectRegistryAdapters";
import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import { CITY_BUILDINGS } from "../../config/cityBuildingConfig";
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
//     -> Spec 142 / Spec 138 development bridge -> ADOS execution
//     -> independent reviewer resolved for the run from its own durable
//        implementer id (roleResolver.js: Claude -> distinct Codex)
//     -> real ADOS run-level completion reflected by the office
//     -> terminal `completed` via the existing operator transition.
//
// Per authoritative requirement 23 the process boundaries use existing
// injectable adapters: the Spec 143 suggestion provider is a deterministic
// fixture and the ADOS process spawn uses the injectable ImplementerRuntimeProvider
// (as the Spec 144 suite does).
//
// The office ExternalProjectAdosExecution schema types its review/validation/
// publish sub-stage flags as the literal `false`, so the in-office chain cannot
// carry those sub-stages on its own records. This test covers the office-
// observable stages: reviewer resolution from the run's own durable implementer
// id (roleResolver.js) and a terminal `completed` transition that follows the
// real ADOS run-level completion signal (execution.evidence.completed) via the
// operator's existing manual transition - with the in-office records asserted to
// carry no review/publish advancement, so no publication leg is skipped. The
// candidate == validated == reviewed == exact HEAD + Approved-review publication
// gate is the same cycle's final leg; it is enforced over this run's own durable
// ADOS records by spec148RoleAssignmentEvidence.test.ts, unconditionally and in
// both directions. No src/ production source is changed by Spec 148.

const HIGH = "high" as const;

// Real canonical registered projects (ProjectRegistrySeedData): "daily-proof"
// is the canonical Active company workspace, "ai-lab" is a second canonical
// registered project used only for isolation assertions. The E2E cycle runs
// against Project A's real local repository/worktree binding - the actual
// repository this test executes in - not an invented path.
const PROJECT_A = "daily-proof";
const PROJECT_B = "ai-lab";
const PROJECT_A_NAME = "Daily Proof";
const REPO_ROOT = process.cwd().replace(/\\/g, "/");

// The tracked evidence file is the claim under test, not a source of truth:
// every number/string pulled from it below is cross-checked against the live
// harness value in the same assertion, so a hand-edited or stale evidence
// file fails this suite instead of silently drifting from reality.
const specDir = new URL("../../../../../../specs/148-autonomous-company-operations-end-to-end/", import.meta.url);
const evidence = JSON.parse(readFileSync(fileURLToPath(new URL("runtime-evidence.json", specDir)), "utf8")) as {
  projectA: {
    suggestionId: string;
    acceptedTaskId: string;
    developmentRequestId: string;
    executionRunId: string;
    boundedSuggestionCount: number;
    cascade: { spec145AcceptedCount: number; spec146PromotedCount: number };
    readyTransition: { promotedCount: number };
    executionDurableRecord: { processSpawnInvocations: number; spawnInvocationsAfterDuplicateExecutionEvent: number };
  };
  idempotency: {
    duplicatePlanningEventSuggestions: number;
    duplicateAcceptanceBacklogTasks: number;
    duplicateReadinessEvaluationTransitions: number;
    duplicateExecutionEventRuns: number;
  };
  activeRunGating: {
    spec147ExtraSuggestionsWhileActive: number;
    spec147SkipReason: string;
    spec146SkipReason: string;
    spec144ConcurrentExecutionsStarted: number;
    spec144SecondStartBlockedReason: string;
  };
};

describe("Spec 148 autonomous company operations end-to-end", () => {
  it("composes one controlled cycle in order with each transition exactly once (Tests A-F, H-N, Y)", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([
      { title: "A11y audit doc", description: "Add a short accessibility checklist to docs/.", priority: HIGH },
      { title: "Bounded-out extra", description: "This second candidate must be bounded out.", priority: HIGH },
    ]);
    const { provider: implementerProvider, invoke } = launchedImplementerProvider();
    const controller = createController(storage, provider);
    const internals = getControllerInternals(controller);
    // Drive the *real* ExternalProjectAdosExecutionService; only the OS process
    // spawn (ImplementerRuntimeProvider.invoke) is a deterministic fake, which
    // the authoritative requirement 23 permits for the ADOS process boundary.
    // The real service still runs preparation validation, the trusted-policy
    // check, the safe-command check, structured requirements assembly, and
    // durable execution / result / run-status record creation observable by the
    // office.
    internals.externalProjectAdosExecutionService =
      new ExternalProjectAdosExecutionService(implementerProvider);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, PROJECT_A);

    // --- Test A: the four automation controls toggle independently, and all
    //     four are then independently enabled for project A before the cycle --
    expect(internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] }))
      .toBe(true);
    expectPolicyFlags(controller, { accept: true, ready: false, execute: false, suggest: false });

    expect(controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] })).toBe(true);
    await flushPromises();
    expectPolicyFlags(controller, { accept: true, ready: false, execute: true, suggest: false });

    // Auto Ready is deliberately left off here: enabling it now would let
    // acceptance below cascade straight to Ready in the same call, masking
    // the intermediate `backlog` state Test C must observe. It is enabled a
    // few steps down as its own distinct, independently-triggered event
    // (Test D) - the same-call cascade is proven separately below.
    expect(internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 }))
      .toBe(true);
    await flushPromises();
    expectPolicyFlags(controller, { accept: true, ready: false, execute: true, suggest: true });

    // --- Test B: Spec 147 generated a bounded, project-scoped suggestion ---
    const suggestionsA = internals.state.projectBacklogSuggestionCollections[PROJECT_A]?.candidates ?? [];
    expect(suggestionsA).toHaveLength(evidence.projectA.boundedSuggestionCount); // bounded to maxSuggestionsPerEvaluation
    expect(suggestionsA[0]).toMatchObject({ projectId: PROJECT_A, status: "proposed" });
    const suggestionId = suggestionsA[0].id;
    // Spec 147 must not create a backlog task directly, and generation does not
    // auto-accept even though Auto Accept is enabled: it only proposes.
    expect(internals.state.projectBacklogCollections[PROJECT_A]?.tasks ?? []).toEqual([]);
    // Project B received nothing.
    expect(internals.state.projectBacklogSuggestionCollections[PROJECT_B]).toBeUndefined();

    // --- Test I: duplicate planning event does not duplicate the suggestion
    expect(await internals.evaluateSelectedProjectAutonomousSuggestionGeneration("replay-planning-event")).toBe(false);
    expect(internals.state.projectBacklogSuggestionCollections[PROJECT_A].candidates)
      .toHaveLength(evidence.idempotency.duplicatePlanningEventSuggestions);

    // --- Test C: with Auto Ready still off, Spec 145 acceptance alone lands
    //     the task in `backlog` - never `ready` --------------------------
    expect(internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()).toBe(true);
    const probeAfterAccept = controller.getProjectBacklogProbeState();
    // Spec 145 performed exactly one acceptance...
    expect(probeAfterAccept.suggestionAutoAcceptAcceptedCount).toBe(evidence.projectA.cascade.spec145AcceptedCount);
    // ...and Spec 146's own policy has not evaluated yet (still disabled): no
    // promotion happened as a side effect of acceptance.
    expect(probeAfterAccept.backlogReadinessPromotionPromotedCount).toBe(0);
    const acceptedTasks = internals.state.projectBacklogCollections[PROJECT_A].tasks;
    expect(acceptedTasks).toHaveLength(evidence.projectA.cascade.spec145AcceptedCount);
    const acceptedTask = acceptedTasks[0];
    expect(acceptedTask).toMatchObject({
      projectId: PROJECT_A,
      status: "backlog",
      suggestionAcceptanceMode: "automatic",
      sourceSuggestionId: suggestionId,
    });
    const acceptedTaskId = acceptedTask.id;
    expect(acceptedTask.executionRunId).toBeUndefined();

    // --- Test J: duplicate acceptance evaluation does not duplicate the task
    internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept();
    const tasksAfterDuplicateAccept = internals.state.projectBacklogCollections[PROJECT_A].tasks;
    expect(tasksAfterDuplicateAccept).toHaveLength(evidence.idempotency.duplicateAcceptanceBacklogTasks);
    expect(tasksAfterDuplicateAccept[0].status).toBe("backlog");

    // --- Test D: enabling Spec 146's own policy is a distinct, independently
    //     triggered event that promotes the already-accepted task to Ready
    //     exactly once - Spec 145 never set it, and Auto Execute being on
    //     already still does not start development directly ---------------
    expect(internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    })).toBe(true);
    expectPolicyFlags(controller, { accept: true, ready: true, execute: true, suggest: true });
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionPromotedCount)
      .toBe(evidence.projectA.cascade.spec146PromotedCount);
    const readyAfterCascade = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .filter((task) => task.status === "ready");
    expect(readyAfterCascade).toHaveLength(evidence.projectA.readyTransition.promotedCount);
    expect(readyAfterCascade[0].id).toBe(acceptedTaskId);
    // Spec 146 must not start development directly, even with Auto Execute on.
    expect(invoke).not.toHaveBeenCalled();

    // --- Test K: duplicate readiness evaluation does not duplicate --------
    expect(internals.evaluateSelectedProjectBacklogReadinessPromotion()).toBe(false);
    const readyTasks = internals.state.projectBacklogCollections[PROJECT_A].tasks.filter((t) => t.status === "ready");
    expect(readyTasks).toHaveLength(evidence.idempotency.duplicateReadinessEvaluationTransitions);
    expect(controller.getProjectBacklogProbeState().backlogReadinessPromotionPromotedCount).toBe(0);

    // --- Test E: Spec 144 alone authorizes autonomous execution ----------
    expect(await controller.reevaluateSelectedProjectAutonomy()).toBe(true);
    expect(invoke).toHaveBeenCalledTimes(evidence.projectA.executionDurableRecord.processSpawnInvocations);
    const executedTask = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === acceptedTaskId)!;
    expect(executedTask.status).toBe("in_progress");
    expect(executedTask.executionRunId).toBeTruthy();

    // --- Test F: Spec 142/138 bridge + ADOS process boundary received the
    //     exact canonical project/task context, with no shell interpolation --
    const draftKeys = Object.keys(internals.state.externalProjectDevelopmentRequestDrafts);
    expect(draftKeys).toEqual([`${PROJECT_A}:backlog-task:${acceptedTaskId}`]);
    const draft = internals.state.externalProjectDevelopmentRequestDrafts[draftKeys[0]];
    expect(draft.projectId).toBe(PROJECT_A);
    expect(draft.sourceBacklogTaskId).toBe(acceptedTaskId);
    const prep = internals.state.externalProjectAdosRunPreparations[draftKeys[0]];
    expect(prep.projectId).toBe(PROJECT_A);
    const command = invoke.mock.calls[0][0];
    expect(command.workingDirectory).toBe(REPO_ROOT);
    expect(command.prompt).toContain(PROJECT_A_NAME);
    // Structured requirements travel as a file payload, not as argv text.
    expect(command.arguments.join(" ")).not.toContain(acceptedTask.title);
    expect(command.files?.some((file) => file.content.length > 0)).toBe(true);
    expect(JSON.stringify(command)).not.toContain(PROJECT_B);

    // --- The durable execution/result/run-status records the office observes
    //     come from the real ADOS service, not hardcoded values. This asserts
    //     the *launch* record shape only. `status: "Completed"` here is
    //     ImplementerRuntimeStatus and means merely "the implementer subprocess
    //     exited" - the ADOS run itself is still in flight
    //     (evidence.completed === false). Run-level completion fidelity is
    //     Test X, proven in its own test below. ------------------------------
    const executionResult = Object.values(internals.state.externalProjectAdosExecutionResults)[0];
    expect(executionResult?.status).toBe("Completed"); // subprocess exited; from the real service
    expect(executionResult?.projectId).toBe(PROJECT_A);
    const executionRecord = Object.values(internals.state.externalProjectAdosExecutions)[0];
    expect(executionRecord?.projectId).toBe(PROJECT_A);
    expect(executionRecord?.implementerStarted).toBe(true);
    const runStatusKey = Object.keys(internals.state.externalProjectAdosRunStatuses)[0];
    const runStatus = internals.state.externalProjectAdosRunStatuses[runStatusKey] as { projectId: string };
    expect(runStatus.projectId).toBe(PROJECT_A);

    // The in-office ADOS execution/run-status records carry no
    // review/validation/publish advancement of their own: the Spec 130 schema
    // types those sub-stage flags as the literal `false`
    // (ExternalProjectAdosExecutionTypes.ts:41-47,
    // ExternalProjectAdosRunStatusTypes.ts:29-35), unchanged by Spec 148. The
    // review / validation / exact-HEAD / publication enforcement leg therefore
    // cannot be represented on these in-office records; it is exercised over
    // this run's durable ADOS records by spec148RoleAssignmentEvidence.test.ts
    // (authoritative section 23, acceptance criteria 19-20). Below, the same
    // chain still resolves its independent reviewer from the run's own durable
    // implementer id.
    expect(executionResult?.reviewStarted).toBe(false);
    expect(executionResult?.publishStarted).toBe(false);
    expect(executionRecord?.reviewStarted).toBe(false);
    expect(executionRecord?.githubMutationStarted).toBe(false);

    // --- Test H (continued): past ADOS execution the same Project A chain
    //     resolves its independent reviewer from the run's own durable
    //     implementer id -----------------------------------------------------
    // Review stage: this run's implementer is Claude per the durable execution
    // evidence, so its independent reviewer must be a distinct agent - Codex.
    // Claude never reviews its own work. Roles are resolved from THIS run's own
    // implementer id, not a literal.
    expect(executionRecord?.evidence.providerId).toBe("claude");
    const chainRoles = resolveEffectiveRoles({
      state: {},
      requestedImplementerId: executionRecord!.evidence.providerId,
    });
    expect(chainRoles.ok).toBe(true);
    // toEqual on the whole object already proves reviewer != implementer.
    expect(chainRoles.roles).toEqual({ implementer: "claude", reviewer: "codex" });
    // This scenario deliberately holds the ADOS run in flight
    // (evidence.completed === false) so Test M below can prove active-run
    // safety. While the run is in flight there is no review attempt, so the
    // convergence helper reports NOT_STARTED, nothing auto-approves, and the
    // Project A task does not advance past in_progress. The full durable-record
    // convergence biconditional is spec148RoleAssignmentEvidence.test.ts's job.
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: false })).toBe(CONVERGENCE_STATUSES.NOT_STARTED);
    const chainTaskAfterExecution = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === acceptedTaskId)!;
    expect(chainTaskAfterExecution.status).toBe("in_progress");
    expect(executionResult?.publishStarted).toBe(false);

    // --- Test L: duplicate execution event does not create a duplicate run
    await controller.reevaluateSelectedProjectAutonomy();
    expect(invoke).toHaveBeenCalledTimes(evidence.projectA.executionDurableRecord.spawnInvocationsAfterDuplicateExecutionEvent);
    expect(Object.values(internals.state.externalProjectAdosExecutions))
      .toHaveLength(evidence.idempotency.duplicateExecutionEventRuns);

    // --- Test M: active run blocks prohibited extra planning/Ready/exec ---
    internals.state.projectAutonomousSuggestionPolicies[PROJECT_A] = {
      ...internals.state.projectAutonomousSuggestionPolicies[PROJECT_A]!,
      lastEvaluation: undefined,
    };
    expect(await internals.evaluateSelectedProjectAutonomousSuggestionGeneration("during-active-run")).toBe(false);
    expect(internals.state.projectBacklogSuggestionCollections[PROJECT_A].candidates)
      .toHaveLength(evidence.projectA.boundedSuggestionCount + evidence.activeRunGating.spec147ExtraSuggestionsWhileActive);
    expect(internals.state.projectAutonomousSuggestionPolicies[PROJECT_A]?.lastEvaluation?.latestResultText)
      .toBe(evidence.activeRunGating.spec147SkipReason);

    expect(controller.createBacklogTaskFromInput({
      title: "Extra high while active",
      description: "Must stay in backlog while an execution is active.",
      priority: HIGH,
    })).toBe(true);
    const extraTask = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.title === "Extra high while active")!;
    expect(extraTask.status).toBe("backlog"); // Spec 146 skipped: active execution
    expect(internals.state.projectBacklogReadinessPromotionPolicies[PROJECT_A].lastEvaluation?.latestResultText)
      .toBe(evidence.activeRunGating.spec146SkipReason);

    await controller.reevaluateSelectedProjectAutonomy();
    expect(invoke).toHaveBeenCalledTimes(evidence.activeRunGating.spec144ConcurrentExecutionsStarted); // Spec 144 concurrency limit holds
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyState: "blocked",
      autonomyReason: evidence.activeRunGating.spec144SecondStartBlockedReason,
    });

    // --- Test N: Project B is untouched by Project A automation -----------
    expect(internals.state.projectBacklogSuggestionCollections[PROJECT_B]).toBeUndefined();
    expect(internals.state.projectBacklogCollections[PROJECT_B]).toBeUndefined();
    for (const record of [
      internals.state.externalProjectDevelopmentRequestDrafts,
      internals.state.externalProjectAdosRunPreparations,
      internals.state.externalProjectAdosExecutions,
      internals.state.externalProjectAdosRunStatuses,
    ]) {
      expect(Object.values(record).some((entry) => (entry as { projectId: string }).projectId === PROJECT_B))
        .toBe(false);
    }
    openBacklog(controller, internals, PROJECT_B);
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      projectId: PROJECT_B,
      autonomousSuggestionEnabled: false,
      suggestionAutoAcceptEnabled: false,
      backlogReadinessPromotionEnabled: false,
      autonomyEnabled: false,
    });

    // --- Test Y: no fabricated percentage-progress field is introduced ----
    const probeKeys = Object.keys(controller.getProjectBacklogProbeState());
    expect(probeKeys.some((key) => /percent|progress/i.test(key))).toBe(false);

    // Cross-check the live harness identities against the tracked evidence
    // file, rather than duplicating literals: a stale or hand-edited evidence
    // file fails this test.
    expect(suggestionId).toBe(evidence.projectA.suggestionId);
    expect(acceptedTaskId).toBe(evidence.projectA.acceptedTaskId);
    expect(draft.id).toBe(evidence.projectA.developmentRequestId);
    expect(executedTask.executionRunId).toBe(evidence.projectA.executionRunId);
    expect(executionRecord?.id).toBe(evidence.projectA.executionRunId);
  });

  it("completes one controlled Project A cycle end to end: ADOS execution -> independent Codex reviewer resolved from the run's own durable implementer id -> real ADOS run-level completion reflected by the office -> terminal completion via the existing operator transition (Tests H, X)", async () => {
    // ImplementerRuntimeStatus "Completed" means only that the implementer
    // subprocess exited. Production keys *run-level* completion off
    // execution.evidence.completed - every automation policy's
    // countActiveExecutions (Spec 144 ProjectAutonomousExecutionPolicyService,
    // Spec 146 ProjectBacklogReadinessPromotionPolicyService, Spec 147
    // ProjectAutonomousSuggestionPolicyService) and
    // OfficeProjectPortalController.isActiveExternalProjectAdosExecution all
    // gate on `!evidence.completed`. Drive the real ExternalProjectAdosExecutionService
    // twice, differing only in that signal, and assert the office-observable
    // state tracks the actual ADOS run state, not the bare subprocess exit.
    for (const runCompleted of [false, true]) {
      const storage = createMemoryStorage();
      const controller = createController(
        storage,
        providerWith([{ title: "Doc task", description: "Add a short docs note.", priority: HIGH }]),
      );
      const internals = getControllerInternals(controller);
      const invoke = vi.fn(
        async (command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> => ({
          status: "Completed",
          evidence: {
            providerId: "claude",
            agentId: "Claude",
            role: "Implementer",
            commandDisplay: [command.command, ...command.arguments].join(" "),
            workingDirectory: command.workingDirectory,
            started: true,
            completed: runCompleted,
            timedOut: false,
            cancelled: false,
            durationMs: 5,
            stdoutSummary: "",
            stderrSummary: "",
            outputTruncated: false,
          },
        }),
      );
      internals.externalProjectAdosExecutionService = new ExternalProjectAdosExecutionService(
        { providerId: "claude", invoke } as ImplementerRuntimeProvider,
      );
      seedTwoProjects(internals);
      controller.open();
      controller.updateInput(createInput({}));
      openBacklog(controller, internals, PROJECT_A);

      internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
      controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] });
      internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 });
      await flushPromises();
      internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept();
      internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
        enabled: true,
        allowedPriorities: [HIGH],
        maxPromotionsPerEvaluation: 1,
      });
      expect(await controller.reevaluateSelectedProjectAutonomy()).toBe(true);

      const task = internals.state.projectBacklogCollections[PROJECT_A].tasks[0];
      // The autonomous chain always hands off at `in_progress`; there is no
      // autonomous `in_progress -> completed` path and Spec 148 adds none.
      expect(task.status).toBe("in_progress");

      const execution = Object.values(internals.state.externalProjectAdosExecutions)[0]!;
      expect(execution.evidence.completed).toBe(runCompleted); // adapter signal propagates faithfully

      // Office-observable, production-consumed: the Spec 144 policy's
      // active-execution count (surfaced on the probe, via
      // ProjectAutonomousExecutionPolicyService.countActiveExecutions keyed on
      // `!evidence.completed`) tracks the ACTUAL ADOS run state - a still-running
      // run counts as active; a completed one does not.
      expect(controller.getProjectBacklogProbeState().autonomyActiveExecutionCount).toBe(runCompleted ? 0 : 1);

      // Derivation-layer unit check: deriveExternalProjectAdosRunStatus's
      // execution-sourced branch (toExecutionStage) maps the same signal to
      // stage Started vs Completed.
      const runStatus = deriveExternalProjectAdosRunStatus({ projectId: PROJECT_A, execution })!;
      expect(runStatus.stage).toBe(runCompleted ? "Completed" : "Started");

      internals.state.selectedBacklogTaskId = task.id;
      if (!runCompleted) {
        // Run in flight: a second autonomy pass is blocked as an active run,
        // and nothing anywhere reads as complete.
        await controller.reevaluateSelectedProjectAutonomy();
        expect(controller.getProjectBacklogProbeState().autonomyReason).toBe("ActiveRunExists");
        expect(internals.state.projectBacklogCollections[PROJECT_A].tasks[0].status).toBe("in_progress");
      } else {
        // ADOS reports run-level completion (execution.evidence.completed, the
        // signal every automation policy's countActiveExecutions keys on) and
        // the office-observable active count has already dropped to 0 above.
        //
        // (a) Independent reviewer, resolved from THIS run's own durable
        //     implementer id (Claude) through the real roleResolver.js: a
        //     distinct agent, Codex. No self-review fallback. This is derived
        //     from real run state, not a literal.
        expect(execution.evidence.providerId).toBe("claude");
        const roles = resolveEffectiveRoles({ state: {}, requestedImplementerId: execution.evidence.providerId });
        expect(roles.ok).toBe(true);
        expect(roles.roles).toEqual({ implementer: "claude", reviewer: "codex" });

        // (b) The office reflects real ADOS run-level completion (asserted
        //     above: evidence.completed true, Spec 144 active count 0,
        //     deriveExternalProjectAdosRunStatus stage "Completed"). The
        //     in-office records carry no review or publish advancement of their
        //     own - the schema types those flags as the literal `false` - so
        //     this chain has no publication leg for the completion below to skip
        //     over. The candidate == validated == reviewed == exact HEAD +
        //     Approved-review gate runs over the run's durable ADOS records in
        //     spec148RoleAssignmentEvidence.test.ts.
        expect(execution.reviewStarted).toBe(false);
        expect(execution.publishStarted).toBe(false);
        expect(execution.githubMutationStarted).toBe(false);
        // No autonomous in_progress -> completed path exists in production and
        // Spec 148 adds none: the operator closes the task by hand, the same
        // human publication boundary Specs 142-147 declare.
        expect(internals.state.projectBacklogCollections[PROJECT_A].tasks[0].status).toBe("in_progress");
        expect(controller.updateSelectedBacklogTaskFromInput({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: "completed",
        })).toBe(true);
        expect(internals.state.projectBacklogCollections[PROJECT_A].tasks[0].status).toBe("completed");
      }
    }
  });

  it("keeps the four automation controls independently disableable (Tests A, Z)", async () => {
    const storage = createMemoryStorage();
    const controller = createController(storage, providerWith([
      { title: "x", description: "y", priority: HIGH },
      { title: "z", description: "w", priority: HIGH },
    ]));
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, PROJECT_A);

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
    const manualTask = internals.state.projectBacklogCollections[PROJECT_A].tasks[0];
    expect(manualTask.status).toBe("backlog");
    expect(controller.updateSelectedBacklogTaskFromInput({
      title: manualTask.title,
      description: manualTask.description,
      priority: manualTask.priority,
      status: "ready",
    })).toBe(true);
    expect(internals.state.projectBacklogCollections[PROJECT_A].tasks[0].status).toBe("ready");

    // Manual suggestion generation still available, and the operator reviews
    // each one by hand (Auto Accept is off, so no policy touches them):
    // rejecting one and accepting the other are both "manual suggestion
    // review" - review is not accept-only.
    await internals.generateProjectBacklogSuggestions();
    const generatedCandidates = internals.state.projectBacklogSuggestionCollections[PROJECT_A].candidates
      .filter((candidate) => candidate.status === "proposed");
    expect(generatedCandidates.length).toBeGreaterThanOrEqual(2);
    internals.state.selectedBacklogSuggestionId = generatedCandidates[0].id;
    expect(controller.rejectSelectedBacklogSuggestion()).toBe(true);
    expect(
      internals.state.projectBacklogSuggestionCollections[PROJECT_A].candidates
        .find((candidate) => candidate.id === generatedCandidates[0].id)!.status,
    ).toBe("rejected");

    internals.state.selectedBacklogSuggestionId = generatedCandidates[1].id;
    expect(controller.acceptSelectedBacklogSuggestion()).toBe(true);
    const manuallyAcceptedTask = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === internals.state.selectedBacklogTaskId)!;
    expect(manuallyAcceptedTask.status).toBe("backlog"); // manual acceptance, Auto Ready off
    expect(manuallyAcceptedTask.suggestionAcceptanceMode).toBe("manual");

    // Manual backlog -> Ready, then manual Start Development (Auto Execute off).
    expect(controller.updateSelectedBacklogTaskFromInput({
      title: manuallyAcceptedTask.title,
      description: manuallyAcceptedTask.description,
      priority: manuallyAcceptedTask.priority,
      status: "ready",
    })).toBe(true);
    const started = await controller.startSelectedBacklogTaskDevelopment();
    expect(started).toBe(true);
    const developedTask = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === manuallyAcceptedTask.id)!;
    expect(developedTask.status).toBe("in_progress");
    expect(developedTask.executionRunId).toBeTruthy();
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
    openBacklog(controller, internals, PROJECT_A);

    // Auto Accept and Auto Ready both on; a suggestion then cascades 145 -> 146
    // in one synchronous controller call (Spec 146 FR-016 sanctioned trigger).
    internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    });
    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    await internals.generateProjectBacklogSuggestions();

    const task = internals.state.projectBacklogCollections[PROJECT_A].tasks[0];
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
    openBacklog(first, firstInternals, PROJECT_A);

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
    const originalTaskId = firstInternals.state.projectBacklogCollections[PROJECT_A].tasks[0].id;
    expect(firstInternals.state.projectBacklogCollections[PROJECT_A].tasks[0].status).toBe("in_progress");

    // Reload: brand new controller over the same persisted storage.
    const reloaded = createController(storage, provider);
    const reloadedInternals = getControllerInternals(reloaded);
    const reloadedStart = vi.fn(startedOutcome);
    reloadedInternals.externalProjectAdosExecutionService.start = reloadedStart;
    seedTwoProjects(reloadedInternals);
    reloaded.open();
    reloaded.updateInput(createInput({}));
    openBacklog(reloaded, reloadedInternals, PROJECT_A);

    expect(reloaded.getProjectBacklogProbeState()).toMatchObject({
      autonomousSuggestionEnabled: true,
      suggestionAutoAcceptEnabled: true,
      backlogReadinessPromotionEnabled: true,
      autonomyEnabled: true,
    });
    const reloadedTask = reloadedInternals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === originalTaskId)!;
    expect(reloadedTask.status).toBe("in_progress");
    expect(reloadedTask.executionRunId).toBe(`${PROJECT_A}:run`);

    await reloaded.reevaluateSelectedProjectAutonomy();
    expect(reloadedStart).not.toHaveBeenCalled(); // completed stage not restarted
    expect(Object.values(reloadedInternals.state.externalProjectAdosExecutions)).toHaveLength(1);

    // Project B stays disabled after reload (no consent granted on remount).
    openBacklog(reloaded, reloadedInternals, PROJECT_B);
    expect(reloaded.getProjectBacklogProbeState().autonomousSuggestionEnabled).toBe(false);
  });

  // --- Failure visibility (authoritative requirement 18) -------------------
  // Each stage failure must preserve the authoritative prior state, expose a
  // concise block reason, and not silently advance / auto-approve / fabricate
  // completion.

  it("halts at Spec 147 with a block reason when the suggestion provider is unavailable", async () => {
    const storage = createMemoryStorage();
    const controller = createController(storage, {
      generateSuggestions: vi.fn(() => {
        throw new Error("suggestion provider offline");
      }),
    });
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, PROJECT_A);

    expect(internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 }))
      .toBe(true);
    await flushPromises();

    // No suggestion produced and no backlog task created: prior state preserved.
    expect(internals.state.projectBacklogSuggestionCollections[PROJECT_A]?.candidates ?? []).toEqual([]);
    expect(internals.state.projectBacklogCollections[PROJECT_A]?.tasks ?? []).toEqual([]);
    // Concise block reason exposed; the policy is not silently flipped off.
    const policy = internals.state.projectAutonomousSuggestionPolicies[PROJECT_A]!;
    expect(policy.enabled).toBe(true);
    expect(policy.lastEvaluation?.latestResultText).toBe("Failed: suggestion generation unavailable");
  });

  it("halts at Spec 145 without mutating the backlog when the suggestion is ineligible", async () => {
    const storage = createMemoryStorage();
    // Suggestion is generated at "normal" priority; Auto Accept only allows HIGH.
    const controller = createController(storage, providerWith([
      { title: "Low-priority idea", description: "Not eligible for auto-accept.", priority: "normal" },
    ]));
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, PROJECT_A);

    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 });
    await flushPromises();

    const suggestions = internals.state.projectBacklogSuggestionCollections[PROJECT_A]?.candidates ?? [];
    expect(suggestions).toHaveLength(1);

    // Spec 145 evaluated and skipped it: backlog stays empty, the suggestion
    // stays proposed, and the ineligibility reason is exposed structurally.
    expect(internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept()).toBe(false);
    expect(internals.state.projectBacklogCollections[PROJECT_A]?.tasks ?? []).toEqual([]);
    expect(suggestions[0].status).toBe("proposed");
    const acceptancePolicy = internals.state.projectBacklogSuggestionAcceptancePolicies[PROJECT_A]!;
    expect(acceptancePolicy.lastEvaluation?.skipped[0]?.reason).toBe("PriorityNotAllowed");
    expect(acceptancePolicy.lastEvaluation?.latestResultText).toMatch(/^Skipped:/);
  });

  it("preserves prior state and surfaces a block reason when the ADOS execution stage fails", async () => {
    const storage = createMemoryStorage();
    const controller = createController(storage, providerWith([
      { title: "Doc task", description: "Add a short docs note.", priority: HIGH },
    ]));
    const internals = getControllerInternals(controller);
    // Real ExternalProjectAdosExecutionService; the implementer runtime fails to
    // spawn, which the real service maps to a Failed result with no execution
    // record (EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE).
    const invoke = vi.fn(async () => {
      throw new Error("implementer runtime unavailable");
    });
    internals.externalProjectAdosExecutionService =
      new ExternalProjectAdosExecutionService({ providerId: "claude", invoke } as ImplementerRuntimeProvider);
    seedTwoProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, PROJECT_A);

    internals.updateSelectedProjectSuggestionAcceptancePolicy({ enabled: true, allowedPriorities: [HIGH] });
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: [HIGH] });
    internals.updateSelectedProjectAutonomousSuggestionPolicy({ enabled: true, maxSuggestionsPerEvaluation: 1 });
    await flushPromises();
    internals.evaluateSelectedProjectBacklogSuggestionsForAutoAccept();
    internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: [HIGH],
      maxPromotionsPerEvaluation: 1,
    });
    const readyTask = internals.state.projectBacklogCollections[PROJECT_A].tasks[0];
    expect(readyTask.status).toBe("ready");

    // Spec 144 authorizes execution; the real ADOS service runs and fails.
    expect(await controller.reevaluateSelectedProjectAutonomy()).toBe(false);
    expect(invoke).toHaveBeenCalledTimes(1); // real ADOS path exercised, not skipped

    // Prior authoritative state preserved: task stays Ready, never in_progress,
    // no execution record, no fabricated completion.
    const taskAfter = internals.state.projectBacklogCollections[PROJECT_A].tasks
      .find((task) => task.id === readyTask.id)!;
    expect(taskAfter.status).toBe("ready");
    expect(taskAfter.executionRunId).toBeUndefined();
    expect(Object.values(internals.state.externalProjectAdosExecutions)).toEqual([]);

    // Concise block reason exposed on the durable records the office observes.
    const result = Object.values(internals.state.externalProjectAdosExecutionResults)[0] as
      | { status: string; reasonCodes: string[]; started: boolean }
      | undefined;
    expect(result?.status).toBe("Failed");
    expect(result?.started).toBe(false);
    expect(result?.reasonCodes).toContain("EXTERNAL_ADOS_EXECUTION_INTERNAL_FAILURE");
    const draftKey = Object.keys(internals.state.externalProjectDevelopmentRequestDrafts)[0];
    expect(internals.state.externalProjectDevelopmentRequestDrafts[draftKey].status).toBe("Failed");
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
  // Same registration *mechanism* production uses in OfficeProjectPortalRegistry:
  //   1. real ProjectRegistrySeedData + ProjectRegistryService, with a
  //      Project A local repository/worktree binding applied through the real
  //      applyLocalProjectRepositoryBindings (ProjectRegistryService ctor);
  //   2. real toProjectPortalProject adapter -> state.projects;
  //   3. real ProjectCompanyBindingService.createBindings -> state.projectCompanyBindings.
  // The binding *data* is deliberately not production's live "daily-proof"
  // binding (which points at a separate, fixed repository/worktree path):
  // requirement 3 forbids destructive/arbitrary repository work, so this test
  // binds the same canonical project id to this verification worktree
  // (process.cwd()) instead - the real applyLocalProjectRepositoryBindings
  // function, a real registered project id, a safe target path. Project B
  // ("ai-lab") keeps its seeded not-connected lifecycle state. No hand-rolled
  // project records, no invented project identity in controller internals.
  const registry = new ProjectRegistryService(createDefaultProjectRegistryEntries(), [
    {
      projectId: PROJECT_A,
      repositoryPath: REPO_ROOT,
      worktreePath: REPO_ROOT,
      branchName: "codex/148-autonomous-company-operations-end-to-end",
      source: "spec-148-e2e-verification",
    },
  ]);
  const entries = registry
    .getAllProjects()
    .filter((entry) => entry.id === PROJECT_A || entry.id === PROJECT_B);

  internals.state.projectRegistryEntries = entries;
  internals.state.projects = entries.map((entry) => toProjectPortalProject(entry, []));
  internals.state.projectCompanyBindings = new ProjectCompanyBindingService().createBindings(CITY_BUILDINGS, entries);
}

// The injectable ADOS process-spawn adapter (authoritative requirement 23).
// `status: "Completed"` is the only success value of ImplementerRuntimeStatus
// and means only "the implementer subprocess exited cleanly"; `evidence.completed:
// false` means the ADOS run as a whole is still in flight - the "run launched,
// not finished" shape the Spec 144 suite uses and the active-run gate in
// ProjectAutonomousSuggestionPolicyService.countActiveExecutions keys on. The
// review / validation / exact-HEAD / publication leg of the same cycle is
// exercised through the real agent-workflow modules over this run's durable
// ADOS records (see the "completes one controlled Project A cycle end to end"
// test and spec148RoleAssignmentEvidence.test.ts).
function launchedImplementerProvider() {
  const invoke = vi.fn(
    async (command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> => ({
      status: "Completed",
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: [command.command, ...command.arguments].join(" "),
        workingDirectory: command.workingDirectory,
        started: true,
        completed: false,
        timedOut: false,
        cancelled: false,
        durationMs: 5,
        stdoutSummary: "",
        stderrSummary: "",
        outputTruncated: false,
      },
    }),
  );
  return { provider: { providerId: "claude", invoke } as ImplementerRuntimeProvider, invoke };
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
    repositoryPath: REPO_ROOT,
    worktreePath: REPO_ROOT,
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
      workingDirectory: REPO_ROOT,
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
