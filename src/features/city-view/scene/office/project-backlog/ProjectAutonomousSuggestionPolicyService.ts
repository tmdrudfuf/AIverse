import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectBacklogProjectContext } from "./ProjectBacklogService";
import type { ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCandidate } from "./ProjectBacklogSuggestionTypes";
import type {
  ProjectAutonomousSuggestionAudit,
  ProjectAutonomousSuggestionEvaluationEvent,
  ProjectAutonomousSuggestionEvaluationResult,
  ProjectAutonomousSuggestionPlanningState,
  ProjectAutonomousSuggestionPolicies,
  ProjectAutonomousSuggestionPolicy,
  ProjectAutonomousSuggestionReason,
} from "./ProjectAutonomousSuggestionPolicyTypes";

const MIN_COOLDOWN_MS = 15 * 60 * 1000;
const MAX_SUGGESTIONS_PER_EVALUATION = 5;
const MAX_UNRESOLVED_PLANNING_ITEMS = 25;
const MAX_RECORDED_EVENT_IDS = 20;

export type ProjectAutonomousSuggestionPolicyPatch = Partial<Pick<
  ProjectAutonomousSuggestionPolicy,
  | "enabled"
  | "maxSuggestionsPerEvaluation"
  | "cooldownMs"
  | "requireNoActiveExecution"
  | "requireNoPendingReadyTask"
  | "requireNoExistingEligibleSuggestion"
  | "minimumPlanningCapacity"
  | "maxUnresolvedPlanningItems"
>>;

export type EvaluateProjectAutonomousSuggestionPolicyInput = {
  policies: ProjectAutonomousSuggestionPolicies | undefined;
  project: ProjectPortalProject | undefined;
  context: ProjectBacklogProjectContext | undefined;
  event: ProjectAutonomousSuggestionEvaluationEvent;
  planningState: ProjectAutonomousSuggestionPlanningState;
};

export class ProjectAutonomousSuggestionPolicyService {
  private readonly now: () => string;

