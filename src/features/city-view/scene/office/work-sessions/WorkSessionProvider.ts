import type { CreateWorkSessionInput, WorkSession } from "./WorkSessionTypes";

export interface WorkSessionProvider {
  createWorkSession(input: CreateWorkSessionInput): Promise<WorkSession>;
}