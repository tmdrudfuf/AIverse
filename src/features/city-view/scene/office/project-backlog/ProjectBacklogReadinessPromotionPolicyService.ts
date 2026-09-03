import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectBacklogProjectContext, ProjectBacklogService } from "./ProjectBacklogService";
import { isBacklogTask } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type {
  ProjectBacklogReadinessDuplicateState,
  ProjectBacklogReadinessOrigin,
  ProjectBacklogReadinessPromotionEvaluationResult,
  ProjectBacklogReadinessPromotionPolicies,
  ProjectBacklogReadinessPromotionPolicy,
  ProjectBacklogReadinessPromotionReason,
  ProjectBacklogReadinessPromotionSkip,
} from "./ProjectBacklogReadinessPromotionPolicyTypes";

const PRIORITIES: readonly ProjectBacklogPriority[] = ["low", "normal", "high", "urgent"];
const DEFAULT_ALLOWED_PRIORITIES: readonly ProjectBacklogPriority[] = ["high"];
const ORIGINS: readonly ProjectBacklogReadinessOrigin[] = [
  "operator-created",
  "ai-suggestion-manual",
  "ai-suggestion-automatic",
];
const DEFAULT_ALLOWED_ORIGINS: readonly ProjectBacklogReadinessOrigin[] = ORIGINS;
const MAX_PROMOTIONS_PER_EVALUATION = 5;
const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1200;

export type ProjectBacklogReadinessPromotionPolicyPatch = Partial<Pick<
  ProjectBacklogReadinessPromotionPolicy,
  "enabled" | "allowedPriorities" | "allowedOrigins" | "maxPromotionsPerEvaluation" | "requireNoActiveExecution"
>>;

export type EvaluateAndPromoteProjectBacklogReadinessInput = {
  policies: ProjectBacklogReadinessPromotionPolicies | undefined;
  project: ProjectPortalProject | undefined;
  context: ProjectBacklogProjectContext | undefined;
  backlogCollections: ProjectBacklogCollections;
  backlogService: ProjectBacklogService;
} & ProjectBacklogReadinessDuplicateState;

export class ProjectBacklogReadinessPromotionPolicyService {
  private readonly now: () => string;