  constructor(options: { now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  createDefaultPolicy(projectId: string): ProjectAutonomousSuggestionPolicy {
    return {
      projectId,
      enabled: false,
      maxSuggestionsPerEvaluation: 1,
      cooldownMs: MIN_COOLDOWN_MS,
      requireNoActiveExecution: true,
      requireNoPendingReadyTask: true,
      requireNoExistingEligibleSuggestion: true,
      minimumPlanningCapacity: 1,
      maxUnresolvedPlanningItems: MAX_UNRESOLVED_PLANNING_ITEMS,
      updatedAt: this.now(),
      updatedByOperator: false,
    };
  }

  getPolicy(
    policies: ProjectAutonomousSuggestionPolicies | undefined,
    projectId: string,
  ): ProjectAutonomousSuggestionPolicy {
    const policy = policies?.[projectId];
    return isProjectAutonomousSuggestionPolicy(policy) && policy.projectId === projectId
      ? clonePolicy(policy)
      : this.createDefaultPolicy(projectId);
  }

  updatePolicy(
    policies: ProjectAutonomousSuggestionPolicies,
    context: ProjectBacklogProjectContext | undefined,
    patch: ProjectAutonomousSuggestionPolicyPatch,
  ) {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const existing = this.getPolicy(policies, resolution.projectId);
    const maxSuggestionsPerEvaluation = normalizeMaxSuggestions(
      patch.maxSuggestionsPerEvaluation ?? existing.maxSuggestionsPerEvaluation,
    );
    const maxUnresolvedPlanningItems = normalizeMaxUnresolved(
      patch.maxUnresolvedPlanningItems ?? existing.maxUnresolvedPlanningItems,
    );
    const minimumPlanningCapacity = normalizeMinimumCapacity(
      patch.minimumPlanningCapacity ?? existing.minimumPlanningCapacity,
      maxUnresolvedPlanningItems,
    );
    const policy: ProjectAutonomousSuggestionPolicy = {
      ...existing,
      enabled: Boolean(patch.enabled !== undefined ? patch.enabled : existing.enabled),
      maxSuggestionsPerEvaluation,
      cooldownMs: normalizeCooldown(patch.cooldownMs ?? existing.cooldownMs),
      requireNoActiveExecution: patch.requireNoActiveExecution !== undefined
        ? Boolean(patch.requireNoActiveExecution)
        : existing.requireNoActiveExecution,
      requireNoPendingReadyTask: patch.requireNoPendingReadyTask !== undefined
        ? Boolean(patch.requireNoPendingReadyTask)
        : existing.requireNoPendingReadyTask,
      requireNoExistingEligibleSuggestion: patch.requireNoExistingEligibleSuggestion !== undefined
        ? Boolean(patch.requireNoExistingEligibleSuggestion)
        : existing.requireNoExistingEligibleSuggestion,
      minimumPlanningCapacity,
      maxUnresolvedPlanningItems,
      updatedAt: this.now(),
      updatedByOperator: true,
    };
    policies[resolution.projectId] = clonePolicy(policy);
    return { ok: true as const, policy: clonePolicy(policy) };
  }

  evaluate(input: EvaluateProjectAutonomousSuggestionPolicyInput): ProjectAutonomousSuggestionEvaluationResult {
    const projectId = input.project?.id ?? input.context?.projectId ?? input.event.projectId;
    const policy = this.getPolicy(input.policies, projectId);
    const evaluatedAt = this.now();
    const closed = (reason: ProjectAutonomousSuggestionReason) => this.createResult(
      projectId,
      policy,
      input.event,
      false,
      reason,
      evaluatedAt,
      [],
      false,
    );

    if (!input.project || !input.context) return closed("ProjectMissing");
    if (!input.project.enabled) return closed("ProjectUnavailable");
    if (!isProjectConnected(input.project)) return closed("ProjectDisconnected");
    const resolution = this.resolveProjectId(input.context);
    if (!resolution.ok) return closed(resolution.reason);
    if (
      input.event.projectId !== resolution.projectId ||
      input.project.id !== resolution.projectId ||
      policy.projectId !== resolution.projectId
    ) {
      return closed("ProjectMismatch");
    }
    if (!isProjectAutonomousSuggestionPolicy(policy)) return closed("MalformedPolicy");
    if (!policy.enabled) return closed("PolicyDisabled");
    if (hasEvaluatedEvent(policy.lastEvaluation, input.event.eventId)) return closed("DuplicateEvent");
    if (isCooldownActive(policy, evaluatedAt)) return closed("CooldownActive");
    if (policy.requireNoActiveExecution && countActiveExecutions(input.planningState) > 0) return closed("ActiveExecutionExists");
    if (policy.requireNoPendingReadyTask && hasReadyWork(input.planningState.backlogTasks, resolution.projectId)) return closed("ReadyWorkPending");
    if (
      policy.requireNoExistingEligibleSuggestion &&
      hasPendingSuggestion(input.planningState.suggestions, resolution.projectId)
    ) {
      return closed("PendingSuggestionExists");
    }
    if (!hasPlanningCapacity(policy, input.planningState, resolution.projectId)) return closed("PlanningCapacityReached");
    if (hasDuplicateReadyOrActiveWork(input.planningState.backlogTasks, resolution.projectId)) return closed("DuplicateWorkExists");

    return this.createResult(projectId, policy, input.event, true, "Generated", evaluatedAt, [], false);
  }

  createGeneratedResult(
    input: ProjectAutonomousSuggestionEvaluationResult,
    generated: ReadonlyArray<ProjectBacklogSuggestionCandidate>,
  ): ProjectAutonomousSuggestionEvaluationResult {
    const generatedItems = generated.map((candidate) => ({ ...candidate }));
    return this.createResult(
      input.projectId,
      input.policy,
      input.event,
      generatedItems.length > 0,
      generatedItems.length > 0 ? "Generated" : "NoSuggestionsGenerated",
      input.evaluatedAt,
      generatedItems,
      true,
    );
  }

  createFailureResult(
    input: ProjectAutonomousSuggestionEvaluationResult,
    reason: Extract<ProjectAutonomousSuggestionReason, "GenerationUnavailable" | "NoSuggestionsGenerated">,
  ): ProjectAutonomousSuggestionEvaluationResult {
    return this.createResult(input.projectId, input.policy, input.event, false, reason, input.evaluatedAt, [], true);
  }

  recordEvaluation(
    policies: ProjectAutonomousSuggestionPolicies,
    result: ProjectAutonomousSuggestionEvaluationResult,
  ): ProjectAutonomousSuggestionPolicy {
    const policy = this.getPolicy(policies, result.projectId);
    if (!policy.updatedByOperator && !policy.enabled) return policy;
    const generated = result.generated[0];
    const previousIds = policy.lastEvaluation?.evaluatedEventIds ?? [];
    const audit: ProjectAutonomousSuggestionAudit = {
      evaluatedAt: result.evaluatedAt,
      eventId: result.event.eventId,
      eventType: result.event.eventType,
      latestResultText: result.latestResultText,
      reason: result.reason,
      generatedCount: result.generated.length,
      skippedCount: result.allowed ? 0 : 1,
      providerInvoked: result.providerInvoked,
      lastAutomaticGenerationAt: generated ? result.evaluatedAt : policy.lastEvaluation?.lastAutomaticGenerationAt,
      lastGeneratedSuggestionId: generated?.id ?? policy.lastEvaluation?.lastGeneratedSuggestionId,
      evaluatedEventIds: [...previousIds.filter((id) => id !== result.event.eventId), result.event.eventId]
        .slice(-MAX_RECORDED_EVENT_IDS),
    };
    const recorded = { ...policy, lastEvaluation: audit };
    policies[result.projectId] = clonePolicy(recorded);
    return clonePolicy(recorded);
  }

  clonePolicies(policies: ProjectAutonomousSuggestionPolicies | undefined): ProjectAutonomousSuggestionPolicies {
    return Object.fromEntries(
      Object.entries(policies ?? {})
        .filter(([projectId, policy]) => isProjectAutonomousSuggestionPolicy(policy) && policy.projectId === projectId)
        .map(([projectId, policy]) => [projectId, clonePolicy(policy)]),
    );
  }

  private createResult(
    projectId: string,
    policy: ProjectAutonomousSuggestionPolicy,
    event: ProjectAutonomousSuggestionEvaluationEvent,
    allowed: boolean,
    reason: ProjectAutonomousSuggestionReason,
    evaluatedAt: string,
    generated: ReadonlyArray<ProjectBacklogSuggestionCandidate>,
    providerInvoked: boolean,
  ): ProjectAutonomousSuggestionEvaluationResult {
    return {
      projectId,
      policy: clonePolicy(policy),
      event: { ...event },
      allowed,
      reason,
      evaluatedAt,
      latestResultText: formatResult(reason, generated.length),
      generated: generated.map((candidate) => ({ ...candidate })),
      skippedCount: allowed ? 0 : 1,
      providerInvoked,
    };
  }

  private resolveProjectId(context: ProjectBacklogProjectContext | undefined) {
    if (!context) return { ok: false as const, reason: "ProjectMissing" as const };
    const resolved = new ProjectCompanyBindingService().resolveProjectBinding({
      bindingId: context.bindingId,
      buildingId: context.buildingId,
      projectId: context.projectId,
      fallbackCompanyName: context.fallbackCompanyName,
      projects: context.projects,
    });
    if (!resolved.project) return { ok: false as const, reason: "ProjectMissing" as const };
    if (resolved.status !== "bound") return { ok: false as const, reason: "ProjectUnavailable" as const };
    return { ok: true as const, projectId: resolved.projectId };
  }
}

export function isProjectAutonomousSuggestionPolicy(value: unknown): value is ProjectAutonomousSuggestionPolicy {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.projectId) &&
    typeof value.enabled === "boolean" &&
    Number.isInteger(value.maxSuggestionsPerEvaluation) &&
    Number(value.maxSuggestionsPerEvaluation) >= 1 &&
    Number(value.maxSuggestionsPerEvaluation) <= MAX_SUGGESTIONS_PER_EVALUATION &&
    Number.isInteger(value.cooldownMs) &&
    Number(value.cooldownMs) >= MIN_COOLDOWN_MS &&
    typeof value.requireNoActiveExecution === "boolean" &&
    typeof value.requireNoPendingReadyTask === "boolean" &&
    typeof value.requireNoExistingEligibleSuggestion === "boolean" &&
    Number.isInteger(value.minimumPlanningCapacity) &&
    Number(value.minimumPlanningCapacity) >= 1 &&
    Number.isInteger(value.maxUnresolvedPlanningItems) &&
    Number(value.maxUnresolvedPlanningItems) >= 1 &&
    Number(value.maxUnresolvedPlanningItems) <= MAX_UNRESOLVED_PLANNING_ITEMS &&
    Number(value.minimumPlanningCapacity) <= Number(value.maxUnresolvedPlanningItems) &&
    typeof value.updatedAt === "string" &&
    typeof value.updatedByOperator === "boolean" &&
    (value.lastEvaluation === undefined || isAudit(value.lastEvaluation))
  );
}

