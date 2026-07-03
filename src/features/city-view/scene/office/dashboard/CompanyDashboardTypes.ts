import type { EmployeeAIState } from "../employees/EmployeeAITypes";
import type { EmployeeRole } from "../employees/EmployeeTypes";
import type { EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";
import type { ProjectPortalProjectStatus } from "../OfficeProjectPortalTypes";
import type { TaskStatus } from "../tasks/ProjectTaskTypes";

export const INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID = "internal-simulation";

export type CompanyDashboardSourceSystem =
  | "employee_ai"
  | "schedule"
  | "projects"
  | "company_progression"
  | "office_layout"
  | "conversation"
  | "employee_insight"
  | "employee_knowledge"
  | "work_session"
  | "task_activity";

export type CompanyDashboardSourceAvailability = {
  source: CompanyDashboardSourceSystem;
  available: boolean;
  reason?: string;
};

export type CompanyDashboardProviderId = typeof INTERNAL_SIMULATION_DASHBOARD_PROVIDER_ID | (string & {});

export type CompanyDashboardSectionStatus = "available" | "empty" | "unavailable";

export type CompanyDashboardSectionId =
  | "company_health"
  | "employee_summary"
  | "employee_states"
  | "project_summary"
  | "project_progress"
  | "current_workload"
  | "office_occupancy"
  | "current_bottlenecks"
  | "recent_company_activity"
  | "recent_conversations"
  | "company_summary"
  | "recent_productivity"
  | "current_risks";

export type CompanyDashboardSectionAvailability = {
  id: CompanyDashboardSectionId;
  label: string;
  status: CompanyDashboardSectionStatus;
  sourceSystems: CompanyDashboardSourceSystem[];
  message?: string;
};

export type CompanyDashboardSignalTone = "positive" | "neutral" | "warning" | "critical";

export type CompanyDashboardSignal = {
  id: string;
  label: string;
  description?: string;
  tone: CompanyDashboardSignalTone;
  sourceSystems: CompanyDashboardSourceSystem[];
};

export type CompanyHealthStatus = "healthy" | "stable" | "needs_attention" | "critical" | "unknown";

export type CompanyHealthSummary = {
  status: CompanyHealthStatus;
  label: string;
  score?: number;
  signals: CompanyDashboardSignal[];
  updatedAt?: string;
};

export type CompanyDashboardEmployeeStateCount = {
  state: EmployeeAIState;
  count: number;
};

export type CompanyDashboardRoleCount = {
  role: EmployeeRole;
  count: number;
};

export type CompanyDashboardEmployeeWorkItem = {
  employeeId: string;
  employeeName: string;
  role: EmployeeRole;
  aiState: EmployeeAIState;
  scheduleState?: EmployeeScheduleState;
  currentTaskId?: string;
  currentTaskTitle?: string;
  currentProjectId?: string;
  currentProjectName?: string;
  progressPercent?: number;
  moodLabel?: string;
};

export type EmployeeDashboardSummary = {
  totalEmployees: number;
  activeEmployees: number;
  idleEmployees: number;
  focusedEmployees: number;
  blockedEmployees: number;
  byState: CompanyDashboardEmployeeStateCount[];
  byRole: CompanyDashboardRoleCount[];
  currentWork: CompanyDashboardEmployeeWorkItem[];
};

export type CompanyDashboardProjectItem = {
  projectId: string;
  name: string;
  status: ProjectPortalProjectStatus;
  activeTaskCount: number;
  completedTaskCount: number;
  blockedTaskCount: number;
  progressPercent?: number;
};

export type ProjectDashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  blockedProjects: number;
  averageProgress?: number;
  projects: CompanyDashboardProjectItem[];
};

export type WorkloadSummary = {
  assignedTaskCount: number;
  unassignedTaskCount: number;
  activeWorkSessionCount: number;
  employeesWithActiveWork: number;
  availableEmployeeCount: number;
  overloadedEmployees: CompanyDashboardEmployeeWorkItem[];
};

export type OfficeOccupancySummary = {
  presentEmployees: number;
  occupiedWorkstations: number;
  availableWorkstations: number;
  reservedWorkstations: number;
  unavailableWorkstations: number;
};

export type CompanyDashboardObservationSeverity = "info" | "low" | "medium" | "high" | "critical";

export type BottleneckSummary = {
  id: string;
  severity: CompanyDashboardObservationSeverity;
  label: string;
  description: string;
  sourceSystems: CompanyDashboardSourceSystem[];
};

export type CompanyActivityType =
  | "task_activity"
  | "work_session"
  | "employee_ai"
  | "schedule"
  | "conversation"
  | "progression";

export type CompanyActivityItem = {
  id: string;
  timestamp: string;
  type: CompanyActivityType;
  label: string;
  description?: string;
  sourceId?: string;
  sourceSystems: CompanyDashboardSourceSystem[];
};

export type ConversationDashboardSummary = {
  recentCount: number;
  highlights: CompanyActivityItem[];
  lastConversationAt?: string;
};

export type ProductivitySummary = {
  completedTaskCount: number;
  activeWorkSessionCount: number;
  finishedWorkSessionCount: number;
  failedWorkSessionCount: number;
  recentProgressLabel: string;
};

export type RiskSummary = {
  id: string;
  severity: CompanyDashboardObservationSeverity;
  label: string;
  reason: string;
  sourceSystems: CompanyDashboardSourceSystem[];
};

