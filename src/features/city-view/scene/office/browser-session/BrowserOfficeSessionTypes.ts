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
import type { TaskCollection } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { Employee } from "../employees/EmployeeTypes";

export const BROWSER_OFFICE_SESSION_STORAGE_KEY = "aiverse.office.session";
export const BROWSER_OFFICE_SESSION_SCHEMA_VERSION = "browser-office-session-v1";

export type BrowserOfficeSessionSnapshot = {
  version: typeof BROWSER_OFFICE_SESSION_SCHEMA_VERSION;
  savedAt: string;
  selectedProjectId?: string;
  selectedProjectDashboardProjectId?: string;
  selectedProjectDashboardActiveWorkIndex?: number;
  selectedWorkSessionId?: string;
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
  | "selectedWorkSessionId"
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
  | "workSessions"
>;
