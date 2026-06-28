import type { EmployeeRecommendationResult, TaskAnalysis } from "./ai/AITypes";
import type { ProjectManagementSuggestion } from "./ai/AIProjectManagerTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { EmployeeSimulationSnapshot } from "./employees/EmployeeSimulationTypes";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

export type ProjectPortalProjectStatus = "Active" | "Planned" | "Coming Soon";

export type ProjectPortalProjectType = "Company" | "Portfolio" | "Lab";

export type ProjectPortalViewMode =
  | "list"
  | "detail"
  | "workspace"
  | "repository-detail"
  | "task-list"
  | "task-detail"
  | "employee-selection";

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
  selectedWorkSessionId?: string;
  lastPlaceholderAction?: ProjectPortalPlaceholderAction;
  projects: ProjectPortalProject[];
  services: ProjectPortalServiceStatus[];
  workspaces: Record<string, ProjectWorkspace>;
  repositorySummaries: Record<string, GitHubRepositorySummary>;
  taskCollections: Record<string, TaskCollection>;
  taskAnalyses: Record<string, TaskAnalysis>;
  employeeRecommendations: Record<string, EmployeeRecommendationResult>;
  projectManagementSuggestions: Record<string, ProjectManagementSuggestion>;
  employees: Employee[];
  employeeSimulations: Record<string, EmployeeSimulationSnapshot>;
  employeeAssignments: Record<string, string>;
  workSessions: Record<string, WorkSession[]>;
};