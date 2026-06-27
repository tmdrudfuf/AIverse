import type { ProjectTaskProvider } from "./ProjectTaskProvider";
import type { TaskCollection } from "./ProjectTaskTypes";

export class ProjectTaskService {
  constructor(private readonly provider: ProjectTaskProvider) {}

  async getTaskCollection(projectId: string): Promise<TaskCollection> {
    try {
      const collection = await this.provider.getTaskCollection(projectId);
      return {
        projectId: collection.projectId || projectId,
        tasks: collection.tasks.map((task) => ({ ...task, projectId: task.projectId || projectId })),
      };
    } catch {
      return {
        projectId,
        tasks: [],
      };
    }
  }
}