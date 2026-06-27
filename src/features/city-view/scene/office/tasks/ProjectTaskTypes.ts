export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type TaskStatus = "Todo" | "In Progress" | "Review" | "Done";

export type TaskActivityType = "employee_assigned" | "status_changed" | "note_added" | "placeholder_action";

export type TaskActivity = {
  id: string;
  taskId: string;
  type: TaskActivityType;
  message: string;
  createdAt: string;
  actorId?: string;
  actorName?: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignee?: string;
  assigneeId?: string;
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
  activityLog?: TaskActivity[];
};

export type TaskCollection = {
  projectId: string;
  tasks: ProjectTask[];
};