export type CompanyDashboardSnapshot = {
  providerId: CompanyDashboardProviderId;
  generatedAt: string;
  sourceAvailability: CompanyDashboardSourceAvailability[];
  sections: CompanyDashboardSectionAvailability[];
  health: CompanyHealthSummary;
  employees: EmployeeDashboardSummary;
  projects: ProjectDashboardSummary;
  workload: WorkloadSummary;
  occupancy: OfficeOccupancySummary;
  bottlenecks: BottleneckSummary[];
  activity: CompanyActivityItem[];
  conversations: ConversationDashboardSummary;
  productivity: ProductivitySummary;
  risks: RiskSummary[];
  companySummary: string;
};

export type CompanyDashboardProviderContext = {
  generatedAt?: string;
  [sourceKey: string]: unknown;
};

export type CompanyDashboardProvider = {
  readonly id: CompanyDashboardProviderId;
  readonly label: string;
  getSnapshot(context?: CompanyDashboardProviderContext): CompanyDashboardSnapshot;
};

export type CompanyDashboardProviderRegistration = {
  provider: CompanyDashboardProvider;
  enabled: boolean;
};

export function createCompanyDashboardSectionAvailability(
  id: CompanyDashboardSectionId,
  label: string,
  sourceSystems: ReadonlyArray<CompanyDashboardSourceSystem>,
  status: CompanyDashboardSectionStatus = "unavailable",
  message?: string,
): CompanyDashboardSectionAvailability {
  return {
    id,
    label,
    status,
    sourceSystems: [...sourceSystems],
    message,
  };
}

export function createUnavailableCompanyDashboardSection(
  id: CompanyDashboardSectionId,
  label: string,
  sourceSystems: ReadonlyArray<CompanyDashboardSourceSystem>,
  message = "Source data is not available yet.",
): CompanyDashboardSectionAvailability {
  return createCompanyDashboardSectionAvailability(id, label, sourceSystems, "unavailable", message);
}

export function createEmptyCompanyDashboardSnapshot(
  providerId: CompanyDashboardProviderId,
  generatedAt: string,
  sourceAvailability: ReadonlyArray<CompanyDashboardSourceAvailability> = [],
): CompanyDashboardSnapshot {
  return {
    providerId,
    generatedAt,
    sourceAvailability: sourceAvailability.map((source) => ({ ...source })),
    sections: createDefaultUnavailableSections(),
    health: {
      status: "unknown",
      label: "Company health unavailable",
      signals: [],
    },
    employees: {
      totalEmployees: 0,
      activeEmployees: 0,
      idleEmployees: 0,
      focusedEmployees: 0,
      blockedEmployees: 0,
      byState: [],
      byRole: [],
      currentWork: [],
    },
    projects: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      blockedProjects: 0,
      projects: [],
    },
    workload: {
      assignedTaskCount: 0,
      unassignedTaskCount: 0,
      activeWorkSessionCount: 0,
      employeesWithActiveWork: 0,
      availableEmployeeCount: 0,
      overloadedEmployees: [],
    },
    occupancy: {
      presentEmployees: 0,
      occupiedWorkstations: 0,
      availableWorkstations: 0,
      reservedWorkstations: 0,
      unavailableWorkstations: 0,
    },
    bottlenecks: [],
    activity: [],
    conversations: {
      recentCount: 0,
      highlights: [],
    },
    productivity: {
      completedTaskCount: 0,
      activeWorkSessionCount: 0,
      finishedWorkSessionCount: 0,
      failedWorkSessionCount: 0,
      recentProgressLabel: "No recent productivity data.",
    },
    risks: [],
    companySummary: "Company dashboard data is not available yet.",
  };
}

function createDefaultUnavailableSections(): CompanyDashboardSectionAvailability[] {
  return [
    createUnavailableCompanyDashboardSection("company_health", "Company Health", ["company_progression"]),
    createUnavailableCompanyDashboardSection("employee_summary", "Employee Summary", ["employee_ai", "schedule"]),
    createUnavailableCompanyDashboardSection("employee_states", "Employee States", ["employee_ai"]),
    createUnavailableCompanyDashboardSection("project_summary", "Project Summary", ["projects"]),
    createUnavailableCompanyDashboardSection("project_progress", "Project Progress", ["projects", "task_activity"]),
    createUnavailableCompanyDashboardSection("current_workload", "Current Workload", ["projects", "work_session"]),
    createUnavailableCompanyDashboardSection("office_occupancy", "Office Occupancy", ["office_layout"]),
    createUnavailableCompanyDashboardSection("current_bottlenecks", "Current Bottlenecks", ["employee_ai", "projects"]),
    createUnavailableCompanyDashboardSection("recent_company_activity", "Recent Company Activity", ["task_activity", "work_session"]),
    createUnavailableCompanyDashboardSection("recent_conversations", "Recent Conversations", ["conversation"]),
    createUnavailableCompanyDashboardSection("company_summary", "Company Summary", ["company_progression", "projects"]),
    createUnavailableCompanyDashboardSection("recent_productivity", "Recent Productivity", ["task_activity", "work_session"]),
    createUnavailableCompanyDashboardSection("current_risks", "Current Risks", ["employee_ai", "projects", "company_progression"]),
  ];
}
