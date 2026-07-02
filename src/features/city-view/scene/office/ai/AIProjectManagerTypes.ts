export type ProjectHealthStatus = "healthy" | "watch" | "at_risk";

export type ProjectRiskSeverity = "low" | "medium" | "high";

export type ProjectHealthSummary = {
  projectId: string;
  status: ProjectHealthStatus;
  summary: string;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  activeEmployees: number;
  recentActivityCount: number;
};

export type ProjectRisk = {
  id: string;
  projectId: string;
  severity: ProjectRiskSeverity;
  message: string;
  relatedTaskIds: string[];
};

export type NextActionRecommendation = {
  projectId: string;
  action: string;
  reason: string;
  taskId?: string;
  employeeId?: string;
};

export type ProjectManagementSuggestion = {
  projectId: string;
  healthSummary: ProjectHealthSummary;
  risks: ProjectRisk[];
  nextAction: NextActionRecommendation;
  createdAt: string;
};