import type { ActiveWorkSessionStartResultCollection } from "../active-work-sessions/ActiveWorkSessionTypes";
import type { CandidateAssignmentRecommendationCollection } from "../candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "../candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "../candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "../candidate-tasks/CandidateTaskTypes";
import type {
  ConfirmedEmployeeAssignmentRecord,
  ConfirmedEmployeeAssignmentResultCollection,
} from "../confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type {
  PreparedWorkSessionRecord,
  PreparedWorkSessionResultCollection,
} from "../prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectPortalState } from "../OfficeProjectPortalTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import type { ProjectCompanyBinding } from "../project-company-binding/ProjectCompanyBindingTypes";
import type { TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { Employee } from "../employees/EmployeeTypes";
import type { ExternalProjectAdosRunPreparations } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import type {
  ExternalProjectAdosExecutionResults,
  ExternalProjectAdosExecutions,
} from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunStatuses } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ExternalProjectDevelopmentRequestDrafts } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import type { ProjectBacklogCollections } from "../project-backlog/ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCollections } from "../project-backlog/ProjectBacklogSuggestionTypes";
import type { ProjectAutonomyPolicies } from "../project-backlog/ProjectAutonomousExecutionPolicyTypes";
import type {
  ImplementerRuntimeCollection,
  ImplementerRuntimeResultCollection,
} from "../implementer-runtime/ImplementerRuntimeTypes";
import type {
  ReviewerRuntimeCollection,
  ReviewerRuntimeResultCollection,
} from "../reviewer-runtime/ReviewerRuntimeTypes";
import type {
  ReviewPromotionCollection,
  ReviewPromotionResultCollection,
} from "../review-decision/ReviewDecisionTypes";
import type {
  ReviewFixRuntimeCollection,
  ReviewFixRuntimeResultCollection,
} from "../review-fix-runtime/ReviewFixRuntimeTypes";
import type {
  ValidationRuntimeCollection,
  ValidationRuntimeResultCollection,
} from "../validation-runtime/ValidationRuntimeTypes";
import type {
  PostValidationReviewTargetCollection,
  PostValidationReviewTargetResultCollection,
} from "../post-validation-review-target/PostValidationReviewTargetTypes";

export const BROWSER_OFFICE_SESSION_STORAGE_KEY = "aiverse.office.session";
export const BROWSER_OFFICE_SESSION_SCHEMA_VERSION = "browser-office-session-v1";

