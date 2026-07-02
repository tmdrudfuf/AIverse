import { describe, expect, it } from "vitest";

import { EmployeeKnowledgeService } from "./EmployeeKnowledgeService";
import type { EmployeeKnowledgeActivitySource, EmployeeKnowledgeSource } from "./EmployeeKnowledgeTypes";
import type { EmployeeInsightSource } from "../insight/EmployeeInsightTypes";
import type { TaskStatus } from "../tasks/ProjectTaskTypes";

describe("EmployeeKnowledgeService reasoning and goals", () => {
  it("derives Why and Current Goal from active work context", () => {
    const service = new EmployeeKnowledgeService();

    const state = service.getKnowledgeState(createKnowledgeSource({
      aiState: "working",
      currentProject: { id: "daily-proof", name: "Daily Proof" },
      currentTask: { id: "task-1", title: "Build knowledge panel", status: "In Progress" },
      workProgress: { label: "In Progress", percent: 40, status: "In Progress" },
    }));

    expect(state.reason).toEqual({
      summary: "Working because Build knowledge panel is active for Daily Proof.",
      sourceKinds: ["employee_ai", "task", "project"],
    });
    expect(state.goal).toMatchObject({
      summary: "Advance Build knowledge panel for Daily Proof.",
      sourceTaskId: "task-1",
      sourceProjectId: "daily-proof",
      aiState: "working",
      simulationState: "working",
    });
    expect(state.viewModel).toMatchObject({
      employeeId: "employee-1",
      whyText: "Working because Build knowledge panel is active for Daily Proof.",
      currentGoalText: "Advance Build knowledge panel for Daily Proof.",
      progressLabel: "In Progress (40%)",
    });
  });

  it("derives movement, break, conversation, idle, and missing-task reasons from source state", () => {
    const service = new EmployeeKnowledgeService();

    const walking = service.getKnowledgeState(createKnowledgeSource({
      aiState: "walking",
      currentProject: null,
      currentTask: null,
      scheduleState: "focused",
      movementZone: "workstation",
    }));
    const breakState = service.getKnowledgeState(createKnowledgeSource({
      aiState: "taking_break",
      currentProject: null,
      currentTask: null,
      scheduleState: "onBreak",
    }));
    const talking = service.getKnowledgeState(createKnowledgeSource({
      aiState: "talking",
      conversationContext: { projectName: "Daily Proof" },
      currentProject: null,
      currentTask: null,
    }));
    const idle = service.getKnowledgeState(createKnowledgeSource({
      aiState: "idle",
      currentProject: null,
      currentTask: null,
      simulationState: "idle",
    }));

    expect(walking.reason?.summary).toBe("Walking because their schedule is guiding them toward workstation.");
    expect(walking.goal?.summary).toBe("Reach the scheduled focus area.");
    expect(breakState.reason?.summary).toBe("Taking a break because the current schedule block is onBreak.");
    expect(breakState.goal?.summary).toBe("Recharge before the next work block.");
    expect(talking.reason?.summary).toBe("Talking because existing conversation context is active.");
    expect(talking.goal?.summary).toBe("Finish the current conversation context.");
    expect(idle.reason?.summary).toBe("Waiting for clearer simulation context.");
    expect(idle.goal?.summary).toBe("Looking for the next useful task.");
  });
});