function isAudit(value: unknown): value is ProjectAutonomousSuggestionAudit {
  return (
    isRecord(value) &&
    typeof value.evaluatedAt === "string" &&
    typeof value.eventId === "string" &&
    typeof value.eventType === "string" &&
    typeof value.latestResultText === "string" &&
    typeof value.reason === "string" &&
    Number.isInteger(value.generatedCount) &&
    Number.isInteger(value.skippedCount) &&
    typeof value.providerInvoked === "boolean" &&
    (value.lastAutomaticGenerationAt === undefined || typeof value.lastAutomaticGenerationAt === "string") &&
    (value.lastGeneratedSuggestionId === undefined || typeof value.lastGeneratedSuggestionId === "string") &&
    Array.isArray(value.evaluatedEventIds) &&
    value.evaluatedEventIds.every((id) => typeof id === "string")
  );
}

function countActiveExecutions(input: ProjectAutonomousSuggestionPlanningState) {
  const runStatus = input.activeRunStatus;
  const statusActive = runStatus && (
    runStatus.stage === "Prepared" ||
    runStatus.stage === "Started" ||
    runStatus.stage === "Blocked" ||
    runStatus.stage === "TimedOut"
  ) ? 1 : 0;
  const executionCount = (input.activeExecutions ?? []).filter((execution) => (
    (
      execution.status === "Completed" &&
      execution.implementerStarted &&
      !execution.evidence.completed &&
      !execution.evidence.timedOut &&
      !execution.evidence.cancelled
    ) || (
      execution.status !== "Completed" &&
      execution.status !== "Failed" &&
      execution.status !== "Cancelled"
    )
  )).length;
  return Math.max(statusActive, executionCount);
}