  constructor(options: { now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  createDefaultPolicy(projectId: string): ProjectBacklogReadinessPromotionPolicy {
    return {
      projectId,
      enabled: false,
      allowedPriorities: [...DEFAULT_ALLOWED_PRIORITIES],
      allowedOrigins: [...DEFAULT_ALLOWED_ORIGINS],
      maxPromotionsPerEvaluation: 1,
      requireNoActiveExecution: true,
      requireValidTask: true,
      requireNonDuplicate: true,
      updatedAt: this.now(),
      updatedByOperator: false,
    };
  }

  getPolicy(
    policies: ProjectBacklogReadinessPromotionPolicies | undefined,
    projectId: string,
  ): ProjectBacklogReadinessPromotionPolicy {
    const policy = policies?.[projectId];
    return isProjectBacklogReadinessPromotionPolicy(policy) && policy.projectId === projectId
      ? clonePolicy(policy)
      : this.createDefaultPolicy(projectId);
  }

  updatePolicy(
    policies: ProjectBacklogReadinessPromotionPolicies,
    context: ProjectBacklogProjectContext | undefined,
    patch: ProjectBacklogReadinessPromotionPolicyPatch,
  ) {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const existing = this.getPolicy(policies, resolution.projectId);
    const allowedPriorities = patch.allowedPriorities !== undefined
      ? normalizePriorities(patch.allowedPriorities)
      : existing.allowedPriorities;
    const allowedOrigins = patch.allowedOrigins !== undefined
      ? normalizeOrigins(patch.allowedOrigins)
      : existing.allowedOrigins;
    const enabled = patch.enabled !== undefined ? Boolean(patch.enabled) : existing.enabled;
    const policy: ProjectBacklogReadinessPromotionPolicy = {
      ...existing,
      enabled: enabled && allowedPriorities.length > 0 && allowedOrigins.length > 0,
      allowedPriorities,
      allowedOrigins,
      maxPromotionsPerEvaluation: normalizeMaxPromotions(
        patch.maxPromotionsPerEvaluation ?? existing.maxPromotionsPerEvaluation,
      ),
      requireNoActiveExecution: patch.requireNoActiveExecution !== undefined
        ? Boolean(patch.requireNoActiveExecution)
        : existing.requireNoActiveExecution,
      requireValidTask: true,
      requireNonDuplicate: true,
      updatedAt: this.now(),
      updatedByOperator: true,
    };
    policies[resolution.projectId] = clonePolicy(policy);
    return { ok: true as const, policy: clonePolicy(policy) };
  }

  evaluateAndPromote(
    input: EvaluateAndPromoteProjectBacklogReadinessInput,
  ): ProjectBacklogReadinessPromotionEvaluationResult {
    const projectId = input.project?.id ?? input.context?.projectId ?? "";
    const policy = this.getPolicy(input.policies, projectId);
    const evaluatedAt = this.now();
    const activeExecutionCount = countActiveExecutions(input.activeRunStatus, input.activeExecutions);
    const closed = (reason: ProjectBacklogReadinessPromotionReason) => this.createResult(
      projectId,
      policy,
      [],
      collectSkips(input.backlogCollections, projectId, reason),
      evaluatedAt,
      activeExecutionCount,
    );

    if (!input.project || !input.context) return closed("ProjectMissing");
    if (!input.project.enabled) return closed("ProjectUnavailable");
    if (!isProjectConnected(input.project)) return closed("ProjectDisconnected");
    const resolution = this.resolveProjectId(input.context);
    if (!resolution.ok) return closed(resolution.reason);
    if (resolution.projectId !== input.project.id || resolution.projectId !== policy.projectId) return closed("ProjectMismatch");
    if (!policy.enabled) return closed("PolicyDisabled");
    if (policy.requireNoActiveExecution && activeExecutionCount > 0) return closed("ActiveExecutionExists");

    const collection = input.backlogCollections[projectId];
    const tasks = collection?.projectId === projectId ? collection.tasks : [];
    const duplicateWork = createDuplicateWorkSet(projectId, tasks, input);
    const eligible: ProjectBacklogTask[] = [];
    const skipped: ProjectBacklogReadinessPromotionSkip[] = [];

    for (const candidate of tasks) {
      const reason = this.getIneligibilityReason(candidate, projectId, policy, duplicateWork);
      if (reason) {
        skipped.push(toSkip(candidate, reason));
        continue;
      }
      eligible.push(candidate);
    }

    if (eligible.length === 0) {
      return this.createResult(projectId, policy, [], skipped.length ? skipped : [], evaluatedAt, activeExecutionCount);
    }

    const promoted = [];
    const ordered = orderEligibleTasks(eligible, policy.allowedPriorities);
    const limit = policy.maxPromotionsPerEvaluation;
    for (const task of ordered.slice(0, limit)) {
      const result = input.backlogService.updateTask(input.backlogCollections, input.context, task.id, { status: "ready" });
      if (result.ok) {
        promoted.push({
          task: result.task,
          reason: `Promoted: ${result.task.priority} priority allowed`,
        });
        duplicateWork.add(normalizeWorkText(result.task.title));
      } else {
        skipped.push(toSkip(task, "PromotionFailed"));
      }
    }
    for (const task of ordered.slice(limit)) {
      skipped.push(toSkip(task, "BoundedLimitReached"));
    }

    return this.createResult(projectId, policy, promoted, skipped, evaluatedAt, activeExecutionCount);
  }

  recordEvaluation(
    policies: ProjectBacklogReadinessPromotionPolicies,
    result: ProjectBacklogReadinessPromotionEvaluationResult,
  ): ProjectBacklogReadinessPromotionPolicy {
    const policy = this.getPolicy(policies, result.projectId);
    if (!policy.updatedByOperator && !policy.enabled) return policy;
    const recorded: ProjectBacklogReadinessPromotionPolicy = {
      ...policy,
      lastEvaluation: {
        evaluatedAt: result.evaluatedAt,
        promotedCount: result.promoted.length,
        skippedCount: result.skipped.length,
        latestResultText: result.latestResultText,
        promotedTaskIds: result.promoted.map((item) => item.task.id),
        skipped: result.skipped.map((item) => ({ ...item })),
      },
    };
    policies[result.projectId] = clonePolicy(recorded);
    return clonePolicy(recorded);
  }

  clonePolicies(
    policies: ProjectBacklogReadinessPromotionPolicies | undefined,
  ): ProjectBacklogReadinessPromotionPolicies {
    return Object.fromEntries(
      Object.entries(policies ?? {})
        .filter(([projectId, policy]) => isProjectBacklogReadinessPromotionPolicy(policy) && policy.projectId === projectId)
        .map(([projectId, policy]) => [projectId, clonePolicy(policy)]),
    );
  }

  private getIneligibilityReason(
    task: ProjectBacklogTask,
    projectId: string,
    policy: ProjectBacklogReadinessPromotionPolicy,
    duplicateWork: ReadonlySet<string>,
  ): ProjectBacklogReadinessPromotionReason | undefined {
    if (!isBacklogTask(task) || !isValidTaskContent(task)) return "TaskInvalid";
    if (task.projectId !== projectId || task.projectId !== policy.projectId) return "ProjectMismatch";
    if (task.status !== "backlog") return task.status === "ready" ? "AlreadyPromoted" : "TaskNotBacklog";
    if (!isFreshTask(task)) return "TaskStale";
    if (policy.allowedPriorities.length === 0 || !policy.allowedPriorities.includes(task.priority)) return "PriorityNotAllowed";
    const origin = getTaskOrigin(task);
    if (!origin || !policy.allowedOrigins.includes(origin)) return "OriginNotAllowed";
    if (duplicateWork.has(normalizeWorkText(task.title))) return "DuplicateReadyOrActiveWork";
    return undefined;
  }

  private createResult(
    projectId: string,
    policy: ProjectBacklogReadinessPromotionPolicy,
    promoted: ProjectBacklogReadinessPromotionEvaluationResult["promoted"],
    skipped: ProjectBacklogReadinessPromotionSkip[],
    evaluatedAt: string,
    activeExecutionCount: number,
  ): ProjectBacklogReadinessPromotionEvaluationResult {
    const latestResultText = promoted.length > 0
      ? promoted[0].reason
      : skipped[0]
        ? `Skipped: ${formatReason(skipped[0].reason)}`
        : policy.enabled
          ? "No eligible backlog task"
          : "Skipped: policy disabled";
    return {
      projectId,
      policy: clonePolicy(policy),
      promoted,
      skipped,
      evaluatedAt,
      latestResultText,
      activeExecutionCount,
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

export function isProjectBacklogReadinessPromotionPolicy(
  value: unknown,
): value is ProjectBacklogReadinessPromotionPolicy {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.projectId) &&
    typeof value.enabled === "boolean" &&
    Array.isArray(value.allowedPriorities) &&
    value.allowedPriorities.every(isPriority) &&
    Array.isArray(value.allowedOrigins) &&
    value.allowedOrigins.every(isOrigin) &&
    Number.isInteger(value.maxPromotionsPerEvaluation) &&
    Number(value.maxPromotionsPerEvaluation) >= 1 &&
    Number(value.maxPromotionsPerEvaluation) <= MAX_PROMOTIONS_PER_EVALUATION &&
    typeof value.requireNoActiveExecution === "boolean" &&
    value.requireValidTask === true &&
    value.requireNonDuplicate === true &&
    typeof value.updatedAt === "string" &&
    typeof value.updatedByOperator === "boolean" &&
    (value.lastEvaluation === undefined || isRecord(value.lastEvaluation))
  );
}

function createDuplicateWorkSet(
  projectId: string,
  tasks: ReadonlyArray<ProjectBacklogTask>,
  input: Pick<EvaluateAndPromoteProjectBacklogReadinessInput, "developmentDrafts">,
) {
  const activeDraftTaskIds = new Set(
    Object.values(input.developmentDrafts ?? {})
      .filter((draft) => draft.projectId === projectId && draft.status !== "Completed")
      .map((draft) => draft.sourceBacklogTaskId)
      .filter((value): value is string => Boolean(value)),
  );
  return new Set(
    tasks
      .filter((task) => (
        task.status === "ready" ||
        task.status === "in_progress" ||
        Boolean(task.developmentRequestId) ||
        Boolean(task.executionPreparationId) ||
        Boolean(task.executionRunId) ||
        activeDraftTaskIds.has(task.id)
      ))
      .map((task) => normalizeWorkText(task.title)),
  );
}

function collectSkips(
  collections: ProjectBacklogCollections,
  projectId: string,
  reason: ProjectBacklogReadinessPromotionReason,
) {
  return (collections[projectId]?.tasks ?? [])
    .filter((task) => task.projectId === projectId)
    .map((task) => toSkip(task, reason));
}

function toSkip(
  task: Pick<ProjectBacklogTask, "id" | "title">,
  reason: ProjectBacklogReadinessPromotionReason,
): ProjectBacklogReadinessPromotionSkip {
  return { taskId: task.id, title: task.title, reason };
}

function orderEligibleTasks(
  tasks: ReadonlyArray<ProjectBacklogTask>,
  allowedPriorities: ReadonlyArray<ProjectBacklogPriority>,
) {
  return [...tasks].sort((left, right) => {
    const priorityDiff = getPriorityRank(left.priority, allowedPriorities) - getPriorityRank(right.priority, allowedPriorities);
    if (priorityDiff !== 0) return priorityDiff;
    const createdDiff = compareTimestamp(left.createdAt, right.createdAt);
    if (createdDiff !== 0) return createdDiff;
    return left.id.localeCompare(right.id);
  });
}

function getPriorityRank(priority: ProjectBacklogPriority, allowedPriorities: ReadonlyArray<ProjectBacklogPriority>) {
  const index = allowedPriorities.indexOf(priority);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function getTaskOrigin(task: ProjectBacklogTask): ProjectBacklogReadinessOrigin | undefined {
  if (!task.sourceSuggestionId) return "operator-created";
  if (task.suggestionAcceptanceMode === "manual") return "ai-suggestion-manual";
  if (task.suggestionAcceptanceMode === "automatic") return "ai-suggestion-automatic";
  return undefined;
}

function countActiveExecutions(
  runStatus: EvaluateAndPromoteProjectBacklogReadinessInput["activeRunStatus"],
  executions: EvaluateAndPromoteProjectBacklogReadinessInput["activeExecutions"],
) {
  const statusActive = runStatus && (
    runStatus.stage === "Prepared" ||
    runStatus.stage === "Started" ||
    runStatus.stage === "Blocked" ||
    runStatus.stage === "TimedOut"
  ) ? 1 : 0;
  const executionCount = (executions ?? []).filter((execution) => (
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

function isProjectConnected(project: ProjectPortalProject) {
  if (!project.localRepositoryBinding) return false;
  const connectionState = project.repositoryIdentity?.connectionState;
  return connectionState !== "Unavailable" && connectionState !== "Unknown";
}

function normalizePriorities(values: ReadonlyArray<ProjectBacklogPriority>) {
  return PRIORITIES.filter((priority) => values.includes(priority));
}

function normalizeOrigins(values: ReadonlyArray<ProjectBacklogReadinessOrigin>) {
  return ORIGINS.filter((origin) => values.includes(origin));
}

function normalizeMaxPromotions(value: number) {
  return Number.isFinite(value)
    ? Math.min(Math.max(Math.floor(value), 1), MAX_PROMOTIONS_PER_EVALUATION)
    : 1;
}

function isValidTaskContent(task: ProjectBacklogTask) {
  return (
    isBoundedString(task.id, MAX_TITLE_LENGTH) &&
    isBoundedString(task.projectId, MAX_TITLE_LENGTH) &&
    isBoundedString(task.title, MAX_TITLE_LENGTH) &&
    isBoundedString(task.description, MAX_DESCRIPTION_LENGTH) &&
    isPriority(task.priority)
  );
}

function isFreshTask(task: ProjectBacklogTask) {
  return Number.isFinite(Date.parse(task.createdAt)) && Number.isFinite(Date.parse(task.updatedAt));
}

function normalizeWorkText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function formatReason(reason: ProjectBacklogReadinessPromotionReason) {
  return reason.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function isPriority(value: unknown): value is ProjectBacklogPriority {
  return typeof value === "string" && PRIORITIES.includes(value as ProjectBacklogPriority);
}

function isOrigin(value: unknown): value is ProjectBacklogReadinessOrigin {
  return typeof value === "string" && ORIGINS.includes(value as ProjectBacklogReadinessOrigin);
}

function isBoundedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function compareTimestamp(left: string, right: string) {
  const diff = Date.parse(left) - Date.parse(right);
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return left.localeCompare(right);
}

function clonePolicy(policy: ProjectBacklogReadinessPromotionPolicy): ProjectBacklogReadinessPromotionPolicy {
  return {
    ...policy,
    allowedPriorities: [...policy.allowedPriorities],
    allowedOrigins: [...policy.allowedOrigins],
    requireValidTask: true,
    requireNonDuplicate: true,
    ...(policy.lastEvaluation ? {
      lastEvaluation: {
        ...policy.lastEvaluation,
        promotedTaskIds: [...policy.lastEvaluation.promotedTaskIds],
        skipped: policy.lastEvaluation.skipped.map((item) => ({ ...item })),
      },
    } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}
