import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import type {
  ProjectBacklogCollection,
  ProjectBacklogCollections,
  ProjectBacklogMutationResult,
  ProjectBacklogPlanningStatus,
  ProjectBacklogPriority,
  ProjectBacklogSummary,
  ProjectBacklogTask,
} from "./ProjectBacklogTypes";

const STATUS_ATTENTION_ORDER: Record<ProjectBacklogPlanningStatus, number> = {
  ready: 0,
  blocked: 1,
  in_progress: 2,
  backlog: 3,
  completed: 4,
  cancelled: 5,
};

const PRIORITY_ORDER: Record<ProjectBacklogPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const PLANNING_STATUSES: readonly ProjectBacklogPlanningStatus[] = [
  "backlog",
  "ready",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];

const PRIORITIES: readonly ProjectBacklogPriority[] = ["low", "normal", "high", "urgent"];

export type ProjectBacklogServiceOptions = {
  now?: () => string;
  createId?: (projectId: string) => string;
};

export type ProjectBacklogProjectContext = {
  projectId: string;
  bindingId: string;
  buildingId: string;
  fallbackCompanyName: string;
  projects: ReadonlyArray<ProjectRegistryEntry>;
};

export class ProjectBacklogService {
  private readonly now: () => string;
  private readonly createId: (projectId: string) => string;
  private nextId = 1;

  constructor(options: ProjectBacklogServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? ((projectId) => `${projectId}:backlog:${this.nextId++}`);
  }

  canMutateProject(context: ProjectBacklogProjectContext): boolean {
    return this.resolveMutationProjectId(context).ok;
  }

  createTask(
    collections: ProjectBacklogCollections,
    context: ProjectBacklogProjectContext,
    input: {
      title: string;
      description: string;
      priority?: ProjectBacklogPriority;
    },
  ): ProjectBacklogMutationResult {
    const resolution = this.resolveMutationProjectId(context);
    if (!resolution.ok) return resolution;

    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || !description || (input.priority && !isPriority(input.priority))) {
      return { ok: false, reason: "InvalidInput" };
    }

    const timestamp = this.now();
    const task: ProjectBacklogTask = {
      id: this.createId(resolution.projectId),
      projectId: resolution.projectId,
      title,
      description,
      status: "backlog",
      priority: input.priority ?? "normal",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const collection = getCollection(collections, resolution.projectId);
    const updatedCollection = {
      projectId: resolution.projectId,
      tasks: this.orderTasks([...collection.tasks, task]),
    };
    collections[resolution.projectId] = cloneCollection(updatedCollection);
    return { ok: true, collection: cloneCollection(updatedCollection), task: { ...task } };
  }

  updateTask(
    collections: ProjectBacklogCollections,
    context: ProjectBacklogProjectContext,
    taskId: string,
    input: Partial<Pick<ProjectBacklogTask,
      | "title"
      | "description"
      | "priority"
      | "status"
      | "blockedReason"
      | "sourceBacklogTaskId"
      | "developmentRequestId"
      | "executionPreparationId"
      | "executionRunId"
      | "executionAcceptedAt"
    >>,
  ): ProjectBacklogMutationResult {
    const resolution = this.resolveMutationProjectId(context);
    if (!resolution.ok) return resolution;

    const collection = getCollection(collections, resolution.projectId);
    const taskIndex = collection.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex < 0) {
      return taskExistsOutsideProject(collections, resolution.projectId, taskId)
        ? { ok: false, reason: "ProjectMismatch" }
        : { ok: false, reason: "TaskNotFound" };
    }

    const existing = collection.tasks[taskIndex];
    if (existing.projectId !== resolution.projectId) return { ok: false, reason: "ProjectMismatch" };
    if (input.priority !== undefined && !isPriority(input.priority)) return { ok: false, reason: "InvalidInput" };
    if (input.status !== undefined && !isPlanningStatus(input.status)) return { ok: false, reason: "InvalidInput" };
    if (input.title !== undefined && input.title.trim().length === 0) return { ok: false, reason: "InvalidInput" };
    if (input.description !== undefined && input.description.trim().length === 0) return { ok: false, reason: "InvalidInput" };

