import type { EmployeeRecommendationResult, TaskAnalysis } from "./ai/AITypes";
import type { ProjectManagementSuggestion } from "./ai/AIProjectManagerTypes";
import type { CompanyDashboardSnapshot } from "./dashboard/CompanyDashboardTypes";
import type { CompanyProgressionSnapshot, CompanyProgressionTrigger } from "./progression/CompanyProgressionTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { EmployeeRecruitmentResult } from "./employees/EmployeeRecruitmentService";
import type { EmployeeSimulationSnapshot } from "./employees/EmployeeSimulationTypes";
import type { ExternalProjectDevelopmentRequestDrafts } from "./external-development-requests/ExternalProjectDevelopmentRequestTypes";
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
import type {
  ReviewPromotionCollection,
  ReviewPromotionResultCollection,
} from "./review-decision/ReviewDecisionTypes";
import type {
  ReviewFixRequestCollection,
  ReviewFixRequestResultCollection,
} from "./review-fix-requests/ReviewFixRequestTypes";
import type {
  ReviewFixPlanCollection,
  ReviewFixPlanResultCollection,
} from "./review-fix-plans/ReviewFixPlanTypes";
import type {
  ReviewFixRuntimeCollection,
  ReviewFixRuntimeResultCollection,
} from "./review-fix-runtime/ReviewFixRuntimeTypes";
import type {
  ValidationRuntimeCollection,
  ValidationRuntimeResultCollection,
} from "./validation-runtime/ValidationRuntimeTypes";
import type {
  PostValidationReviewTargetCollection,
  PostValidationReviewTargetResultCollection,
} from "./post-validation-review-target/PostValidationReviewTargetTypes";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CompanyFocusSummary, CompanyInfluencePlanState } from "./influence/CompanyInfluencePlanningTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import type { ProjectDashboardSnapshot } from "./project-dashboard/ProjectDashboardTypes";
import type {
  NormalizedLocalProjectRepositoryBinding,
  ProjectRegistryEntry,
  ProjectRegistryRepositoryIdentity,
} from "./project-registry/ProjectRegistryTypes";
import type { RepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";
import type { ReceptionDeskUpgradeBenefits } from "./ReceptionDeskUpgradeBenefitsService";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

export type ProjectPortalProjectStatus = "Active" | "Planned" | "Coming Soon";

export type ProjectPortalProjectType = "Company" | "Portfolio" | "Lab" | (string & {});

export type ProjectPortalViewMode =
  | "list"
  | "detail"
  | "workspace"
  | "repository-identity-edit"
  | "repository-detail"
  | "task-list"
  | "task-detail"
  | "employee-selection"
  | "project-dashboard"
  | "candidate-detail"
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
  localRepositoryBinding?: NormalizedLocalProjectRepositoryBinding;
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

export type TaskCompletionProgressionFeedback = {
  projectId: string;
  taskId: string;
  taskTitle: string;
  completedAt: string;
  previousCompanyLevel: number;
  currentCompanyLevel: number;
  levelUp: boolean;
  message: string;
  milestoneSummary: string;
};

export type ProjectPortalState = {
  isOpen: boolean;
  justOpened: boolean;
  viewMode: ProjectPortalViewMode;
  selectedProjectIndex: number;
  selectedProjectId: string;
  selectedWorkspaceSectionIndex: number;
  selectedRepositoryIdentityChoiceIndex: number;
  selectedRepositoryProjectId?: string;
  selectedTaskProjectId?: string;
  selectedTaskIndex: number;
  selectedTaskId?: string;
  selectedEmployeeIndex: number;
  selectedProjectDashboardProjectId?: string;
  selectedProjectDashboardActiveWorkIndex: number;
  selectedCandidatePromotionIndex: number;
  selectedCandidateTaskId?: string;
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
  reviewPromotionCollections: Record<string, ReviewPromotionCollection>;
  reviewPromotionResultCollections: Record<string, ReviewPromotionResultCollection>;
  reviewFixRequestCollections: Record<string, ReviewFixRequestCollection>;
  reviewFixRequestResultCollections: Record<string, ReviewFixRequestResultCollection>;
  reviewFixPlanCollections: Record<string, ReviewFixPlanCollection>;
  reviewFixPlanResultCollections: Record<string, ReviewFixPlanResultCollection>;
  reviewFixRuntimeCollections: Record<string, ReviewFixRuntimeCollection>;
  reviewFixRuntimeResultCollections: Record<string, ReviewFixRuntimeResultCollection>;
  validationRuntimeCollections: Record<string, ValidationRuntimeCollection>;
  validationRuntimeResultCollections: Record<string, ValidationRuntimeResultCollection>;
  postValidationReviewTargetCollections: Record<string, PostValidationReviewTargetCollection>;
  postValidationReviewTargetResultCollections: Record<string, PostValidationReviewTargetResultCollection>;
  externalProjectDevelopmentRequestDrafts: ExternalProjectDevelopmentRequestDrafts;
  taskCollections: Record<string, TaskCollection>;
  taskAnalyses: Record<string, TaskAnalysis>;
  employeeRecommendations: Record<string, EmployeeRecommendationResult>;
  projectManagementSuggestions: Record<string, ProjectManagementSuggestion>;
  employees: Employee[];
  fifthEmployeeRecruitmentResult?: EmployeeRecruitmentResult;
  employeeSimulations: Record<string, EmployeeSimulationSnapshot>;
  employeeAssignments: Record<string, string>;
  workSessions: Record<string, WorkSession[]>;
  taskCompletionProgressionFeedback?: TaskCompletionProgressionFeedback;
  receptionDeskUpgradeBenefits?: ReceptionDeskUpgradeBenefits;
  projectDashboardSnapshot?: ProjectDashboardSnapshot;
  companyDashboardSnapshot?: CompanyDashboardSnapshot;
  previousCompanyProgressionSnapshot?: CompanyProgressionSnapshot;
  companyProgressionTriggers: CompanyProgressionTrigger[];
  companyInfluencePlan: CompanyInfluencePlanState;
  companyFocusSummary?: CompanyFocusSummary;
};
