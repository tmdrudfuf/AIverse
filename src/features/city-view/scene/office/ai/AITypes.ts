import type { TaskPriority, TaskStatus } from "../tasks/ProjectTaskTypes";
import type { WorkSessionProviderKind, WorkSessionStatus } from "../work-sessions/WorkSessionTypes";

export type TaskAnalysisDifficulty = "Low" | "Medium" | "High" | "Critical";

export type TaskAnalysis = {
  taskId: string;
  difficulty: TaskAnalysisDifficulty;
  estimatedHours: number;
  requiredSkills: string[];
  priority: TaskPriority;
  reasoning: string;
};

export type EmployeeRecommendationResult = {
  taskId: string;
  employeeId?: string;
  employeeName?: string;
  reason: string;
  confidence: number;
};

export type WorkSessionSummaryResult = {
  sessionId: string;
  summary: string;
  status: WorkSessionStatus;
};

export type AIActivityMessageType = "employee_assigned" | "work_started" | "status_changed" | "placeholder_action";

export type AIActivityMessageInput = {
  type: AIActivityMessageType;
  taskTitle?: string;
  employeeName?: string;
  workSessionId?: string;
  status?: TaskStatus | WorkSessionStatus;
  provider?: WorkSessionProviderKind;
};

export type AIActivityMessageResult = {
  message: string;
};