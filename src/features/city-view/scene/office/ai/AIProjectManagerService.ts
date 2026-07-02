import type { Employee } from "../employees/EmployeeTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { TaskActivity, ProjectTask } from "../tasks/ProjectTaskTypes";
import type { AIService } from "./AIService";
import type {
  NextActionRecommendation,
  ProjectHealthSummary,
  ProjectManagementSuggestion,
  ProjectRisk,
} from "./AIProjectManagerTypes";

export class AIProjectManagerService {
  constructor(private readonly aiService: AIService) {}

  async summarizeProjectHealth(
    project: ProjectPortalProject,
    tasks: ProjectTask[],
    employees: Employee[],
    activityLogs: TaskActivity[],
  ): Promise<ProjectHealthSummary> {
    const analyses = await Promise.all(tasks.map((task) => this.aiService.analyzeTask(task)));
    const completedTasks = tasks.filter((task) => task.status === "Done").length;
    const activeTasks = tasks.length - completedTasks;
    const activeEmployees = employees.filter((employee) => employee.status === "Working").length;
    const highDifficultyCount = analyses.filter((analysis) => analysis.difficulty === "High" || analysis.difficulty === "Critical").length;
    const status = highDifficultyCount > 1 ? "at_risk" : activeTasks > 0 ? "watch" : "healthy";

    return {
      projectId: project.id,
      status,
      summary: `${project.name} has ${activeTasks} active task${activeTasks === 1 ? "" : "s"} and ${completedTasks} completed task${completedTasks === 1 ? "" : "s"}.`,
      totalTasks: tasks.length,
      activeTasks,
      completedTasks,
      activeEmployees,
      recentActivityCount: activityLogs.length,
    };
  }

  async identifyProjectRisks(
    project: ProjectPortalProject,
    tasks: ProjectTask[],
    employees: Employee[],
  ): Promise<ProjectRisk[]> {
    const analyses = await Promise.all(tasks.map((task) => this.aiService.analyzeTask(task)));
    const risks: ProjectRisk[] = [];
    const unassignedActiveTasks = tasks.filter((task) => task.status !== "Done" && !task.assigneeId && !task.assignee);
    const criticalTasks = analyses.filter((analysis) => analysis.difficulty === "Critical");

    if (unassignedActiveTasks.length > 0) {
      risks.push({
        id: `${project.id}-unassigned-active-tasks`,
        projectId: project.id,
        severity: "medium",
        message: `${unassignedActiveTasks.length} active task${unassignedActiveTasks.length === 1 ? " is" : "s are"} unassigned.`,
        relatedTaskIds: unassignedActiveTasks.map((task) => task.id),
      });
    }

    if (criticalTasks.length > 0) {
      risks.push({
        id: `${project.id}-critical-task-load`,
        projectId: project.id,
        severity: "high",
        message: `${criticalTasks.length} task${criticalTasks.length === 1 ? " has" : "s have"} critical difficulty.`,
        relatedTaskIds: criticalTasks.map((analysis) => analysis.taskId),
      });
    }

    if (employees.length === 0) {
      risks.push({
        id: `${project.id}-no-employees-loaded`,
        projectId: project.id,
        severity: "low",
        message: "No employees are loaded for project planning yet.",
        relatedTaskIds: [],
      });
    }

    return risks;
  }

  async recommendNextAction(
    project: ProjectPortalProject,
    tasks: ProjectTask[],
    employees: Employee[],
  ): Promise<NextActionRecommendation> {
    const nextTask = tasks.find((task) => task.status === "Todo") ?? tasks.find((task) => task.status === "In Progress") ?? tasks.find((task) => task.status === "Review");
    if (!nextTask) {
      return {
        projectId: project.id,
        action: "Review completed work",
        reason: "No active project tasks need placeholder work right now.",
      };
    }

    if (employees.length === 0) {
      return {
        projectId: project.id,
        action: "Load employees for planning",
        reason: `${nextTask.title} needs staffing context before a recommendation can be prepared.`,
        taskId: nextTask.id,
      };
    }

    const recommendation = await this.aiService.recommendEmployeeForTask(nextTask, employees);
    return {
      projectId: project.id,
      action: nextTask.assignee ? "Continue task progression" : "Prepare employee assignment",
      reason: recommendation.reasons[0] ?? `${nextTask.title} is the next active task.`,
      taskId: nextTask.id,
      employeeId: recommendation.recommendedEmployeeId,
    };
  }

  async createProjectManagementSuggestion(
    project: ProjectPortalProject,
    tasks: ProjectTask[],
    employees: Employee[],
    activityLogs: TaskActivity[],
    createdAt = new Date().toISOString(),
  ): Promise<ProjectManagementSuggestion> {
    const [healthSummary, risks, nextAction] = await Promise.all([
      this.summarizeProjectHealth(project, tasks, employees, activityLogs),
      this.identifyProjectRisks(project, tasks, employees),
      this.recommendNextAction(project, tasks, employees),
    ]);

    return {
      projectId: project.id,
      healthSummary,
      risks,
      nextAction,
      createdAt,
    };
  }
}