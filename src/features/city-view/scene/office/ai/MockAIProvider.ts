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

export class MockAIProvider implements AIProvider {
  async analyzeTask(task: ProjectTask): Promise<TaskAnalysis> {
    const requiredSkills = getRequiredSkills(task);
    const difficulty = getDifficulty(task);
    const estimatedHours = task.estimatedHours ?? getEstimatedHours(difficulty);

    return {
      taskId: task.id,
      difficulty,
      estimatedHours,
      requiredSkills,
      priority: task.priority,
      reasoning: `${task.title} is estimated as ${difficulty} because it is ${task.priority} priority and focuses on ${requiredSkills.join(", ")}.`,
    };
  }

  async recommendEmployeeForTask(task: ProjectTask, employees: Employee[]): Promise<EmployeeRecommendationResult> {
    const preferredRole = getPreferredRole(task);
    const recommendedEmployee = employees.find((employee) => employee.role === preferredRole) ?? employees[0];

    return {
      taskId: task.id,
      employeeId: recommendedEmployee?.id,
      employeeName: recommendedEmployee?.name,
      reason: recommendedEmployee
        ? `${recommendedEmployee.role} matches the current placeholder task focus.`
        : "No employees are available for recommendation.",
      confidence: recommendedEmployee ? 0.75 : 0,
    };
  }

  async summarizeWorkSession(session: WorkSession): Promise<WorkSessionSummaryResult> {
    return {
      sessionId: session.id,
      summary: `${session.employeeName} has a ${session.status} ${session.provider} work session for task ${session.taskId}.`,
      status: session.status,
    };
  }

  async generateActivityMessage(input: AIActivityMessageInput): Promise<AIActivityMessageResult> {
    return {
      message: getActivityMessage(input),
    };
  }
}

function getRequiredSkills(task: ProjectTask) {
  const text = `${task.title} ${task.description}`.toLowerCase();
  if (text.includes("auth")) return ["Authentication", "Security"];
  if (text.includes("camera") || text.includes("navigation")) return ["UX", "Interaction"];
  if (text.includes("repository") || text.includes("integration")) return ["Integration", "Developer Workflow"];
  return ["Planning", "Implementation"];
}

function getDifficulty(task: ProjectTask) {
  if (task.priority === "Critical") return "Critical" as const;
  if (task.priority === "High") return "High" as const;
  if ((task.estimatedHours ?? 0) >= 4) return "Medium" as const;
  return task.priority;
}

function getEstimatedHours(difficulty: ReturnType<typeof getDifficulty>) {
  if (difficulty === "Critical") return 8;
  if (difficulty === "High") return 6;
  if (difficulty === "Medium") return 3;
  return 1;
}

function getPreferredRole(task: ProjectTask) {
  const text = `${task.title} ${task.description}`.toLowerCase();
  if (text.includes("review") || text.includes("test") || text.includes("bug")) return "QA" as const;
  if (text.includes("ui") || text.includes("ux") || text.includes("camera") || text.includes("graphics")) return "Designer" as const;
  if (text.includes("plan") || text.includes("architecture")) return "CTO" as const;
  return "Engineer" as const;
}

function getActivityMessage(input: AIActivityMessageInput) {
  if (input.type === "work_started") {
    return `${input.employeeName ?? "Employee"} started placeholder work session`;
  }

  if (input.type === "employee_assigned") {
    return `${input.employeeName ?? "Employee"} assigned to task`;
  }

  if (input.type === "status_changed") {
    return input.status ? `Task status changed to ${input.status}` : "Task status changed";
  }

  return "Placeholder action recorded";
}