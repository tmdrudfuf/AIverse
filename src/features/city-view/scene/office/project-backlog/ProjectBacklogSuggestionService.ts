import { ProjectCompanyBindingService } from "../project-company-binding/ProjectCompanyBindingService";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import { ProjectBacklogService } from "./ProjectBacklogService";
import type {
  ProjectBacklogCollections,
  ProjectBacklogPriority,
  ProjectBacklogTask,
} from "./ProjectBacklogTypes";
import type {
  ProjectBacklogSuggestionCandidate,
  ProjectBacklogSuggestionCollection,
  ProjectBacklogSuggestionCollections,
  ProjectBacklogSuggestionGenerationResult,
  ProjectBacklogSuggestionPromptContext,
  ProjectBacklogSuggestionProvider,
  ProjectBacklogSuggestionProviderCandidate,
  ProjectBacklogSuggestionReviewResult,
} from "./ProjectBacklogSuggestionTypes";

const PRIORITIES: readonly ProjectBacklogPriority[] = ["low", "normal", "high", "urgent"];

export type ProjectBacklogSuggestionProjectContext = {
  projectId: string;
  bindingId: string;
  buildingId: string;
  fallbackCompanyName: string;
  projects: ReadonlyArray<ProjectRegistryEntry>;
};

export type ProjectBacklogSuggestionContextInput = {
  backlogCollections: ProjectBacklogCollections;
  activeWork?: string[];
  blockedWork?: string[];
  developmentRequests?: string[];
  repositorySummary?: string;
};

export type ProjectBacklogSuggestionServiceOptions = {
  now?: () => string;
  createId?: (projectId: string) => string;
  backlogService?: ProjectBacklogService;
};

export class ProjectBacklogSuggestionService {
  private readonly now: () => string;
  private readonly createId: (projectId: string) => string;
  private readonly backlogService: ProjectBacklogService;
  private nextId = 1;

  constructor(options: ProjectBacklogSuggestionServiceOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.createId = options.createId ?? ((projectId) => `${projectId}:suggestion:${this.nextId++}`);
    this.backlogService = options.backlogService ?? new ProjectBacklogService();
  }

  async generateSuggestions(
    collections: ProjectBacklogSuggestionCollections,
    context: ProjectBacklogSuggestionProjectContext,
    input: ProjectBacklogSuggestionContextInput,
    provider: ProjectBacklogSuggestionProvider,
    maxSuggestions = 3,
  ): Promise<ProjectBacklogSuggestionGenerationResult> {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const promptContext = this.createPromptContext(resolution.project, resolution.projectId, collections, input);
    const providerCandidates = await provider.generateSuggestions(promptContext, Math.max(1, maxSuggestions));
    if (!Array.isArray(providerCandidates)) return { ok: false, reason: "InvalidProviderOutput" };

    const existingKeys = new Set([
      ...promptContext.backlog.map((task) => createDuplicateKey(task.title, task.description)),
      ...getCollection(collections, resolution.projectId).candidates
        .filter((candidate) => candidate.status === "accepted" || candidate.status === "rejected")
        .map((candidate) => createDuplicateKey(candidate.title, candidate.description)),
    ]);
    const seenKeys = new Set(existingKeys);
    const timestamp = this.now();
    const sourceContextSummary = createSourceContextSummary(promptContext);
    const candidates: ProjectBacklogSuggestionCandidate[] = [];

    for (const providerCandidate of providerCandidates) {
      const candidate = this.toCandidate(providerCandidate, resolution.projectId, timestamp, sourceContextSummary);
      if (!candidate) continue;
      const key = createDuplicateKey(candidate.title, candidate.description);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      candidates.push(candidate);
      if (candidates.length >= maxSuggestions) break;
    }

    if (!candidates.length) return { ok: false, reason: "NoCandidates" };

    const previous = getCollection(collections, resolution.projectId);
    const retained = previous.candidates.filter((candidate) => candidate.status !== "proposed");
    const collection = {
      projectId: resolution.projectId,
      candidates: [...retained, ...candidates],
    };
    collections[resolution.projectId] = cloneCollection(collection);
    return {
      ok: true,
      collection: cloneCollection(collection),
      candidates: candidates.map((candidate) => ({ ...candidate })),
      promptContext,
    };
  }

