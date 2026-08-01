import type { EmployeeRecommendationResult, TaskAnalysis } from "./ai/AITypes";
import type { ProjectManagementSuggestion } from "./ai/AIProjectManagerTypes";
import type { CompanyDashboardSnapshot } from "./dashboard/CompanyDashboardTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { EmployeeSimulationSnapshot } from "./employees/EmployeeSimulationTypes";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { AIverseProjectRepositoryMapping } from "./github/GitHubRepositoryTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type {
  ConfirmedEmployeeAssignmentRecord,
  ConfirmedEmployeeAssignmentResultCollection,
} from "./confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type {
  PreparedWorkSessionRecord,
  PreparedWorkSessionResultCollection,
} from "./prepared-work-sessions/PreparedWorkSessionTypes";
import type { ActiveWorkSessionStartResultCollection } from "./active-work-sessions/ActiveWorkSessionTypes";
import type { ExecutionPlanCollection, ExecutionPlanResultCollection } from "./execution-plans/ExecutionPlanTypes";
import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResultCollection,
} from "./execution-readiness/ExecutionReadinessTypes";
import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResultCollection,
} from "./human-execution-approvals/HumanExecutionApprovalTypes";
import type {
  RuntimePreflightCollection,
  RuntimePreflightResultCollection,
} from "./runtime-preflight/RuntimePreflightTypes";
import type {
  RuntimeStartCollection,
  RuntimeStartResultCollection,
} from "./runtime-start/RuntimeStartTypes";
import type {
  ImplementerRuntimeCollection,
  ImplementerRuntimeResultCollection,
} from "./implementer-runtime/ImplementerRuntimeTypes";
import type {
  ReviewerRuntimeCollection,
  ReviewerRuntimeResultCollection,
} from "./reviewer-runtime/ReviewerRuntimeTypes";
import type { ReviewTarget } from "./reviewer-runtime/ReviewTarget";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CompanyFocusSummary, CompanyInfluencePlanState } from "./influence/CompanyInfluencePlanningTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import type { ProjectDashboardSnapshot } from "./project-dashboard/ProjectDashboardTypes";
import type { ProjectRegistryEntry, ProjectRegistryRepositoryIdentity } from "./project-registry/ProjectRegistryTypes";
import type { RepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

export type ProjectPortalProjectStatus = "Active" | "Planned" | "Coming Soon";

export type ProjectPortalProjectType = "Company" | "Portfolio" | "Lab" | (string & {});

export type ProjectPortalViewMode =
  | "list"
  | "detail"
  | "workspace"
  | "repository-detail"
  | "task-list"
  | "task-detail"
  | "employee-selection"
  | "project-dashboard"
  | "influence-planning";

export type ProjectPortalServiceStatus = {
  id: string;
  label: string;
  status: "Not connected" | "Placeholder";
  enabled: boolean;
  placeholder: true;
};

export type ProjectPortalNextAction = {
  label: string;
  enabled: boolean;
  placeholder: true;
};

export type ProjectPortalProject = {
  id: string;
  name: string;
  status: ProjectPortalProjectStatus;
  type: ProjectPortalProjectType;
  enabled: boolean;
  description: string;
  linkedServices: ProjectPortalServiceStatus[];
  nextAction: ProjectPortalNextAction;
  ownerCompany?: string;
  localRepositoryLabel?: string;
  repositoryIdentity?: ProjectRegistryRepositoryIdentity;
};

export type ProjectWorkspaceSectionId = "repository" | "firebase" | "analytics" | "tasks" | "ai-agents";

export type ProjectWorkspaceSection = {
  id: ProjectWorkspaceSectionId;
  label: string;
  status: "Not connected" | "Placeholder" | "Mock connected" | "3 tasks";
  enabled: boolean;
  placeholder: true;
};

export type ProjectWorkspace = {
  projectId: string;
  projectName: string;
  sections: ProjectWorkspaceSection[];
};

export type ProjectPortalPlaceholderAction = {
  projectId: string;
  actionLabel: string;
  status: "placeholder";
  workspaceSectionId?: ProjectWorkspaceSectionId;
};

export type ProjectPortalState = {
  isOpen: boolean;
  justOpened: boolean;
  viewMode: ProjectPortalViewMode;
  selectedProjectIndex: number;
  selectedProjectId: string;
  selectedWorkspaceSectionIndex: number;
  selectedRepositoryProjectId?: string;
  selectedTaskProjectId?: string;
  selectedTaskIndex: number;
  selectedTaskId?: string;
  selectedEmployeeIndex: number;
  selectedProjectDashboardProjectId?: string;
  selectedCandidatePromotionIndex: number;
  selectedInfluenceFocusIndex: number;
  selectedWorkSessionId?: string;
  lastPlaceholderAction?: ProjectPortalPlaceholderAction;
  projects: ProjectPortalProject[];
  projectRegistryEntries: ProjectRegistryEntry[];
  services: ProjectPortalServiceStatus[];
  workspaces: Record<string, ProjectWorkspace>;
  repositoryMappings: AIverseProjectRepositoryMapping[];
  repositorySummaries: Record<string, GitHubRepositorySummary>;
  repositorySyncSnapshots: Record<string, RepositorySyncSnapshot>;
  issueSyncCollections: Record<string, IssueSnapshotCollection>;
  candidateTaskCollections: Record<string, CandidateTaskCollection>;
  candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
  candidatePromotionReviewCollections: Record<string, CandidatePromotionReviewCollection>;
  candidatePromotionDecisionRecords: Record<string, CandidatePromotionDecision>;
  candidateProjectTaskPromotionResultCollections: Record<string, CandidateProjectTaskPromotionResultCollection>;
  confirmedEmployeeAssignmentRecords: Record<string, ConfirmedEmployeeAssignmentRecord>;
  confirmedEmployeeAssignmentResultCollections: Record<string, ConfirmedEmployeeAssignmentResultCollection>;
  preparedWorkSessionRecords: Record<string, PreparedWorkSessionRecord>;
  preparedWorkSessionResultCollections: Record<string, PreparedWorkSessionResultCollection>;
  activeWorkSessionStartResultCollections: Record<string, ActiveWorkSessionStartResultCollection>;
  executionPlanCollections: Record<string, ExecutionPlanCollection>;
  executionPlanResultCollections: Record<string, ExecutionPlanResultCollection>;
  executionReadinessCollections: Record<string, ExecutionReadinessCollection>;
  executionReadinessResultCollections: Record<string, ExecutionReadinessResultCollection>;
  humanExecutionApprovalCollections: Record<string, HumanExecutionApprovalCollection>;
  humanExecutionApprovalResultCollections: Record<string, HumanExecutionApprovalResultCollection>;
  runtimePreflightCollections: Record<string, RuntimePreflightCollection>;
  runtimePreflightResultCollections: Record<string, RuntimePreflightResultCollection>;
  runtimeStartCollections: Record<string, RuntimeStartCollection>;
  runtimeStartResultCollections: Record<string, RuntimeStartResultCollection>;
  implementerRuntimeCollections: Record<string, ImplementerRuntimeCollection>;
  implementerRuntimeResultCollections: Record<string, ImplementerRuntimeResultCollection>;
  reviewTargets: Record<string, ReviewTarget>;
  reviewerRuntimeCollections: Record<string, ReviewerRuntimeCollection>;
  reviewerRuntimeResultCollections: Record<string, ReviewerRuntimeResultCollection>;
  taskCollections: Record<string, TaskCollection>;
  taskAnalyses: Record<string, TaskAnalysis>;
  employeeRecommendations: Record<string, EmployeeRecommendationResult>;
  projectManagementSuggestions: Record<string, ProjectManagementSuggestion>;
  employees: Employee[];
  employeeSimulations: Record<string, EmployeeSimulationSnapshot>;
  employeeAssignments: Record<string, string>;
  workSessions: Record<string, WorkSession[]>;
  projectDashboardSnapshot?: ProjectDashboardSnapshot;
  companyDashboardSnapshot?: CompanyDashboardSnapshot;
  companyInfluencePlan: CompanyInfluencePlanState;
  companyFocusSummary?: CompanyFocusSummary;
};
