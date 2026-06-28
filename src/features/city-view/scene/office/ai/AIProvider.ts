import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type {
  AIActivityMessageInput,
  AIActivityMessageResult,
  EmployeeRecommendationResult,
  TaskAnalysisResult,
  WorkSessionSummaryResult,
} from "./AITypes";

export interface AIProvider {
  analyzeTask(task: ProjectTask): Promise<TaskAnalysisResult>;
  recommendEmployeeForTask(task: ProjectTask, employees: Employee[]): Promise<EmployeeRecommendationResult>;
  summarizeWorkSession(session: WorkSession): Promise<WorkSessionSummaryResult>;
  generateActivityMessage(input: AIActivityMessageInput): Promise<AIActivityMessageResult>;
}