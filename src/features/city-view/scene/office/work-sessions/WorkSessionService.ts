import type { WorkSessionProvider } from "./WorkSessionProvider";
import type { CreateWorkSessionInput, WorkSession } from "./WorkSessionTypes";

export class WorkSessionService {
  constructor(private readonly provider: WorkSessionProvider) {}

  createWorkSession(input: CreateWorkSessionInput): Promise<WorkSession> {
    return this.provider.createWorkSession(input);
  }
}