  acceptSuggestion(
    suggestionCollections: ProjectBacklogSuggestionCollections,
    backlogCollections: ProjectBacklogCollections,
    context: ProjectBacklogSuggestionProjectContext,
    suggestionId: string,
    input: {
      title?: string;
      description?: string;
      priority?: ProjectBacklogPriority;
    } = {},
  ): ProjectBacklogSuggestionReviewResult {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const collection = getCollection(suggestionCollections, resolution.projectId);
    const index = collection.candidates.findIndex((candidate) => candidate.id === suggestionId);
    if (index < 0) {
      return suggestionExistsOutsideProject(suggestionCollections, resolution.projectId, suggestionId)
        ? { ok: false, reason: "ProjectMismatch" }
        : { ok: false, reason: "SuggestionNotFound" };
    }

    const suggestion = collection.candidates[index];
    if (suggestion.projectId !== resolution.projectId) return { ok: false, reason: "ProjectMismatch" };
    if (suggestion.status === "accepted") return { ok: false, reason: "AlreadyAccepted" };

    const title = input.title?.trim() ?? suggestion.title;
    const description = input.description?.trim() ?? suggestion.description;
    const priority = input.priority ?? suggestion.suggestedPriority ?? "normal";
    if (!title || !description || !isPriority(priority)) return { ok: false, reason: "InvalidInput" };

    const duplicateKey = createDuplicateKey(title, description);
    const existingTask = this.backlogService
      .getOrderedCollection(backlogCollections, resolution.projectId)
      .tasks.find((task) => createDuplicateKey(task.title, task.description) === duplicateKey);
    if (existingTask) {
      const updatedCollection = this.updateSuggestion(collection, index, {
        ...suggestion,
        title,
        description,
        suggestedPriority: priority,
        status: "accepted",
        acceptedBacklogTaskId: existingTask.id,
        updatedAt: this.now(),
      });
      suggestionCollections[resolution.projectId] = cloneCollection(updatedCollection);
      return {
        ok: true,
        collection: cloneCollection(updatedCollection),
        suggestion: { ...updatedCollection.candidates[index] },
        task: { ...existingTask },
      };
    }

    const taskResult = this.backlogService.createTask(backlogCollections, context, {
      title,
      description,
      priority,
    });
    if (!taskResult.ok) {
      return {
        ok: false,
        reason: taskResult.reason === "TaskNotFound" ? "InvalidInput" : taskResult.reason,
      };
    }

    const updatedCollection = this.updateSuggestion(collection, index, {
      ...suggestion,
      title,
      description,
      suggestedPriority: priority,
      status: "accepted",
      acceptedBacklogTaskId: taskResult.task.id,
      updatedAt: this.now(),
    });
    suggestionCollections[resolution.projectId] = cloneCollection(updatedCollection);
    return {
      ok: true,
      collection: cloneCollection(updatedCollection),
      suggestion: { ...updatedCollection.candidates[index] },
      task: { ...taskResult.task },
    };
  }

  rejectSuggestion(
    collections: ProjectBacklogSuggestionCollections,
    context: ProjectBacklogSuggestionProjectContext,
    suggestionId: string,
  ): ProjectBacklogSuggestionReviewResult {
    const resolution = this.resolveProjectId(context);
    if (!resolution.ok) return resolution;

    const collection = getCollection(collections, resolution.projectId);
    const index = collection.candidates.findIndex((candidate) => candidate.id === suggestionId);
    if (index < 0) {
      return suggestionExistsOutsideProject(collections, resolution.projectId, suggestionId)
        ? { ok: false, reason: "ProjectMismatch" }
        : { ok: false, reason: "SuggestionNotFound" };
    }

    const suggestion = collection.candidates[index];
    if (suggestion.projectId !== resolution.projectId) return { ok: false, reason: "ProjectMismatch" };
    const updatedCollection = this.updateSuggestion(collection, index, {
      ...suggestion,
      status: "rejected",
      updatedAt: this.now(),
    });
    collections[resolution.projectId] = cloneCollection(updatedCollection);
    return {
      ok: true,
      collection: cloneCollection(updatedCollection),
      suggestion: { ...updatedCollection.candidates[index] },
    };
  }

