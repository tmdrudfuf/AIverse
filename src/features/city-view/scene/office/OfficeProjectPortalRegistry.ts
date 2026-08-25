import type {
  ProjectPortalServiceStatus,
  ProjectPortalState,
  ProjectWorkspace,
} from "./OfficeProjectPortalTypes";
import {
  BrowserOfficeSessionService,
  createBrowserOfficeSessionService,
} from "./browser-session/BrowserOfficeSessionService";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import type { AIverseProjectRepositoryMapping } from "./github/GitHubRepositoryTypes";
import { toProjectPortalProject, toRepositoryMapping } from "./project-registry/ProjectRegistryAdapters";
import { ProjectRegistryService } from "./project-registry/ProjectRegistryService";
import type {
  LocalProjectRepositoryBinding,
  ProjectRegistryEntry,
  ProjectRegistryRepositoryIdentity,
} from "./project-registry/ProjectRegistryTypes";

export const EXTERNAL_PROJECT_DRAFT_ID = "external-project-draft";

const EXTERNAL_PROJECT_DRAFT_CREATED_AT = "2026-08-24T00:00:00.000Z";
const EXTERNAL_PROJECT_DRAFT_REPOSITORY_BOUND_AT = "2026-08-24T00:00:00.000Z";

export type ExternalProjectRepositoryIdentityChoice = {
  id: string;
  label: string;
  summary: string;
  localRepositoryLabel: string;
  repositoryIdentity: ProjectRegistryRepositoryIdentity;
  localRepositoryBinding?: LocalProjectRepositoryBinding;
  remoteRepository?: ProjectRegistryEntry["remoteRepository"];
};

export const EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES: readonly ExternalProjectRepositoryIdentityChoice[] = [
  {
    id: "local-aiverse-worktree",
    label: "Local AIverse worktree",
    summary: "Configured local identity for the AIverse feature worktree.",
    localRepositoryLabel: "Bound (local)",
    repositoryIdentity: {
      provider: "local",
      owner: "AIverse",
      name: "AIverse",
      defaultBranch: "codex/126-external-project-repository-identity-edit-overlay",
      localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-repository-identity-edit-overlay",
      connectionState: "Configured",
    },
    localRepositoryBinding: {
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-repository-identity-edit-overlay",
      branchName: "codex/126-external-project-repository-identity-edit-overlay",
      specPath: "specs/126-external-project-repository-identity-edit-overlay/spec.md",
      source: "ados-handoff",
      boundAt: EXTERNAL_PROJECT_DRAFT_REPOSITORY_BOUND_AT,
    },
  },
  {
    id: "github-aiverse",
    label: "GitHub AIverse identity",
    summary: "Configured GitHub-style identity without live GitHub reads.",
    localRepositoryLabel: "Not connected",
    repositoryIdentity: {
      provider: "github",
      owner: "ai-verse",
      name: "aiverse",
      defaultBranch: "main",
      url: "https://github.com/ai-verse/aiverse",
      connectionState: "Configured",
    },
    remoteRepository: {
      owner: "ai-verse",
      name: "aiverse",
      url: "https://github.com/ai-verse/aiverse",
      visibility: "unknown",
      defaultBranchHint: "main",
    },
  },
  {
    id: "local-unknown",
    label: "Local unknown",
    summary: "Keep this draft local-only until repository details are known.",
    localRepositoryLabel: "Not connected",
    repositoryIdentity: {
      provider: "local",
      connectionState: "Unknown",
    },
  },
];

const DEFAULT_LOCAL_REPOSITORY_BINDINGS: LocalProjectRepositoryBinding[] = [
  {
    projectId: "daily-proof",
    repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
    worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context",
    branchName: "codex/103-daily-proof-configured-runtime-repository-context",
    specPath: "specs/103-daily-proof-configured-runtime-repository-context/spec.md",
    source: "ados-handoff",
    boundAt: "2026-08-15T00:00:00.000Z",
  },
];

const PLACEHOLDER_SERVICES: ProjectPortalServiceStatus[] = [
  {
    id: "github",
    label: "GitHub",
    status: "Not connected",
    enabled: false,
    placeholder: true,
  },
  {
    id: "firebase",
    label: "Firebase",
    status: "Not connected",
    enabled: false,
    placeholder: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    status: "Placeholder",
    enabled: false,
    placeholder: true,
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    status: "Placeholder",
    enabled: false,
    placeholder: true,
  },
];

const WORKSPACES: Record<string, ProjectWorkspace> = {
  "daily-proof": {
    projectId: "daily-proof",
    projectName: "Daily Proof",
    sections: [
      {
        id: "repository",
        label: "Repository",
        status: "Mock connected",
        enabled: true,
        placeholder: true,
      },
      {
        id: "firebase",
        label: "Firebase",
        status: "Not connected",
        enabled: false,
        placeholder: true,
      },
      {
        id: "analytics",
        label: "Analytics",
        status: "Placeholder",
        enabled: false,
        placeholder: true,
      },
      {
        id: "tasks",
        label: "Tasks",
        status: "3 tasks",
        enabled: true,
        placeholder: true,
      },
      {
        id: "ai-agents",
        label: "AI Agents",
        status: "Placeholder",
        enabled: false,
        placeholder: true,
      },
    ],
  },
};