describe("EmployeeKnowledgeService schedule, confidence, and fallbacks", () => {
  it("derives schedule summary and planned next activity from schedule snapshots", () => {
    const service = new EmployeeKnowledgeService();

    const state = service.getKnowledgeState(createKnowledgeSource({
      scheduleBlocks: {
        current: { label: "Deep Work", type: "focusWork" },
        next: { label: "Team Sync", type: "meeting" },
      },
      scheduleState: "focused",
    }));

    expect(state.viewModel?.scheduleSummary).toEqual({
      currentBlockLabel: "Deep Work",
      currentScheduleState: "focused",
      nextBlockLabel: "Team Sync",
      plannedNextActivityText: "Next: Team Sync.",
    });
    expect(state.viewModel?.plannedNextActivityText).toBe("Next: Team Sync.");
  });

  it("omits optional confidence and schedule fields when source data is unavailable", () => {
    const service = new EmployeeKnowledgeService({
      fallbackProgressLabel: "No progress",
      fallbackProjectLabel: "No project",
      fallbackTaskLabel: "No task",
    });

    const state = service.getKnowledgeState(createKnowledgeSource({
      aiState: "idle",
      currentProject: null,
      currentTask: null,
      scheduleSnapshot: null,
      workProgress: null,
    }));

    expect(state.viewModel?.taskLabel).toBe("No task");
    expect(state.viewModel?.projectLabel).toBe("No project");
    expect(state.viewModel?.progressLabel).toBe("No progress");
    expect(state.viewModel?.confidenceLabel).toBeUndefined();
    expect(state.viewModel?.scheduleSummary).toBeUndefined();
    expect(state.viewModel?.plannedNextActivityText).toBeUndefined();
  });

  it("uses source-provided confidence without inventing a score", () => {
    const service = new EmployeeKnowledgeService();

    const withConfidence = service.getKnowledgeState(createKnowledgeSource({
      confidence: { label: "High confidence", percent: 88, sourceKind: "employee_ai" },
    }));
    const withoutConfidence = service.getKnowledgeState(createKnowledgeSource());

    expect(withConfidence.reason?.confidence).toEqual({ label: "High confidence", percent: 88, sourceKind: "employee_ai" });
    expect(withConfidence.viewModel?.confidenceLabel).toBe("High confidence (88%)");
    expect(withoutConfidence.viewModel?.confidenceLabel).toBeUndefined();
  });
});

describe("EmployeeKnowledgeService recent activity timeline", () => {
  it("derives a newest-first limited timeline from existing activity sources", () => {
    const service = new EmployeeKnowledgeService({ timelineLimit: 3 });

    const state = service.getKnowledgeState(createKnowledgeSource({
      activitySources: [
        {
          kind: "task_activity",
          activity: {
            id: "activity-1",
            taskId: "task-1",
            type: "work_started",
            message: "Started work",
            createdAt: "2026-01-01T09:00:00.000Z",
          },
        },
        {
          kind: "work_session",
          workSession: {
            id: "session-1",
            taskId: "task-1",
            projectId: "daily-proof",
            employeeId: "employee-1",
            employeeName: "Ada",
            provider: "placeholder",
            status: "finished",
            startedAt: "2026-01-01T09:15:00.000Z",
            finishedAt: "2026-01-01T09:45:00.000Z",
            summary: "Completed implementation.",
          },
        },
        {
          kind: "ai_transition",
          employeeId: "employee-1",
          fromState: "idle",
          toState: "working",
          reason: "context_update",
          occurredAt: "2026-01-01T09:10:00.000Z",
        },
        {
          kind: "schedule",
          employeeId: "employee-1",
          label: "Focus Work",
          scheduleState: "focused",
          occurredAt: "2026-01-01T08:30:00.000Z",
        },
      ],
    }));

    expect(state.viewModel?.recentActivityTimeline).toEqual([
      {
        id: "work-session-session-1",
        label: "Finished work session: Completed implementation.",
        sourceId: "session-1",
        sourceKind: "work_session",
        timeLabel: "09:45",
      },
      {
        id: "ai-transition-employee-1-2026-01-01T09:10:00.000Z",
        label: "AI state changed from idle to working.",
        sourceId: "employee-1",
        sourceKind: "employee_ai",
        timeLabel: "09:10",
      },
      {
        id: "task-activity-activity-1",
        label: "Started work",
        sourceId: "task-1",
        sourceKind: "task",
        timeLabel: "09:00",
      },
    ]);
  });

  it("does not create fake timeline events when sources are empty", () => {
    const service = new EmployeeKnowledgeService();

    const state = service.getKnowledgeState(createKnowledgeSource({ activitySources: [] }));

    expect(state.viewModel?.recentActivityTimeline).toEqual([]);
  });
});

