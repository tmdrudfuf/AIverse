import type { EmployeeAIState } from "../employees/EmployeeAITypes";
import type { EmployeeRole } from "../employees/EmployeeTypes";
import type { CompanyFocusSummary } from "../influence/CompanyInfluencePlanningTypes";
import type { ProjectPortalProjectStatus } from "../OfficeProjectPortalTypes";
import type { CompanyProgressionSnapshot } from "../progression/CompanyProgressionTypes";
import type { EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";
import type { TaskPriority, TaskStatus } from "../tasks/ProjectTaskTypes";

export const INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID = "internal-simulation";

export type ProjectDashboardProviderId =
  | typeof INTERNAL_SIMULATION_PROJECT_DASHBOARD_PROVIDER_ID
  | (string & {});

export type ProjectDashboardSourceType = "internal-simulation" | (string & {});

export type ProjectDashboardSectionStatus = "available" | "empty" | "unavailable";

export type ProjectDashboardSectionId =
  | "project_summary"
  | "project_progress"
  | "active_work"
  | "related_employees"
  | "blockers"
  | "recent_activity"
  | "related_focus"
  | "project_health"
  | "source_metadata";

export type ProjectDashboardSectionAvailability = {
  id: ProjectDashboardSectionId;
  label: string;
  status: ProjectDashboardSectionStatus;
  message?: string;
};

export type ProjectDashboardProjectSummary = {
  projectId: string;
  name: string;
  status: ProjectPortalProjectStatus | "Unavailable";
  description?: string;
  isAvailable: boolean;
};

export type ProjectDashboardProgressSummary = {
  percentComplete?: number;
  completedWorkCount: number;
  totalWorkCount: number;
  label: string;
};

export type ProjectDashboardHealthStatus = "healthy" | "watch" | "risk" | "blocked" | "unknown";

export type ProjectDashboardHealthSummary = {
  status: ProjectDashboardHealthStatus;
  label: string;
  reason: string;
  signals: string[];
};

export type ProjectDashboardWorkItemSummary = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progressPercent: number;
  assigneeId?: string;
  assigneeName?: string;
  blockerLabel?: string;
  updatedAt: string;
};

export type ProjectDashboardEmployeeContext = {
  employeeId: string;
  name: string;
  role: EmployeeRole;
  aiState: EmployeeAIState;
  scheduleState?: EmployeeScheduleState;
  currentTaskId?: string;
  currentTaskTitle?: string;
  focusLabel: string;
  moodLabel?: string;
};

export type ProjectDashboardBlockerSeverity = "low" | "medium" | "high" | "blocked";

export type ProjectDashboardBlockerSummary = {
  id: string;
  severity: ProjectDashboardBlockerSeverity;
  label: string;
  reason: string;
};

export type ProjectDashboardActivityType =
  | "task_activity"
  | "task_status"
  | "work_session"
  | "employee_focus"
  | "progression";

export type ProjectDashboardActivityItem = {
  id: string;
  timestamp: string;
  type: ProjectDashboardActivityType;
  label: string;
  description?: string;
};

export type ProjectDashboardRelatedFocus = {
  companyFocusLabel?: string;
  employeeFocusLabels: string[];
  summary: string;
};

export type ProjectDashboardSourceMetadata = {
  // Metadata only: future providers can map into this shape without making the dashboard call external systems.
  sourceType: ProjectDashboardSourceType;
  sourceId: string;
  displayName?: string;
  externalUrl?: string;
  mappingConfidence?: "native" | "mapped" | "unknown";
  statusLabel?: string;
  statusReason?: string;
  refreshedAt?: string;
  signals?: ProjectDashboardExternalSourceSignal[];
};

export type ProjectDashboardExternalSourceSignal = {
  id: string;
  label: string;
  value: string;
  status?: ProjectDashboardSectionStatus;
  description?: string;
};

export type ProjectDashboardSnapshot = {
  providerId: ProjectDashboardProviderId;
  generatedAt: string;
  project: ProjectDashboardProjectSummary;
  progress: ProjectDashboardProgressSummary;
  health: ProjectDashboardHealthSummary;
  activeWork: ProjectDashboardWorkItemSummary[];
  employees: ProjectDashboardEmployeeContext[];
  blockers: ProjectDashboardBlockerSummary[];
  activity: ProjectDashboardActivityItem[];
  relatedFocus: ProjectDashboardRelatedFocus;
  nextSuggestedFocus?: string;
  source: ProjectDashboardSourceMetadata;
  externalSources?: ProjectDashboardSourceMetadata[];
  sections: ProjectDashboardSectionAvailability[];
};

export type ProjectDashboardListItem = {
  projectId: string;
  name: string;
  status: ProjectPortalProjectStatus;
  progressPercent?: number;
  healthLabel?: string;
};

export type ProjectDashboardProviderContext = {
  generatedAt?: string;
  companyProgression?: CompanyProgressionSnapshot;
  companyFocus?: CompanyFocusSummary;
  [sourceKey: string]: unknown;
};

export type ProjectDashboardProvider = {
  readonly id: ProjectDashboardProviderId;
  readonly label: string;
  listProjects(context?: ProjectDashboardProviderContext): ProjectDashboardListItem[];
  getProjectSnapshot(context: ProjectDashboardProviderContext | undefined, projectId: string): ProjectDashboardSnapshot;
};

export function createProjectDashboardSectionAvailability(
  id: ProjectDashboardSectionId,
  label: string,
  status: ProjectDashboardSectionStatus,
  message?: string,
): ProjectDashboardSectionAvailability {
  return {
    id,
    label,
    status,
    message,
  };
}

export function createUnavailableProjectDashboardSnapshot(
  providerId: ProjectDashboardProviderId,
  generatedAt: string,
  projectId: string,
): ProjectDashboardSnapshot {
  return {
    providerId,
    generatedAt,
    project: {
      projectId,
      name: "Project unavailable",
      status: "Unavailable",
      isAvailable: false,
    },
    progress: {
      completedWorkCount: 0,
      totalWorkCount: 0,
      label: "Progress unavailable",
    },
    health: {
      status: "unknown",
      label: "Project unavailable",
      reason: "The selected project could not be found in the current dashboard source.",
      signals: [],
    },
    activeWork: [],
    employees: [],
    blockers: [],
    activity: [],
    relatedFocus: {
      employeeFocusLabels: [],
      summary: "No project focus is available.",
    },
    source: {
      sourceType: "internal-simulation",
      sourceId: projectId,
      mappingConfidence: "native",
    },
    sections: [
      createProjectDashboardSectionAvailability("project_summary", "Project Summary", "unavailable", "Project not found."),
      createProjectDashboardSectionAvailability("project_progress", "Project Progress", "unavailable"),
      createProjectDashboardSectionAvailability("active_work", "Active Work", "empty"),
      createProjectDashboardSectionAvailability("related_employees", "Related Employees", "empty"),
      createProjectDashboardSectionAvailability("blockers", "Blockers", "empty"),
      createProjectDashboardSectionAvailability("recent_activity", "Recent Activity", "empty"),
      createProjectDashboardSectionAvailability("related_focus", "Related Focus", "empty"),
      createProjectDashboardSectionAvailability("project_health", "Project Health", "unavailable"),
      createProjectDashboardSectionAvailability("source_metadata", "Source Metadata", "available"),
    ],
  };
}