export type CreateProjectPortalStateOptions = {
  localRepositoryBindings?: ReadonlyArray<LocalProjectRepositoryBinding>;
  browserOfficeSessionService?: BrowserOfficeSessionService | false;
};

export function createProjectPortalState(options: CreateProjectPortalStateOptions = {}): ProjectPortalState {
  const influencePlanningService = new CompanyInfluencePlanningService();
  const projectRegistryService = new ProjectRegistryService(
    undefined,
    options.localRepositoryBindings ?? DEFAULT_LOCAL_REPOSITORY_BINDINGS,
  );
  const registryEntries = projectRegistryService.getAllProjects();

  const state: ProjectPortalState = {
    isOpen: false,
    justOpened: false,
    viewMode: "list",
    selectedProjectIndex: 0,
    selectedProjectId: registryEntries[0].id,
    selectedWorkspaceSectionIndex: 0,
    selectedRepositoryIdentityChoiceIndex: 0,
    selectedTaskIndex: 0,
    selectedEmployeeIndex: 0,
    selectedProjectDashboardProjectId: undefined,
    selectedProjectDashboardActiveWorkIndex: 0,
    selectedCandidatePromotionIndex: 0,
    selectedCandidateTaskId: undefined,
    selectedInfluenceFocusIndex: 0,
    projects: registryEntries.map((entry) => toProjectPortalProject(entry, createLinkedServices())),
    projectRegistryEntries: registryEntries,
    services: createLinkedServices(),
    workspaces: createWorkspaces(),
    repositoryMappings: createRepositoryMappings(registryEntries),
    repositorySummaries: {},
    repositorySyncSnapshots: {},
    issueSyncCollections: {},
    candidateTaskCollections: {},
    candidateAssignmentCollections: {},
    candidatePromotionReviewCollections: {},
    candidatePromotionDecisionRecords: {},
    candidateProjectTaskPromotionResultCollections: {},
    confirmedEmployeeAssignmentRecords: {},
    confirmedEmployeeAssignmentResultCollections: {},
    preparedWorkSessionRecords: {},
    preparedWorkSessionResultCollections: {},
    activeWorkSessionStartResultCollections: {},
    executionPlanCollections: {},
    executionPlanResultCollections: {},
    executionReadinessCollections: {},
    executionReadinessResultCollections: {},
    humanExecutionApprovalCollections: {},
    humanExecutionApprovalResultCollections: {},
    runtimePreflightCollections: {},
    runtimePreflightResultCollections: {},
    runtimeStartCollections: {},
    runtimeStartResultCollections: {},
    implementerRuntimeCollections: {},
    implementerRuntimeResultCollections: {},
    reviewTargets: {},
    reviewerRuntimeCollections: {},
    reviewerRuntimeResultCollections: {},
    reviewPromotionCollections: {},
    reviewPromotionResultCollections: {},
    reviewFixRequestCollections: {},
    reviewFixRequestResultCollections: {},
    reviewFixPlanCollections: {},
    reviewFixPlanResultCollections: {},
    reviewFixRuntimeCollections: {},
    reviewFixRuntimeResultCollections: {},
    validationRuntimeCollections: {},
    validationRuntimeResultCollections: {},
    postValidationReviewTargetCollections: {},
    postValidationReviewTargetResultCollections: {},
    externalProjectDevelopmentRequestDrafts: {},
    taskCollections: {},
    taskAnalyses: {},
    employeeRecommendations: {},
    projectManagementSuggestions: {},
    employees: [],
    fifthEmployeeRecruitmentResult: undefined,
    employeeSimulations: {},
    employeeAssignments: {},
    workSessions: {},
    taskCompletionProgressionFeedback: undefined,
    receptionDeskUpgradeBenefits: undefined,
    projectDashboardSnapshot: undefined,
    previousCompanyProgressionSnapshot: undefined,
    companyProgressionTriggers: [],
    companyInfluencePlan: influencePlanningService.createInitialState(),
    companyFocusSummary: influencePlanningService.createFocusSummary(influencePlanningService.createInitialState()),
  };

  const browserOfficeSessionService = options.browserOfficeSessionService === false
    ? undefined
    : options.browserOfficeSessionService ?? createBrowserOfficeSessionService();
  return browserOfficeSessionService?.restoreState(state) ?? state;
}

export function createExternalProjectDraftEntry(): ProjectRegistryEntry {
  return {
    id: EXTERNAL_PROJECT_DRAFT_ID,
    displayName: "External Project Draft",
    shortDescription: "Draft external project awaiting repository details.",
    lifecycleStatus: "Planned",
    projectType: "External",
    localRepository: {
      connected: false,
      label: "Not connected",
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Unknown",
    },
    owner: {
      companyName: "AIverse External",
    },
    createdAt: EXTERNAL_PROJECT_DRAFT_CREATED_AT,
    lastActivityAt: EXTERNAL_PROJECT_DRAFT_CREATED_AT,
  };
}