function createKnowledgeSource(options: {
  activitySources?: ReadonlyArray<EmployeeKnowledgeActivitySource>;
  aiState?: EmployeeInsightSource["aiState"];
  confidence?: EmployeeKnowledgeSource["confidence"];
  conversationContext?: EmployeeKnowledgeSource["conversationContext"];
  currentProject?: { id: string; name: string } | null;
  currentTask?: { id: string; title: string; status: TaskStatus } | null;
  employeeId?: string;
  movementZone?: EmployeeInsightSource["movementSnapshot"] extends infer Snapshot
    ? Snapshot extends { positionHint: { zone: infer Zone } }
      ? Zone
      : never
    : never;
  name?: string;
  scheduleBlocks?: {
    current?: { label: string; type: "arrive" | "focusWork" | "meeting" | "break" | "lunch" | "leave" };
    next?: { label: string; type: "arrive" | "focusWork" | "meeting" | "break" | "lunch" | "leave" };
  };
  scheduleSnapshot?: EmployeeInsightSource["scheduleSnapshot"] | null;
  scheduleState?: EmployeeInsightSource["scheduleState"];
  simulationState?: EmployeeInsightSource["simulationState"];
  workProgress?: EmployeeInsightSource["workProgress"] | null;
} = {}): EmployeeKnowledgeSource {
  const employeeId = options.employeeId ?? "employee-1";
  const project = options.currentProject === undefined
    ? { id: "daily-proof", name: "Daily Proof" }
    : options.currentProject ?? undefined;
  const task = options.currentTask === undefined
    ? { id: "task-1", title: "Build knowledge panel", status: "In Progress" as const }
    : options.currentTask ?? undefined;
  const scheduleState = options.scheduleState ?? "focused";
  const scheduleSnapshot = options.scheduleSnapshot === undefined
    ? {
        employeeId,
        scheduleId: "schedule-1",
        scheduleState,
        workdayTime: 570,
        lastUpdatedAt: "2026-01-01T09:30:00.000Z",
        positionIntent: { zone: "workstation" as const, slot: 0 },
        currentBlock: options.scheduleBlocks?.current
          ? {
              blockId: "current-block",
              type: options.scheduleBlocks.current.type,
              label: options.scheduleBlocks.current.label,
              startMinute: 540,
              endMinute: 600,
              positionIntent: { zone: "workstation" as const, slot: 0 },
            }
          : undefined,
        nextBlock: options.scheduleBlocks?.next
          ? {
              blockId: "next-block",
              type: options.scheduleBlocks.next.type,
              label: options.scheduleBlocks.next.label,
              startMinute: 600,
              endMinute: 660,
              positionIntent: { zone: "meetingArea" as const, slot: 0 },
            }
          : undefined,
      }
    : options.scheduleSnapshot ?? undefined;

  return {
    insightSource: {
      employeeId,
      name: options.name ?? "Ada",
      role: "Engineer",
      aiState: options.aiState ?? "working",
      aiSnapshot: {
        employeeId,
        currentState: options.aiState ?? "working",
        lastUpdatedAt: "2026-01-01T09:30:00.000Z",
        contextSummary: {
          simulationState: options.simulationState ?? "working",
          movementZone: options.movementZone,
          scheduleState,
        },
      },
      simulationState: options.simulationState ?? "working",
      simulationSnapshot: {
        employeeId,
        currentState: options.simulationState ?? "working",
        currentTaskId: task?.id,
        currentProjectId: project?.id,
        displayLabel: `${options.name ?? "Ada"} - Working`,
        lastStateChangeAt: "2026-01-01T09:00:00.000Z",
      },
      currentProject: project
        ? {
            id: project.id,
            name: project.name,
            description: "",
            enabled: true,
            linkedServices: [],
            nextAction: { enabled: true, label: "Review project workspace", placeholder: true },
            status: "Active",
            type: "Company",
          }
        : undefined,
      currentTask: task
        ? {
            id: task.id,
            title: task.title,
            description: "",
            status: task.status,
            priority: "Medium",
            projectId: project?.id ?? "daily-proof",
            createdAt: "2026-01-01T09:00:00.000Z",
            updatedAt: "2026-01-01T09:30:00.000Z",
          }
        : undefined,
      scheduleState,
      scheduleSnapshot,
      movementSnapshot: options.movementZone
        ? {
            employeeId,
            currentPosition: { zone: options.movementZone, slot: 0 },
            targetPosition: { zone: options.movementZone, slot: 0 },
            movementState: "moving",
            speed: 60,
            lastUpdatedAt: "2026-01-01T09:30:00.000Z",
            positionHint: { zone: options.movementZone, slot: 0 },
          }
        : undefined,
      workProgress: options.workProgress === undefined
        ? { label: "In Progress", percent: 40, status: "In Progress" }
        : options.workProgress ?? undefined,
    },
    activitySources: options.activitySources,
    confidence: options.confidence,
    conversationContext: options.conversationContext,
  };
}
