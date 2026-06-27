import type { ProjectTaskProvider } from "./ProjectTaskProvider";
import type { ProjectTask, TaskCollection } from "./ProjectTaskTypes";

const DAILY_PROOF_TASKS: ProjectTask[] = [
  {
    id: "daily-proof-implement-authentication",
    title: "Implement Authentication",
    description: "Implement Firebase Authentication for Daily Proof.",
    status: "Todo",
    priority: "High",
    projectId: "daily-proof",
    estimatedHours: 6,
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
    activityLog: [],
  },
  {
    id: "daily-proof-camera-navigation-polish",
    title: "Camera Navigation Polish",
    description: "Improve camera feel and edge behavior in the city and office scenes.",
    status: "In Progress",
    priority: "Medium",
    projectId: "daily-proof",
    estimatedHours: 3,
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
    activityLog: [],
  },
  {
    id: "daily-proof-repository-integration",
    title: "Repository Integration",
    description: "Add mock repository summary support to the Daily Proof workspace.",
    status: "Done",
    priority: "Low",
    projectId: "daily-proof",
    estimatedHours: 2,
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
    activityLog: [],
  },
];

export class MockProjectTaskProvider implements ProjectTaskProvider {
  async getTaskCollection(projectId: string): Promise<TaskCollection> {
    if (projectId === "daily-proof") {
      return {
        projectId,
        tasks: DAILY_PROOF_TASKS.map((task) => ({
          ...task,
          activityLog: task.activityLog ? task.activityLog.map((activity) => ({ ...activity })) : undefined,
        })),
      };
    }

    return {
      projectId,
      tasks: [],
    };
  }
}