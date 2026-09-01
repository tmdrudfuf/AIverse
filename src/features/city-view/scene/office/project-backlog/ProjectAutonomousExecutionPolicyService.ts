import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectBacklogProjectContext } from "./ProjectBacklogService";
import type { ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type {
  ProjectAutonomyEvaluationResult,
  ProjectAutonomyPolicies,
  ProjectAutonomyPolicy,
  ProjectAutonomyReason,
} from "./ProjectAutonomousExecutionPolicyTypes";

const PRIORITIES: readonly ProjectBacklogPriority[] = ["low", "normal", "high", "urgent"];
const PRIORITY_RANK: Record<ProjectBacklogPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export type ProjectAutonomyPolicyPatch = Partial<Pick<
  ProjectAutonomyPolicy,
  "enabled" | "allowedPriorities" | "maxConcurrentExecutions" | "requireNoActiveRun"
>>;

export type EvaluateProjectAutonomyInput = {
  policies: ProjectAutonomyPolicies | undefined;
  project: ProjectPortalProject | undefined;
  context: ProjectBacklogProjectContext | undefined;
  tasks: ReadonlyArray<ProjectBacklogTask>;
  activeRunStatus?: ExternalProjectAdosRunStatus;
  activeExecutions?: ReadonlyArray<ExternalProjectAdosExecution>;
  executionAvailable?: boolean;
};

export class ProjectAutonomousExecutionPolicyService {
  private readonly now: () => string;

  constructor(options: { now?: () => string } = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
  }

  createDefaultPolicy(projectId: string): ProjectAutonomyPolicy {
    return {
      projectId,
      enabled: false,
      allowedPriorities: [],
      maxConcurrentExecutions: 1,
      requireNoActiveRun: true,
      allowedTaskStatuses: ["ready"],
      updatedAt: this.now(),
      updatedByOperator: false,
    };
  }

  getPolicy(policies: ProjectAutonomyPolicies | undefined, projectId: string): ProjectAutonomyPolicy {
    const policy = policies?.[projectId];
    return isProjectAutonomyPolicy(policy) && policy.projectId === projectId
      ? clonePolicy(policy)
      : this.createDefaultPolicy(projectId);
  }

  updatePolicy(
    policies: ProjectAutonomyPolicies,
    context: ProjectBacklogProjectContext | undefined,
    patch: ProjectAutonomyPolicyPatch,
  ) {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const existing = this.getPolicy(policies, resolution.projectId);
    const allowedPriorities = patch.allowedPriorities !== undefined
      ? normalizePriorities(patch.allowedPriorities)
      : existing.allowedPriorities;
    const enabled = patch.enabled !== undefined ? Boolean(patch.enabled) : existing.enabled;
    const nextPolicy: ProjectAutonomyPolicy = {
      ...existing,
      enabled: enabled && allowedPriorities.length > 0,
      allowedPriorities,
      ...(patch.maxConcurrentExecutions !== undefined
        ? { maxConcurrentExecutions: normalizeConcurrency(patch.maxConcurrentExecutions) }
        : {}),
      ...(patch.requireNoActiveRun !== undefined ? { requireNoActiveRun: Boolean(patch.requireNoActiveRun) } : {}),
      allowedTaskStatuses: ["ready"],
      updatedAt: this.now(),
      updatedByOperator: true,
    };
    policies[resolution.projectId] = clonePolicy(nextPolicy);
    return { ok: true as const, policy: clonePolicy(nextPolicy) };
  }

  evaluate(input: EvaluateProjectAutonomyInput): ProjectAutonomyEvaluationResult {
    const projectId = input.project?.id ?? input.context?.projectId ?? "";
    const policy = this.getPolicy(input.policies, projectId);
    const activeExecutionCount = countActiveExecutions(input.activeRunStatus, input.activeExecutions);

    const closed = (state: ProjectAutonomyEvaluationResult["state"], reason: ProjectAutonomyReason) => ({
      projectId,
      policy: { ...policy, lastEvaluationReason: reason },
      state,
      reason,
      eligibleTaskCount: 0,
      activeExecutionCount,
    });

    if (!input.project || !input.context) return closed("off", "ProjectMissing");
    if (!input.project.enabled) return closed("off", "ProjectUnavailable");
    if (!isProjectConnected(input.project)) return closed("off", "ProjectDisconnected");

    const resolution = this.resolveProjectId(input.context);
    if (!resolution.ok) return closed("off", resolution.reason);
    if (resolution.projectId !== input.project.id) return closed("off", "ProjectMismatch");
    if (!policy.enabled) return closed("off", "PolicyDisabled");
    if (input.executionAvailable === false) return closed("blocked", "ExecutionUnavailable");
    if (policy.requireNoActiveRun && activeExecutionCount > 0) return closed("blocked", "ActiveRunExists");
    if (activeExecutionCount >= policy.maxConcurrentExecutions) return closed("blocked", "ConcurrencyLimitReached");

    const tasks = input.tasks.filter((task) => task.projectId === input.project!.id);
    const eligible = tasks.filter((task) => this.getTaskIneligibilityReason(task, policy) === undefined);
    if (eligible.length === 0) {
      return closed("waiting", this.getNoEligibleReason(tasks, policy));
    }

    return {
      projectId,
      policy,
      state: "eligible",
      selectedTask: orderEligibleTasks(eligible)[0],
      eligibleTaskCount: eligible.length,
      activeExecutionCount,
    };
  }

  clonePolicies(policies: ProjectAutonomyPolicies | undefined): ProjectAutonomyPolicies {
    return Object.fromEntries(
      Object.entries(policies ?? {})
        .filter(([projectId, policy]) => isProjectAutonomyPolicy(policy) && policy.projectId === projectId)
        .map(([projectId, policy]) => [projectId, clonePolicy(policy)]),
    );
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

  private getTaskIneligibilityReason(task: ProjectBacklogTask, policy: ProjectAutonomyPolicy): ProjectAutonomyReason | undefined {
    if (!policy.allowedTaskStatuses.includes("ready") || task.status !== "ready") return "TaskNotReady";
    if (!task.title.trim() || !task.description.trim()) return "TaskContentMissing";
    if (task.developmentRequestId || task.executionPreparationId || task.executionRunId || task.executionAcceptedAt) {
      return "TaskAlreadyAssociated";
    }
    if (policy.allowedPriorities.length === 0 || !policy.allowedPriorities.includes(task.priority)) {
      return "PriorityNotAllowed";
    }
    return undefined;
  }

  private getNoEligibleReason(tasks: ReadonlyArray<ProjectBacklogTask>, policy: ProjectAutonomyPolicy): ProjectAutonomyReason {
    if (tasks.length === 0) return "NoEligibleReadyTask";
    const reasons = tasks.map((task) => this.getTaskIneligibilityReason(task, policy));
    if (reasons.every((reason) => reason === "TaskNotReady")) return "TaskNotReady";
    if (reasons.every((reason) => reason === "PriorityNotAllowed" || reason === "TaskNotReady")) return "PriorityNotAllowed";
    if (reasons.some((reason) => reason === "TaskContentMissing")) return "TaskContentMissing";
    if (reasons.some((reason) => reason === "TaskAlreadyAssociated")) return "TaskAlreadyAssociated";
    return "NoEligibleReadyTask";
  }
}

export function isProjectAutonomyPolicy(value: unknown): value is ProjectAutonomyPolicy {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.projectId) &&
    typeof value.enabled === "boolean" &&
    Array.isArray(value.allowedPriorities) &&
    value.allowedPriorities.every(isPriority) &&
    value.maxConcurrentExecutions === 1 &&
    value.requireNoActiveRun === true &&
    Array.isArray(value.allowedTaskStatuses) &&
    value.allowedTaskStatuses.length === 1 &&
    value.allowedTaskStatuses[0] === "ready" &&
    typeof value.updatedAt === "string" &&
    typeof value.updatedByOperator === "boolean" &&
    (value.lastEvaluationReason === undefined || typeof value.lastEvaluationReason === "string")
  );
}

function orderEligibleTasks(tasks: ReadonlyArray<ProjectBacklogTask>) {
  return [...tasks].sort((left, right) => {
    const priorityDiff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const readyDiff = compareTimestamp(left.updatedAt, right.updatedAt);
    if (readyDiff !== 0) return readyDiff;
    return left.id.localeCompare(right.id);
  });
}

function countActiveExecutions(
  runStatus: ExternalProjectAdosRunStatus | undefined,
  executions: ReadonlyArray<ExternalProjectAdosExecution> | undefined,
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

function normalizeConcurrency(value: number) {
  return Number.isFinite(value) && value >= 1 ? 1 : 1;
}

function isPriority(value: unknown): value is ProjectBacklogPriority {
  return typeof value === "string" && PRIORITIES.includes(value as ProjectBacklogPriority);
}

function clonePolicy(policy: ProjectAutonomyPolicy): ProjectAutonomyPolicy {
  return {
    ...policy,
    allowedPriorities: [...policy.allowedPriorities],
    allowedTaskStatuses: ["ready"],
  };
}

function compareTimestamp(left: string, right: string) {
  const diff = Date.parse(left) - Date.parse(right);
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return left.localeCompare(right);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}