function hasReadyWork(tasks: ReadonlyArray<ProjectBacklogTask>, projectId: string) {
  return tasks.some((task) => task.projectId === projectId && task.status === "ready");
}

function hasPendingSuggestion(suggestions: ReadonlyArray<ProjectBacklogSuggestionCandidate>, projectId: string) {
  return suggestions.some((suggestion) => suggestion.projectId === projectId && suggestion.status === "proposed");
}

function hasPlanningCapacity(
  policy: ProjectAutonomousSuggestionPolicy,
  state: ProjectAutonomousSuggestionPlanningState,
  projectId: string,
) {
  const unresolvedTasks = state.backlogTasks.filter((task) => (
    task.projectId === projectId &&
    (task.status === "backlog" || task.status === "ready" || task.status === "in_progress" || task.status === "blocked")
  )).length;
  const pendingSuggestions = state.suggestions.filter((suggestion) => (
    suggestion.projectId === projectId && suggestion.status === "proposed"
  )).length;
  const unresolvedCount = unresolvedTasks + pendingSuggestions;
  const remaining = policy.maxUnresolvedPlanningItems - unresolvedCount;
  return remaining >= policy.minimumPlanningCapacity;
}

function hasDuplicateReadyOrActiveWork(tasks: ReadonlyArray<ProjectBacklogTask>, projectId: string) {
  const pendingTitles = new Set(
    tasks
      .filter((task) => task.projectId === projectId && task.status === "backlog")
      .map((task) => normalizeWorkText(task.title)),
  );
  return tasks.some((task) => (
    task.projectId === projectId &&
    (task.status === "ready" || task.status === "in_progress") &&
    pendingTitles.has(normalizeWorkText(task.title))
  ));
}

function isCooldownActive(policy: ProjectAutonomousSuggestionPolicy, evaluatedAt: string) {
  const lastAt = policy.lastEvaluation?.lastAutomaticGenerationAt;
  if (!lastAt) return false;
  const elapsed = Date.parse(evaluatedAt) - Date.parse(lastAt);
  return Number.isFinite(elapsed) && elapsed >= 0 && elapsed < policy.cooldownMs;
}

function hasEvaluatedEvent(audit: ProjectAutonomousSuggestionAudit | undefined, eventId: string) {
  return Boolean(eventId && audit?.evaluatedEventIds.includes(eventId));
}

function normalizeMaxSuggestions(value: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), MAX_SUGGESTIONS_PER_EVALUATION)
    : 1;
}

function normalizeCooldown(value: number) {
  return Number.isFinite(value) ? Math.max(Math.floor(value), MIN_COOLDOWN_MS) : MIN_COOLDOWN_MS;
}

function normalizeMaxUnresolved(value: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), MAX_UNRESOLVED_PLANNING_ITEMS)
    : MAX_UNRESOLVED_PLANNING_ITEMS;
}

function normalizeMinimumCapacity(value: number, maxUnresolvedPlanningItems: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), maxUnresolvedPlanningItems)
    : 1;
}

function formatResult(reason: ProjectAutonomousSuggestionReason, generatedCount: number) {
  if (reason === "Generated") return `Generated ${generatedCount || 1} suggestion${generatedCount === 1 ? "" : "s"}`;
  if (reason === "GenerationUnavailable") return "Failed: suggestion generation unavailable";
  if (reason === "NoSuggestionsGenerated") return "Failed: no suggestions generated";
  return `Skipped: ${reason.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()}`;
}

function isProjectConnected(project: ProjectPortalProject) {
  if (!project.localRepositoryBinding) return false;
  const connectionState = project.repositoryIdentity?.connectionState;
  return connectionState !== "Unavailable" && connectionState !== "Unknown";
}

function clonePolicy(policy: ProjectAutonomousSuggestionPolicy): ProjectAutonomousSuggestionPolicy {
  return {
    ...policy,
    ...(policy.lastEvaluation ? {
      lastEvaluation: {
        ...policy.lastEvaluation,
        evaluatedEventIds: [...policy.lastEvaluation.evaluatedEventIds],
      },
    } : {}),
  };
}

function normalizeWorkText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}
