import type { TaskCollection } from "./ProjectTaskTypes";

export interface ProjectTaskProvider {
  getTaskCollection(projectId: string): Promise<TaskCollection>;
}