export function addExternalProjectDraftToState(state: ProjectPortalState): ProjectPortalState {
  const existingEntry = state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID);
  const registryEntries = existingEntry
    ? state.projectRegistryEntries
    : [...state.projectRegistryEntries, createExternalProjectDraftEntry()];

  state.projectRegistryEntries = registryEntries.map((entry) => ({
    ...entry,
    localRepository: { ...entry.localRepository },
    ...(entry.localRepositoryBinding ? { localRepositoryBinding: { ...entry.localRepositoryBinding } } : {}),
    ...(entry.remoteRepository ? { remoteRepository: { ...entry.remoteRepository } } : {}),
    repositoryIdentity: { ...entry.repositoryIdentity },
    owner: { ...entry.owner },
  }));
  state.projects = state.projectRegistryEntries.map((entry) => toProjectPortalProject(entry, createLinkedServices()));
  state.repositoryMappings = createRepositoryMappings(state.projectRegistryEntries);
  state.selectedProjectIndex = state.projects.findIndex((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID);
  state.selectedProjectId = EXTERNAL_PROJECT_DRAFT_ID;
  state.selectedWorkspaceSectionIndex = 0;
  state.selectedRepositoryIdentityChoiceIndex = 0;
  state.selectedRepositoryProjectId = undefined;
  state.selectedTaskProjectId = undefined;
  state.selectedTaskId = undefined;
  state.selectedTaskIndex = 0;
  state.selectedEmployeeIndex = 0;
  state.selectedWorkSessionId = undefined;

  return state;
}

export function applyExternalProjectDraftRepositoryIdentityChoiceToState(
  state: ProjectPortalState,
  choiceId: string,
): boolean {
  const choice = EXTERNAL_PROJECT_REPOSITORY_IDENTITY_CHOICES.find((item) => item.id === choiceId);
  if (!choice) return false;

  const draftIndex = state.projectRegistryEntries.findIndex((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID);
  if (draftIndex < 0) return false;

  state.projectRegistryEntries = state.projectRegistryEntries.map((entry) => {
    if (entry.id !== EXTERNAL_PROJECT_DRAFT_ID) return cloneProjectRegistryEntry(entry);

    const entryWithoutRepositoryLinks = cloneProjectRegistryEntry(entry);
    delete entryWithoutRepositoryLinks.localRepositoryBinding;
    delete entryWithoutRepositoryLinks.remoteRepository;

    return {
      ...entryWithoutRepositoryLinks,
      localRepository: {
        connected: choice.localRepositoryLabel !== "Not connected",
        label: choice.localRepositoryLabel,
      },
      ...(choice.localRepositoryBinding
        ? { localRepositoryBinding: normalizeLocalRepositoryBinding(choice.localRepositoryBinding) }
        : {}),
      ...(choice.remoteRepository ? { remoteRepository: { ...choice.remoteRepository } } : {}),
      repositoryIdentity: { ...choice.repositoryIdentity },
      lastActivityAt: EXTERNAL_PROJECT_DRAFT_REPOSITORY_BOUND_AT,
    };
  });
  state.projects = state.projectRegistryEntries.map((entry) => toProjectPortalProject(entry, createLinkedServices()));
  state.repositoryMappings = createRepositoryMappings(state.projectRegistryEntries);
  return true;
}

function createRepositoryMappings(registryEntries: ReadonlyArray<ProjectRegistryEntry>): AIverseProjectRepositoryMapping[] {
  return registryEntries
    .map((entry) => toRepositoryMapping(entry))
    .filter((mapping): mapping is AIverseProjectRepositoryMapping => Boolean(mapping));
}

function createLinkedServices() {
  return PLACEHOLDER_SERVICES.map((service) => ({ ...service }));
}

function createWorkspaces() {
  return Object.fromEntries(
    Object.entries(WORKSPACES).map(([projectId, workspace]) => [
      projectId,
      {
        ...workspace,
        sections: workspace.sections.map((section) => ({ ...section })),
      },
    ]),
  );
}

function cloneProjectRegistryEntry(entry: ProjectRegistryEntry): ProjectRegistryEntry {
  return {
    ...entry,
    localRepository: { ...entry.localRepository },
    ...(entry.localRepositoryBinding ? { localRepositoryBinding: { ...entry.localRepositoryBinding } } : {}),
    ...(entry.remoteRepository ? { remoteRepository: { ...entry.remoteRepository } } : {}),
    repositoryIdentity: { ...entry.repositoryIdentity },
    owner: { ...entry.owner },
  };
}

function normalizeLocalRepositoryBinding(binding: LocalProjectRepositoryBinding) {
  const repositoryPath = binding.repositoryPath ?? binding.worktreePath;
  const worktreePath = binding.worktreePath ?? binding.repositoryPath;
  if (!repositoryPath || !worktreePath) {
    throw new Error("External project repository identity choice is missing local path metadata.");
  }

  return {
    ...binding,
    repositoryPath,
    worktreePath,
  };
}
