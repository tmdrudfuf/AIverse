import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectBacklogProjectContext, ProjectBacklogService } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionService } from "./ProjectBacklogSuggestionService";
import type {
  ProjectBacklogSuggestionCandidate,
  ProjectBacklogSuggestionCollections,
} from "./ProjectBacklogSuggestionTypes";
import type {
  ProjectBacklogSuggestionAcceptanceEvaluationResult,
  ProjectBacklogSuggestionAcceptancePolicies,
  ProjectBacklogSuggestionAcceptancePolicy,
  ProjectBacklogSuggestionAcceptanceReason,
  ProjectBacklogSuggestionAcceptanceSkip,
} from "./ProjectBacklogSuggestionAcceptancePolicyTypes";

const PRIORITIES: readonly ProjectBacklogPriority[] = ["low", "normal", "high", "urgent"];
const DEFAULT_ALLOWED_PRIORITIES: readonly ProjectBacklogPriority[] = ["high"];
const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1200;
const MAX_ACCEPT_PER_EVALUATION = 5;

export type ProjectBacklogSuggestionAcceptancePolicyPatch = Partial<Pick<
  ProjectBacklogSuggestionAcceptancePolicy,
  "enabled" | "allowedPriorities" | "maxAutoAcceptPerEvaluation"
>>;

export type EvaluateAndAcceptProjectBacklogSuggestionsInput = {
  policies: ProjectBacklogSuggestionAcceptancePolicies | undefined;
  project: ProjectPortalProject | undefined;
  context: ProjectBacklogProjectContext | undefined;
  suggestionCollections: ProjectBacklogSuggestionCollections;
  backlogCollections: ProjectBacklogCollections;
  suggestionService: ProjectBacklogSuggestionService;
  backlogService: ProjectBacklogService;
};

export class ProjectBacklogSuggestionAcceptancePolicyService {
  private readonly now: () => string;