  createPromptContext(
    project: ProjectRegistryEntry,
    projectId: string,
    suggestionCollections: ProjectBacklogSuggestionCollections,
    input: ProjectBacklogSuggestionContextInput,
  ): ProjectBacklogSuggestionPromptContext {
    const backlog = this.backlogService
      .getOrderedCollection(input.backlogCollections, projectId)
      .tasks
      .filter((task) => task.projectId === projectId)
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
      }));
    return {
      projectId,
      projectName: project.displayName,
      projectStatus: project.lifecycleStatus,
      projectType: project.projectType,
      ownerCompany: project.owner.companyName,
      repositorySummary: input.repositorySummary,
      backlog,
      activeWork: [...(input.activeWork ?? [])],
      blockedWork: [...(input.blockedWork ?? [])],
      developmentRequests: [...(input.developmentRequests ?? [])],
      rejectedSuggestionTitles: getCollection(suggestionCollections, projectId).candidates
        .filter((candidate) => candidate.status === "rejected")
        .map((candidate) => candidate.title),
    };
  }

  cloneCollections(collections: ProjectBacklogSuggestionCollections | undefined): ProjectBacklogSuggestionCollections {
    return Object.fromEntries(
      Object.entries(collections ?? {})
        .filter(([, collection]) => isSuggestionCollection(collection))
        .map(([projectId, collection]) => [projectId, cloneCollection({
          projectId,
          candidates: collection.candidates.filter((candidate) => (
            candidate.projectId === projectId && isSuggestionCandidate(candidate)
          )),
        })]),
    );
  }

  private resolveProjectId(context: ProjectBacklogSuggestionProjectContext) {
    const resolved = new ProjectCompanyBindingService().resolveProjectBinding({
      bindingId: context.bindingId,
      buildingId: context.buildingId,
      projectId: context.projectId,
      fallbackCompanyName: context.fallbackCompanyName,
      projects: context.projects,
    });
    if (!resolved.project) return { ok: false as const, reason: "MissingProject" as const };
    if (resolved.status !== "bound") return { ok: false as const, reason: "UnavailableProject" as const };
    return { ok: true as const, projectId: resolved.projectId, project: resolved.project };
  }

  private toCandidate(
    value: ProjectBacklogSuggestionProviderCandidate,
    projectId: string,
    timestamp: string,
    sourceContextSummary: string,
  ): ProjectBacklogSuggestionCandidate | undefined {
    const title = typeof value.title === "string" ? value.title.trim() : "";
    const description = typeof value.description === "string" ? value.description.trim() : "";
    const rationale = typeof value.rationale === "string" && value.rationale.trim()
      ? value.rationale.trim()
      : undefined;
    const priority = isPriority(value.priority) ? value.priority : undefined;
    if (!title || !description) return undefined;
    return {
      id: this.createId(projectId),
      projectId,
      title,
      description,
      ...(rationale ? { rationale } : {}),
      ...(priority ? { suggestedPriority: priority } : {}),
      sourceContextSummary,
      generatedAt: timestamp,
      updatedAt: timestamp,
      status: "proposed",
    };
  }

  private updateSuggestion(
    collection: ProjectBacklogSuggestionCollection,
    index: number,
    suggestion: ProjectBacklogSuggestionCandidate,
  ): ProjectBacklogSuggestionCollection {
    return {
      projectId: collection.projectId,
      candidates: collection.candidates.map((candidate, candidateIndex) => (
        candidateIndex === index ? { ...suggestion } : { ...candidate }
      )),
    };
  }
}

