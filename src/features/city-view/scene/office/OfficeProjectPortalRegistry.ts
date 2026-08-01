import type {
  ProjectPortalServiceStatus,
  ProjectPortalState,
  ProjectWorkspace,
} from "./OfficeProjectPortalTypes";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import type { AIverseProjectRepositoryMapping } from "./github/GitHubRepositoryTypes";
import { toProjectPortalProject, toRepositoryMapping } from "./project-registry/ProjectRegistryAdapters";
import { ProjectRegistryService } from "./project-registry/ProjectRegistryService";
import type { ProjectRegistryEntry } from "./project-registry/ProjectRegistryTypes";

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

export function createProjectPortalState(): ProjectPortalState {
  const influencePlanningService = new CompanyInfluencePlanningService();
  const projectRegistryService = new ProjectRegistryService();
  const registryEntries = projectRegistryService.getAllProjects();

  return {
    isOpen: false,
    justOpened: false,
    viewMode: "list",
    selectedProjectIndex: 0,
    selectedProjectId: registryEntries[0].id,
    selectedWorkspaceSectionIndex: 0,
    selectedTaskIndex: 0,
    selectedEmployeeIndex: 0,
    selectedProjectDashboardProjectId: undefined,
    selectedCandidatePromotionIndex: 0,
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
    taskCollections: {},
    taskAnalyses: {},
    employeeRecommendations: {},
    projectManagementSuggestions: {},
    employees: [],
    employeeSimulations: {},
    employeeAssignments: {},
    workSessions: {},
    projectDashboardSnapshot: undefined,
    companyInfluencePlan: influencePlanningService.createInitialState(),
    companyFocusSummary: influencePlanningService.createFocusSummary(influencePlanningService.createInitialState()),
  };
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
