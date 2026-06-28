export type WorkSessionStatus = "queued" | "running" | "finished" | "failed" | "cancelled";

export type WorkSessionProviderKind =
  | "placeholder"
  | "openai"
  | "codex-cli"
  | "claude-code"
  | "gemini"
  | "mcp"
  | "github-actions";

export type WorkSession = {
  id: string;
  taskId: string;
  projectId: string;
  employeeId: string;
  employeeName: string;
  provider: WorkSessionProviderKind;
  status: WorkSessionStatus;
  startedAt: string;
  finishedAt?: string;
  summary?: string;
  resultType?: string;
  activityIds?: string[];
};

export type CreateWorkSessionInput = {
  taskId: string;
  projectId: string;
  employeeId: string;
  employeeName: string;
  startedAt?: string;
};