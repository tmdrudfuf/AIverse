export type EmployeeRole = "Engineer" | "QA" | "Designer" | "CTO";

export type EmployeeStatus = "Idle" | "Working" | "Offline";

export type EmployeeProviderKind = "placeholder" | "openai" | "codex-cli" | "claude-code" | "gemini" | "mcp";

export type EmployeeSchedule = {
  timezone?: string;
  availableFrom?: string;
  availableUntil?: string;
};

export type Employee = {
  id: string;
  name: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  avatarColor: string;
  assignedTaskId?: string;
  currentProjectId?: string;
  capabilities: string[];
  description: string;
  provider?: EmployeeProviderKind;
  schedule?: EmployeeSchedule;
};