export type BrowserOfficeSessionSnapshot = {
  version: typeof BROWSER_OFFICE_SESSION_SCHEMA_VERSION;
  savedAt: string;
  selectedProjectId?: string;
  selectedProjectDashboardProjectId?: string;
  selectedProjectDashboardActiveWorkIndex?: number;
  selectedBacklogProjectId?: string;
  selectedBacklogTaskId?: string;
  selectedBacklogTaskIndex?: number;
  selectedBacklogSuggestionId?: string;
  selectedWorkSessionId?: string;
  projectRegistryEntries?: ProjectRegistryEntry[];
  projectCompanyBindings?: ProjectCompanyBinding[];
  candidateTaskCollections: Record<string, CandidateTaskCollection>;
  candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
  candidatePromotionReviewCollections: Record<string, CandidatePromotionReviewCollection>;
  candidatePromotionDecisionRecords: Record<string, CandidatePromotionDecision>;
  candidateProjectTaskPromotionResultCollections: Record<string, CandidateProjectTaskPromotionResultCollection>;
  taskCollections: Record<string, TaskCollection>;
  employees: Employee[];
  confirmedEmployeeAssignmentRecords: Record<string, ConfirmedEmployeeAssignmentRecord>;
  confirmedEmployeeAssignmentResultCollections: Record<string, ConfirmedEmployeeAssignmentResultCollection>;
  preparedWorkSessionRecords: Record<string, PreparedWorkSessionRecord>;
  preparedWorkSessionResultCollections: Record<string, PreparedWorkSessionResultCollection>;
  activeWorkSessionStartResultCollections: Record<string, ActiveWorkSessionStartResultCollection>;
  externalProjectDevelopmentRequestDrafts?: ExternalProjectDevelopmentRequestDrafts;
  externalProjectAdosRunPreparations?: ExternalProjectAdosRunPreparations;
  externalProjectAdosExecutions?: ExternalProjectAdosExecutions;
  externalProjectAdosExecutionResults?: ExternalProjectAdosExecutionResults;
  externalProjectAdosRunStatuses?: ExternalProjectAdosRunStatuses;
  projectBacklogCollections?: ProjectBacklogCollections;
  projectBacklogSuggestionCollections?: ProjectBacklogSuggestionCollections;
  projectAutonomyPolicies?: ProjectAutonomyPolicies;
  implementerRuntimeCollections?: Record<string, ImplementerRuntimeCollection>;
  implementerRuntimeResultCollections?: Record<string, ImplementerRuntimeResultCollection>;
  reviewerRuntimeCollections?: Record<string, ReviewerRuntimeCollection>;
  reviewerRuntimeResultCollections?: Record<string, ReviewerRuntimeResultCollection>;
  reviewPromotionCollections?: Record<string, ReviewPromotionCollection>;
  reviewPromotionResultCollections?: Record<string, ReviewPromotionResultCollection>;
  reviewFixRuntimeCollections?: Record<string, ReviewFixRuntimeCollection>;
  reviewFixRuntimeResultCollections?: Record<string, ReviewFixRuntimeResultCollection>;
  validationRuntimeCollections?: Record<string, ValidationRuntimeCollection>;
  validationRuntimeResultCollections?: Record<string, ValidationRuntimeResultCollection>;
  postValidationReviewTargetCollections?: Record<string, PostValidationReviewTargetCollection>;
  postValidationReviewTargetResultCollections?: Record<string, PostValidationReviewTargetResultCollection>;
  workSessions: Record<string, WorkSession[]>;
};

export type BrowserOfficeSessionStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
};

export type BrowserOfficeSessionState = Pick<
  ProjectPortalState,
  | "selectedProjectId"
  | "selectedProjectDashboardProjectId"
  | "selectedProjectDashboardActiveWorkIndex"
  | "selectedBacklogProjectId"
  | "selectedBacklogTaskId"
  | "selectedBacklogTaskIndex"
  | "selectedBacklogSuggestionId"
  | "selectedWorkSessionId"
  | "projectRegistryEntries"
  | "projectCompanyBindings"
  | "candidateTaskCollections"
  | "candidateAssignmentCollections"
  | "candidatePromotionReviewCollections"
  | "candidatePromotionDecisionRecords"
  | "candidateProjectTaskPromotionResultCollections"
  | "taskCollections"
  | "employees"
  | "confirmedEmployeeAssignmentRecords"
  | "confirmedEmployeeAssignmentResultCollections"
  | "preparedWorkSessionRecords"
  | "preparedWorkSessionResultCollections"
  | "activeWorkSessionStartResultCollections"
  | "externalProjectDevelopmentRequestDrafts"
  | "externalProjectAdosRunPreparations"
  | "externalProjectAdosExecutions"
  | "externalProjectAdosExecutionResults"
  | "externalProjectAdosRunStatuses"
  | "projectBacklogCollections"
  | "projectBacklogSuggestionCollections"
  | "projectAutonomyPolicies"
  | "implementerRuntimeCollections"
  | "implementerRuntimeResultCollections"
  | "reviewerRuntimeCollections"
  | "reviewerRuntimeResultCollections"
  | "reviewPromotionCollections"
  | "reviewPromotionResultCollections"
  | "reviewFixRuntimeCollections"
  | "reviewFixRuntimeResultCollections"
  | "validationRuntimeCollections"
  | "validationRuntimeResultCollections"
  | "postValidationReviewTargetCollections"
  | "postValidationReviewTargetResultCollections"
  | "workSessions"
>;