    const updatedTask: ProjectBacklogTask = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sourceBacklogTaskId !== undefined ? { sourceBacklogTaskId: input.sourceBacklogTaskId } : {}),
      ...(input.developmentRequestId !== undefined ? { developmentRequestId: input.developmentRequestId } : {}),
      ...(input.executionPreparationId !== undefined ? { executionPreparationId: input.executionPreparationId } : {}),
      ...(input.executionRunId !== undefined ? { executionRunId: input.executionRunId } : {}),
      ...(input.executionAcceptedAt !== undefined ? { executionAcceptedAt: input.executionAcceptedAt } : {}),
      ...(input.blockedReason !== undefined && input.blockedReason.trim()
        ? { blockedReason: input.blockedReason.trim() }
        : {}),
      updatedAt: this.now(),
    };
    if (input.blockedReason !== undefined && !input.blockedReason.trim()) {
      delete updatedTask.blockedReason;
    }

    const updatedCollection = {
      projectId: resolution.projectId,
      tasks: this.orderTasks(collection.tasks.map((task, index) => index === taskIndex ? updatedTask : task)),
    };
    collections[resolution.projectId] = cloneCollection(updatedCollection);
    return { ok: true, collection: cloneCollection(updatedCollection), task: { ...updatedTask } };
  }

  getOrderedCollection(
    collections: ProjectBacklogCollections,
    projectId: string,
  ): ProjectBacklogCollection {
    const collection = getCollection(collections, projectId);
    return {
      projectId,
      tasks: this.orderTasks(collection.tasks.filter((task) => task.projectId === projectId)),
    };
  }

  orderTasks(tasks: ReadonlyArray<ProjectBacklogTask>): ProjectBacklogTask[] {
    return [...tasks].sort((left, right) => {
      const statusDiff = STATUS_ATTENTION_ORDER[left.status] - STATUS_ATTENTION_ORDER[right.status];
      if (statusDiff !== 0) return statusDiff;
      const priorityDiff = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
      if (priorityDiff !== 0) return priorityDiff;
      const updatedDiff = compareTimestamp(left.updatedAt, right.updatedAt);
      if (updatedDiff !== 0) return updatedDiff;
      const createdDiff = compareTimestamp(left.createdAt, right.createdAt);
      if (createdDiff !== 0) return createdDiff;
      return left.id.localeCompare(right.id);
    });
  }

  createSummary(collection: ProjectBacklogCollection | undefined, projectId: string): ProjectBacklogSummary {
    const tasks = collection?.tasks.filter((task) => task.projectId === projectId) ?? [];
    const readyTaskCount = tasks.filter((task) => task.status === "ready").length;
    const inDevelopmentTaskCount = tasks.filter((task) => task.status === "in_progress" && Boolean(task.executionRunId)).length;
    const executionBlockedTaskCount = tasks.filter((task) => task.status !== "blocked" && Boolean(task.executionRunId)).length;
    const blockedTaskCount = tasks.filter((task) => task.status === "blocked").length;
    const completedTaskCount = tasks.filter((task) => task.status === "completed").length;
    return {
      projectId,
      totalTaskCount: tasks.length,
      readyTaskCount,
      inDevelopmentTaskCount,
      executionBlockedTaskCount,
      blockedTaskCount,
      completedTaskCount,
      indicatorText: createIndicatorText(tasks.length, readyTaskCount, blockedTaskCount, inDevelopmentTaskCount),
      hasPlanningBlockedTasks: blockedTaskCount > 0,
      hasExecutionBlockedTasks: executionBlockedTaskCount > 0,
    };
  }

  cloneCollections(collections: ProjectBacklogCollections | undefined): ProjectBacklogCollections {
    return Object.fromEntries(
      Object.entries(collections ?? {})
        .filter(([, collection]) => isBacklogCollection(collection))
        .map(([projectId, collection]) => [projectId, cloneCollection({
          projectId,
          tasks: collection.tasks.filter((task) => task.projectId === projectId && isBacklogTask(task)),
        })]),
    );
  }

  private resolveMutationProjectId(context: ProjectBacklogProjectContext) {
    const resolved = new ProjectCompanyBindingService().resolveProjectBinding({
      bindingId: context.bindingId,
      buildingId: context.buildingId,
      projectId: context.projectId,
      fallbackCompanyName: context.fallbackCompanyName,
      projects: context.projects,
    });
    if (!resolved.project) return { ok: false as const, reason: "MissingProject" as const };
    if (resolved.status !== "bound") return { ok: false as const, reason: "UnavailableProject" as const };
    return { ok: true as const, projectId: resolved.projectId };
  }
}

export function isBacklogCollection(value: unknown): value is ProjectBacklogCollection {
  if (!isRecord(value)) return false;
  return typeof value.projectId === "string" && Array.isArray(value.tasks) && value.tasks.every(isBacklogTask);
}

export function isBacklogTask(value: unknown): value is ProjectBacklogTask {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isPlanningStatus(value.status) &&
    isPriority(value.priority) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.blockedReason === undefined || typeof value.blockedReason === "string") &&
    (value.sourceBacklogTaskId === undefined || typeof value.sourceBacklogTaskId === "string") &&
    (value.developmentRequestId === undefined || typeof value.developmentRequestId === "string") &&
    (value.executionPreparationId === undefined || typeof value.executionPreparationId === "string") &&
    (value.executionRunId === undefined || typeof value.executionRunId === "string") &&
    (value.executionAcceptedAt === undefined || typeof value.executionAcceptedAt === "string")
  );
}

function getCollection(collections: ProjectBacklogCollections, projectId: string): ProjectBacklogCollection {
  return cloneCollection(collections[projectId] ?? { projectId, tasks: [] });
}

function taskExistsOutsideProject(collections: ProjectBacklogCollections, projectId: string, taskId: string) {
  return Object.values(collections).some((collection) => (
    collection.projectId !== projectId &&
    collection.tasks.some((task) => task.id === taskId)
  ));
}

function createIndicatorText(total: number, ready: number, blocked: number, inDevelopment: number) {
  if (blocked > 0) return `${blocked} Blocked ${blocked === 1 ? "task" : "tasks"}`;
  if (inDevelopment > 0) return `${inDevelopment} In development`;
  if (ready > 0) return `${ready} Ready`;
  if (total > 0) return `${total} Planned`;
  return "No planned tasks";
}

function isPlanningStatus(value: unknown): value is ProjectBacklogPlanningStatus {
  return typeof value === "string" && PLANNING_STATUSES.includes(value as ProjectBacklogPlanningStatus);
}

function isPriority(value: unknown): value is ProjectBacklogPriority {
  return typeof value === "string" && PRIORITIES.includes(value as ProjectBacklogPriority);
}

function compareTimestamp(left: string, right: string) {
  const diff = Date.parse(left) - Date.parse(right);
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return left.localeCompare(right);
}

function cloneCollection(collection: ProjectBacklogCollection): ProjectBacklogCollection {
  return {
    projectId: collection.projectId,
    tasks: collection.tasks.map((task) => ({ ...task })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