  constructor(options: { now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  createDefaultPolicy(projectId: string): ProjectBacklogSuggestionAcceptancePolicy {
    return {
      projectId,
      enabled: false,
      allowedPriorities: [...DEFAULT_ALLOWED_PRIORITIES],
      maxAutoAcceptPerEvaluation: 1,
      requireNonDuplicate: true,
      requireValidStructuredSuggestion: true,
      createdTaskInitialStatus: "backlog",
      updatedAt: this.now(),
      updatedByOperator: false,
    };
  }

  getPolicy(
    policies: ProjectBacklogSuggestionAcceptancePolicies | undefined,
    projectId: string,
  ): ProjectBacklogSuggestionAcceptancePolicy {
    const policy = policies?.[projectId];
    return isProjectBacklogSuggestionAcceptancePolicy(policy) && policy.projectId === projectId
      ? clonePolicy(policy)
      : this.createDefaultPolicy(projectId);
  }

  updatePolicy(
    policies: ProjectBacklogSuggestionAcceptancePolicies,
    context: ProjectBacklogProjectContext | undefined,
    patch: ProjectBacklogSuggestionAcceptancePolicyPatch,
  ) {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const existing = this.getPolicy(policies, resolution.projectId);
    const allowedPriorities = patch.allowedPriorities !== undefined
      ? normalizePriorities(patch.allowedPriorities)
      : existing.allowedPriorities;
    const policy: ProjectBacklogSuggestionAcceptancePolicy = {
      ...existing,
      enabled: Boolean(patch.enabled !== undefined ? patch.enabled : existing.enabled),
      allowedPriorities,
      maxAutoAcceptPerEvaluation: normalizeMaxAutoAccept(
        patch.maxAutoAcceptPerEvaluation ?? existing.maxAutoAcceptPerEvaluation,
      ),
      requireNonDuplicate: true,
      requireValidStructuredSuggestion: true,
      createdTaskInitialStatus: "backlog",
      updatedAt: this.now(),
      updatedByOperator: true,
    };
    policies[resolution.projectId] = clonePolicy(policy);
    return { ok: true as const, policy: clonePolicy(policy) };
  }

  evaluateAndAccept(
    input: EvaluateAndAcceptProjectBacklogSuggestionsInput,
  ): ProjectBacklogSuggestionAcceptanceEvaluationResult {
    const projectId = input.project?.id ?? input.context?.projectId ?? "";
    const policy = this.getPolicy(input.policies, projectId);
    const evaluatedAt = this.now();
    const closed = (reason: ProjectBacklogSuggestionAcceptanceReason) => this.createResult(
      projectId,
      policy,
      [],
      collectSkips(input.suggestionCollections, projectId, reason),
      evaluatedAt,
    );

    if (!input.project || !input.context) return closed("ProjectMissing");
    if (!input.project.enabled) return closed("ProjectUnavailable");
    if (!isProjectConnected(input.project)) return closed("ProjectDisconnected");
    const resolution = this.resolveProjectId(input.context);
    if (!resolution.ok) return closed(resolution.reason);
    if (resolution.projectId !== input.project.id || resolution.projectId !== policy.projectId) return closed("ProjectMismatch");
    if (!policy.enabled) return closed("PolicyDisabled");

    const collection = input.suggestionCollections[projectId];
    const suggestions = collection?.projectId === projectId
      ? collection.candidates.filter((candidate) => candidate.projectId === projectId)
      : [];
    const tasks = input.backlogService.getOrderedCollection(input.backlogCollections, projectId).tasks;
    const duplicateTitles = new Set(tasks.map((task) => normalizeWorkText(task.title)));
    const associatedSuggestionIds = new Set([
      ...tasks.map((task) => task.sourceSuggestionId).filter((value): value is string => Boolean(value)),
      ...suggestions.map((suggestion) => suggestion.acceptedBacklogTaskId ? suggestion.id : undefined)
        .filter((value): value is string => Boolean(value)),
    ]);

    const candidates: ProjectBacklogSuggestionCandidate[] = [];
    const skipped: ProjectBacklogSuggestionAcceptanceSkip[] = [];
    const otherProjectIds = input.context.projects
      .map((project) => project.id)
      .filter((id) => id !== projectId);

    for (const suggestion of suggestions) {
      const reason = this.getIneligibilityReason(suggestion, policy, duplicateTitles, associatedSuggestionIds, otherProjectIds);
      if (reason) {
        skipped.push(toSkip(suggestion, reason));
        continue;
      }
      candidates.push(suggestion);
    }

    const accepted = [];
    const orderedCandidates = orderCandidates(candidates, policy.allowedPriorities);
    const limit = policy.maxAutoAcceptPerEvaluation;
    for (const suggestion of orderedCandidates.slice(0, limit)) {
      const result = input.suggestionService.acceptSuggestion(
        input.suggestionCollections,
        input.backlogCollections,
        input.context,
        suggestion.id,
        {
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.suggestedPriority,
          acceptanceMode: "automatic",
        },
      );
      if (result.ok && result.task) {
        accepted.push({
          suggestion: result.suggestion,
          task: result.task,
          reason: `Auto-accepted: ${result.task.priority} priority allowed`,
        });
        duplicateTitles.add(normalizeWorkText(result.task.title));
        associatedSuggestionIds.add(suggestion.id);
      } else {
        skipped.push(toSkip(suggestion, "InvalidSuggestion"));
      }
    }
    for (const suggestion of orderedCandidates.slice(limit)) {
      skipped.push(toSkip(suggestion, "BoundedLimitReached"));
    }

    return this.createResult(projectId, policy, accepted, skipped, evaluatedAt);
  }

  recordEvaluation(
    policies: ProjectBacklogSuggestionAcceptancePolicies,
    result: ProjectBacklogSuggestionAcceptanceEvaluationResult,
  ): ProjectBacklogSuggestionAcceptancePolicy {
    const policy = this.getPolicy(policies, result.projectId);
    if (!policy.updatedByOperator && !policy.enabled) return policy;
    const recorded: ProjectBacklogSuggestionAcceptancePolicy = {
      ...policy,
      lastEvaluation: {
        evaluatedAt: result.evaluatedAt,
        acceptedCount: result.accepted.length,
        skippedCount: result.skipped.length,
        latestResultText: result.latestResultText,
        acceptedSuggestionIds: result.accepted.map((item) => item.suggestion.id),
        skipped: result.skipped.map((item) => ({ ...item })),
      },
    };
    policies[result.projectId] = clonePolicy(recorded);
    return clonePolicy(recorded);
  }

  clonePolicies(
    policies: ProjectBacklogSuggestionAcceptancePolicies | undefined,
  ): ProjectBacklogSuggestionAcceptancePolicies {
    return Object.fromEntries(
      Object.entries(policies ?? {})
        .filter(([projectId, policy]) => isProjectBacklogSuggestionAcceptancePolicy(policy) && policy.projectId === projectId)
        .map(([projectId, policy]) => [projectId, clonePolicy(policy)]),
    );
  }

  private getIneligibilityReason(
    suggestion: ProjectBacklogSuggestionCandidate,
    policy: ProjectBacklogSuggestionAcceptancePolicy,
    duplicateTitles: ReadonlySet<string>,
    associatedSuggestionIds: ReadonlySet<string>,
    otherProjectIds: ReadonlyArray<string>,
  ): ProjectBacklogSuggestionAcceptanceReason | undefined {
    if (suggestion.status !== "proposed") return suggestion.status === "accepted" ? "AlreadyAccepted" : "SuggestionNotProposed";
    if (associatedSuggestionIds.has(suggestion.id) || suggestion.acceptedBacklogTaskId) return "AlreadyAccepted";
    if (!isValidSuggestion(suggestion, otherProjectIds)) return "InvalidSuggestion";
    if (!suggestion.suggestedPriority || !policy.allowedPriorities.includes(suggestion.suggestedPriority)) {
      return "PriorityNotAllowed";
    }
    if (duplicateTitles.has(normalizeWorkText(suggestion.title))) return "DuplicateBacklogItem";
    return undefined;
  }

  private createResult(
    projectId: string,
    policy: ProjectBacklogSuggestionAcceptancePolicy,
    accepted: ProjectBacklogSuggestionAcceptanceEvaluationResult["accepted"],
    skipped: ProjectBacklogSuggestionAcceptanceSkip[],
    evaluatedAt: string,
  ): ProjectBacklogSuggestionAcceptanceEvaluationResult {
    const latestResultText = accepted.length > 0
      ? accepted[0].reason
      : skipped[0]
        ? `Skipped: ${formatReason(skipped[0].reason)}`
        : policy.enabled
          ? "No suggestions to evaluate"
          : "Skipped: policy disabled";
    return {
      projectId,
      policy: clonePolicy(policy),
      accepted,
      skipped,
      evaluatedAt,
      latestResultText,
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

export function isProjectBacklogSuggestionAcceptancePolicy(
  value: unknown,
): value is ProjectBacklogSuggestionAcceptancePolicy {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.projectId) &&
    typeof value.enabled === "boolean" &&
    Array.isArray(value.allowedPriorities) &&
    value.allowedPriorities.every(isPriority) &&
    Number.isInteger(value.maxAutoAcceptPerEvaluation) &&
    Number(value.maxAutoAcceptPerEvaluation) >= 1 &&
    Number(value.maxAutoAcceptPerEvaluation) <= MAX_ACCEPT_PER_EVALUATION &&
    value.requireNonDuplicate === true &&
    value.requireValidStructuredSuggestion === true &&
    value.createdTaskInitialStatus === "backlog" &&
    typeof value.updatedAt === "string" &&
    typeof value.updatedByOperator === "boolean" &&
    (value.lastEvaluation === undefined || isRecord(value.lastEvaluation))
  );
}

function isValidSuggestion(
  suggestion: ProjectBacklogSuggestionCandidate,
  otherProjectIds: ReadonlyArray<string>,
) {
  if (!isNonEmptyString(suggestion.id) || !isNonEmptyString(suggestion.projectId)) return false;
  if (!isBoundedString(suggestion.title, MAX_TITLE_LENGTH)) return false;
  if (!isBoundedString(suggestion.description, MAX_DESCRIPTION_LENGTH)) return false;
  if (!isBoundedString(suggestion.sourceContextSummary, MAX_DESCRIPTION_LENGTH)) return false;
  if (!isNonEmptyString(suggestion.generatedAt) || !isNonEmptyString(suggestion.updatedAt)) return false;
  if (suggestion.suggestedPriority !== undefined && !isPriority(suggestion.suggestedPriority)) return false;
  const searchable = `${suggestion.id} ${suggestion.title} ${suggestion.description}`;
  return !otherProjectIds.some((projectId) => searchable.includes(projectId));
}

function collectSkips(
  collections: ProjectBacklogSuggestionCollections,
  projectId: string,
  reason: ProjectBacklogSuggestionAcceptanceReason,
) {
  return (collections[projectId]?.candidates ?? [])
    .filter((suggestion) => suggestion.projectId === projectId)
    .map((suggestion) => toSkip(suggestion, reason));
}

function toSkip(
  suggestion: ProjectBacklogSuggestionCandidate,
  reason: ProjectBacklogSuggestionAcceptanceReason,
): ProjectBacklogSuggestionAcceptanceSkip {
  return { suggestionId: suggestion.id, title: suggestion.title, reason };
}

function orderCandidates(
  suggestions: ReadonlyArray<ProjectBacklogSuggestionCandidate>,
  allowedPriorities: ReadonlyArray<ProjectBacklogPriority>,
) {
  return [...suggestions].sort((left, right) => {
    const priorityDiff = getPriorityRank(left.suggestedPriority, allowedPriorities) -
      getPriorityRank(right.suggestedPriority, allowedPriorities);
    if (priorityDiff !== 0) return priorityDiff;
    const generatedDiff = compareTimestamp(left.generatedAt, right.generatedAt);
    if (generatedDiff !== 0) return generatedDiff;
    return left.id.localeCompare(right.id);
  });
}

function getPriorityRank(priority: ProjectBacklogPriority | undefined, allowedPriorities: ReadonlyArray<ProjectBacklogPriority>) {
  if (!priority) return Number.MAX_SAFE_INTEGER;
  const index = allowedPriorities.indexOf(priority);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function normalizePriorities(values: ReadonlyArray<ProjectBacklogPriority>) {
  return PRIORITIES.filter((priority) => values.includes(priority));
}

function normalizeMaxAutoAccept(value: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), MAX_ACCEPT_PER_EVALUATION)
    : 1;
}

function normalizeWorkText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function formatReason(reason: ProjectBacklogSuggestionAcceptanceReason) {
  return reason.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function isProjectConnected(project: ProjectPortalProject) {
  if (!project.localRepositoryBinding) return false;
  const connectionState = project.repositoryIdentity?.connectionState;
  return connectionState !== "Unavailable" && connectionState !== "Unknown";
}

function compareTimestamp(left: string, right: string) {
  const diff = Date.parse(left) - Date.parse(right);
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return left.localeCompare(right);
}

function clonePolicy(policy: ProjectBacklogSuggestionAcceptancePolicy): ProjectBacklogSuggestionAcceptancePolicy {
  return {
    ...policy,
    allowedPriorities: [...policy.allowedPriorities],
    requireNonDuplicate: true,
    requireValidStructuredSuggestion: true,
    createdTaskInitialStatus: "backlog",
    ...(policy.lastEvaluation ? {
      lastEvaluation: {
        ...policy.lastEvaluation,
        acceptedSuggestionIds: [...policy.lastEvaluation.acceptedSuggestionIds],
        skipped: policy.lastEvaluation.skipped.map((item) => ({ ...item })),
      },
    } : {}),
  };
}

function isPriority(value: unknown): value is ProjectBacklogPriority {
  return typeof value === "string" && PRIORITIES.includes(value as ProjectBacklogPriority);
}

function isBoundedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
