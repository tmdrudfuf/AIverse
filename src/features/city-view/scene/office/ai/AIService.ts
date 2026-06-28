import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { AIProvider } from "./AIProvider";
import type {
  AIActivityMessageInput,
  AIActivityMessageResult,
  EmployeeRecommendationResult,
  TaskAnalysis,
  WorkSessionSummaryResult,
} from "./AITypes";

export class AIService {
  constructor(private readonly provider: AIProvider) {}

  analyzeTask(task: ProjectTask): Promise<TaskAnalysis> {
    return this.provider.analyzeTask(task);
  }

  recommendEmployeeForTask(task: ProjectTask, employees: Employee[]): Promise<EmployeeRecommendationResult> {
    return this.provider.recommendEmployeeForTask(task, employees);
  }

  summarizeWorkSession(session: WorkSession): Promise<WorkSessionSummaryResult> {
    return this.provider.summarizeWorkSession(session);
  }

  generateActivityMessage(input: AIActivityMessageInput): Promise<AIActivityMessageResult> {
    return this.provider.generateActivityMessage(input);
  }
}