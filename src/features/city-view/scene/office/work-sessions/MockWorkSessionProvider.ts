import type { WorkSessionProvider } from "./WorkSessionProvider";
import type { CreateWorkSessionInput, WorkSession } from "./WorkSessionTypes";

export class MockWorkSessionProvider implements WorkSessionProvider {
  async createWorkSession(input: CreateWorkSessionInput): Promise<WorkSession> {
    const startedAt = input.startedAt ?? new Date().toISOString();

    return {
      id: `${input.taskId}-${input.employeeId}-placeholder-session-${startedAt}`,
      taskId: input.taskId,
      projectId: input.projectId,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      provider: "placeholder",
      status: "running",
      startedAt,
    };
  }
}