export class DeterministicProjectBacklogSuggestionProvider implements ProjectBacklogSuggestionProvider {
  generateSuggestions(
    context: ProjectBacklogSuggestionPromptContext,
    maxSuggestions: number,
  ): ProjectBacklogSuggestionProviderCandidate[] {
    const projectName = context.projectName || context.projectId;
    const focus = context.backlog[0]?.title ?? context.repositorySummary ?? context.projectType;
    const candidates: ProjectBacklogSuggestionProviderCandidate[] = [
      {
        title: `Add ${projectName} backlog search`,
        description: `Add operator-facing search and filtering for ${projectName} planning items, informed by current ${focus} context.`,
        rationale: "Improves planning review without changing task readiness or execution state.",
        priority: "normal",
      },
      {
        title: `Add ${projectName} sync recovery notes`,
        description: `Show concise recovery notes when ${projectName} project or repository synchronization needs operator attention.`,
        rationale: "Gives the operator concrete follow-up work while keeping blocked execution recovery separate.",
        priority: context.blockedWork.length > 0 ? "high" : "normal",
      },
      {
        title: `Add ${projectName} accepted work audit trail`,
        description: `Record how accepted planning work for ${projectName} moved from suggestion to backlog without starting development.`,
        rationale: "Makes operator decisions auditable across reloads and project switches.",
        priority: "low",
      },
    ];
    return candidates.slice(0, Math.max(1, maxSuggestions));
  }
}

export function isSuggestionCollection(value: unknown): value is ProjectBacklogSuggestionCollection {
  if (!isRecord(value)) return false;
  return (
    typeof value.projectId === "string" &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isSuggestionCandidate)
  );
}

export function isSuggestionCandidate(value: unknown): value is ProjectBacklogSuggestionCandidate {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.sourceContextSummary === "string" &&
    typeof value.generatedAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.status === "proposed" || value.status === "accepted" || value.status === "rejected" || value.status === "stale") &&
    (value.rationale === undefined || typeof value.rationale === "string") &&
    (value.suggestedPriority === undefined || isPriority(value.suggestedPriority)) &&
    (value.acceptedBacklogTaskId === undefined || typeof value.acceptedBacklogTaskId === "string")
  );
}

function getCollection(
  collections: ProjectBacklogSuggestionCollections,
  projectId: string,
): ProjectBacklogSuggestionCollection {
  return cloneCollection(collections[projectId] ?? { projectId, candidates: [] });
}

function suggestionExistsOutsideProject(
  collections: ProjectBacklogSuggestionCollections,
  projectId: string,
  suggestionId: string,
) {
  return Object.values(collections).some((collection) => (
    collection.projectId !== projectId &&
    collection.candidates.some((candidate) => candidate.id === suggestionId)
  ));
}

function createDuplicateKey(title: string, description: string) {
  return `${normalizeWorkText(title)}|${normalizeWorkText(description)}`;
}

function normalizeWorkText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function createSourceContextSummary(context: ProjectBacklogSuggestionPromptContext) {
  const parts = [
    context.projectName,
    `${context.backlog.length} backlog`,
    `${context.activeWork.length} active`,
    `${context.blockedWork.length} blocked`,
  ];
  if (context.repositorySummary) parts.push("repository metadata");
  if (context.developmentRequests.length > 0) parts.push(`${context.developmentRequests.length} requests`);
  return parts.join("; ");
}

function isPriority(value: unknown): value is ProjectBacklogPriority {
  return typeof value === "string" && PRIORITIES.includes(value as ProjectBacklogPriority);
}

function cloneCollection(collection: ProjectBacklogSuggestionCollection): ProjectBacklogSuggestionCollection {
  return {
    projectId: collection.projectId,
    candidates: collection.candidates.map((candidate) => ({ ...candidate })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
