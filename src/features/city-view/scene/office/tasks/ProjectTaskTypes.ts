export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignee?: string;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskCollection = {
  projectId: string;
  tasks: ProjectTask[];
};