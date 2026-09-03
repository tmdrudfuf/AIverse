import type { ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";

export type ProjectBacklogSuggestionStatus = "proposed" | "accepted" | "rejected" | "stale";

export type ProjectBacklogSuggestionCandidate = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  sourceContextSummary: string;
  generatedAt: string;
  updatedAt: string;
  status: ProjectBacklogSuggestionStatus;
  rationale?: string;
  suggestedPriority?: ProjectBacklogPriority;
  acceptedBacklogTaskId?: string;
  acceptanceMode?: "manual" | "automatic";
  acceptedAt?: string;
};

export type ProjectBacklogSuggestionCollection = {
  projectId: string;
  candidates: ProjectBacklogSuggestionCandidate[];
};

export type ProjectBacklogSuggestionCollections = Record<string, ProjectBacklogSuggestionCollection>;

export type ProjectBacklogSuggestionProviderCandidate = {
  title?: unknown;
  description?: unknown;
  rationale?: unknown;
  priority?: unknown;
};

export type ProjectBacklogSuggestionPromptContext = {
  projectId: string;
  projectName: string;
  projectStatus: string;
  projectType: string;
  ownerCompany?: string;
  repositorySummary?: string;
  backlog: Array<Pick<ProjectBacklogTask, "id" | "title" | "description" | "status" | "priority">>;
  activeWork: string[];
  blockedWork: string[];
  developmentRequests: string[];
  rejectedSuggestionTitles: string[];
};

export type ProjectBacklogSuggestionProvider = {
  generateSuggestions: (context: ProjectBacklogSuggestionPromptContext, maxSuggestions: number) =>
    Promise<ProjectBacklogSuggestionProviderCandidate[]> | ProjectBacklogSuggestionProviderCandidate[];
};

export type ProjectBacklogSuggestionGenerationResult =
  | { ok: true; collection: ProjectBacklogSuggestionCollection; candidates: ProjectBacklogSuggestionCandidate[]; promptContext: ProjectBacklogSuggestionPromptContext }
  | { ok: false; reason: "MissingProject" | "UnavailableProject" | "InvalidProviderOutput" | "NoCandidates" };

export type ProjectBacklogSuggestionReviewResult =
  | {
      ok: true;
      collection: ProjectBacklogSuggestionCollection;
      suggestion: ProjectBacklogSuggestionCandidate;
      task?: ProjectBacklogTask;
    }
  | {
      ok: false;
      reason:
        | "MissingProject"
        | "UnavailableProject"
        | "SuggestionNotFound"
        | "ProjectMismatch"
        | "InvalidInput"
        | "AlreadyAccepted";
    };
