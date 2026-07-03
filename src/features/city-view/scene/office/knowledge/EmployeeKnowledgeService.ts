import { DEFAULT_EMPLOYEE_KNOWLEDGE_CONFIG } from "./EmployeeKnowledgeConfig";
import type {
  EmployeeKnowledgeActivitySource,
  EmployeeKnowledgeConfig,
  EmployeeKnowledgeGoal,
  EmployeeKnowledgeReason,
  EmployeeKnowledgeScheduleSummary,
  EmployeeKnowledgeSource,
  EmployeeKnowledgeSourceKind,
  EmployeeKnowledgeState,
  EmployeeKnowledgeTimelineItem,
  EmployeeKnowledgeViewModel,
} from "./EmployeeKnowledgeTypes";
import type { EmployeeAIState } from "../employees/EmployeeAITypes";
import type { EmployeeInsightProgress, EmployeeInsightSource } from "../insight/EmployeeInsightTypes";

export class EmployeeKnowledgeService {
  private readonly config: EmployeeKnowledgeConfig;

  constructor(config: Partial<EmployeeKnowledgeConfig> = {}) {
    this.config = {
      ...DEFAULT_EMPLOYEE_KNOWLEDGE_CONFIG,
      ...config,
    };
  }

  getKnowledgeState(source: EmployeeKnowledgeSource | undefined): EmployeeKnowledgeState {
    if (!source) return {};

    const reason = createReason(source, this.config);
    const goal = createGoal(source, this.config);
    const viewModel = createViewModel(source, reason, goal, this.config);

    return {
      source,
      reason,
      goal,
      progress: source.insightSource.workProgress,
      viewModel,
    };
  }
}

function createViewModel(
  source: EmployeeKnowledgeSource,
  reason: EmployeeKnowledgeReason,
  goal: EmployeeKnowledgeGoal,
  config: EmployeeKnowledgeConfig,
): EmployeeKnowledgeViewModel {
  const insight = source.insightSource;
  const taskLabel = insight.currentTask?.title ?? config.fallbackTaskLabel;
  const projectLabel = insight.currentProject?.name ?? config.fallbackProjectLabel;
  const scheduleSummary = createScheduleSummary(insight);
  const plannedNextActivityText = scheduleSummary?.plannedNextActivityText;

  return {
    employeeId: insight.employeeId,
    name: insight.name,
    roleLabel: insight.role,
    aiStateLabel: formatStateLabel(insight.aiState),
    taskLabel,
    projectLabel,
    progressLabel: formatProgressLabel(insight.workProgress, config),
    moodLabel: insight.mood?.label,
    thinkingText: createThinkingText(insight, taskLabel, projectLabel, config),
    whyText: reason.summary,
    currentGoalText: goal.summary,
    scheduleSummary,
    recentActivityTimeline: createTimeline(source.activitySources ?? [], config),
    plannedNextActivityText,
    confidenceLabel: source.confidence ? formatConfidenceLabel(source.confidence) : undefined,
    updatedAtLabel: getUpdatedAtLabel(insight),
  };
}

function createReason(source: EmployeeKnowledgeSource, config: EmployeeKnowledgeConfig): EmployeeKnowledgeReason {
  const insight = source.insightSource;
  const taskTitle = insight.currentTask?.title;
  const projectName = insight.currentProject?.name;

  if (insight.aiState === "working" && taskTitle && projectName) {
    return {
      summary: `Working because ${taskTitle} is active for ${projectName}.`,
      sourceKinds: ["employee_ai", "task", "project"],
      confidence: source.confidence,
    };
  }

  if (insight.aiState === "walking") {
    const zone = insight.movementSnapshot?.positionHint.zone ?? insight.aiSnapshot?.contextSummary.movementZone;
    return {
      summary: zone
        ? `Walking because their schedule is guiding them toward ${zone}.`
        : "Walking because existing movement context has an active destination.",
      sourceKinds: compactSourceKinds(["employee_ai", "schedule", zone ? "simulation" : undefined]),
      confidence: source.confidence,
    };
  }

  if (insight.aiState === "taking_break") {
    return {
      summary: `Taking a break because the current schedule block is ${insight.scheduleState ?? "a break"}.`,
      sourceKinds: ["employee_ai", "schedule"],
      confidence: source.confidence,
    };
  }

  if (insight.aiState === "talking") {
    return {
      summary: source.conversationContext
        ? "Talking because existing conversation context is active."
        : "Talking because Employee AI reports a conversation state.",
      sourceKinds: ["employee_ai", "conversation"],
      confidence: source.confidence,
    };
  }

  if (insight.aiState === "going_home") {
    return {
      summary: "Going home because the current schedule or simulation state indicates the day is ending.",
      sourceKinds: ["employee_ai", "schedule", "simulation"],
      confidence: source.confidence,
    };
  }

  return {
    summary: config.fallbackWhyLabel,
    sourceKinds: ["employee_ai", "insight"],
    confidence: source.confidence,
  };
}

function createGoal(source: EmployeeKnowledgeSource, config: EmployeeKnowledgeConfig): EmployeeKnowledgeGoal {
  const insight = source.insightSource;
  const taskTitle = insight.currentTask?.title;
  const projectName = insight.currentProject?.name;

  if (taskTitle && projectName) {
    return {
      summary: `Advance ${taskTitle} for ${projectName}.`,
      sourceTaskId: insight.currentTask?.id,
      sourceProjectId: insight.currentProject?.id,
      aiState: insight.aiState,
      simulationState: insight.simulationState,
      scheduleState: insight.scheduleState,
    };
  }

  return {
    summary: createGoalSummaryFromState(insight.aiState, insight.scheduleState, config),
    aiState: insight.aiState,
    simulationState: insight.simulationState,
    scheduleState: insight.scheduleState,
  };
}

function createGoalSummaryFromState(
  aiState: EmployeeAIState,
  scheduleState: EmployeeInsightSource["scheduleState"],
  config: EmployeeKnowledgeConfig,
) {
  if (aiState === "walking" && scheduleState === "focused") return "Reach the scheduled focus area.";
  if (aiState === "walking") return "Reach the next scheduled location.";
  if (aiState === "taking_break") return "Recharge before the next work block.";
  if (aiState === "talking") return "Finish the current conversation context.";
  if (aiState === "going_home") return "Wrap up and leave the office.";
  return config.fallbackGoalLabel;
}

function createScheduleSummary(insight: EmployeeInsightSource): EmployeeKnowledgeScheduleSummary | undefined {
  const schedule = insight.scheduleSnapshot;
  if (!schedule) return undefined;

  const plannedNextActivityText = schedule.nextBlock ? `Next: ${schedule.nextBlock.label}.` : undefined;

  return {
    currentBlockLabel: schedule.currentBlock?.label,
    currentScheduleState: schedule.scheduleState,
    nextBlockLabel: schedule.nextBlock?.label,
    plannedNextActivityText,
  };
}

function createTimeline(
  sources: ReadonlyArray<EmployeeKnowledgeActivitySource>,
  config: EmployeeKnowledgeConfig,
): EmployeeKnowledgeTimelineItem[] {
  return sources
    .map(createTimelineCandidate)
    .filter((item): item is TimelineCandidate => item !== undefined)
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || left.item.id.localeCompare(right.item.id))
    .slice(0, config.timelineLimit)
    .map((candidate) => candidate.item);
}

function createTimelineCandidate(source: EmployeeKnowledgeActivitySource): TimelineCandidate | undefined {
  if (source.kind === "task_activity") {
    return {
      timestamp: source.activity.createdAt,
      item: {
        id: `task-activity-${source.activity.id}`,
        label: source.activity.message,
        timeLabel: formatTimeLabel(source.activity.createdAt),
        sourceKind: "task",
        sourceId: source.activity.taskId,
      },
    };
  }

  if (source.kind === "work_session") {
    const timestamp = source.workSession.finishedAt ?? source.workSession.startedAt;
    return {
      timestamp,
      item: {
        id: `work-session-${source.workSession.id}`,
        label: formatWorkSessionLabel(source.workSession.status, source.workSession.summary),
        timeLabel: formatTimeLabel(timestamp),
        sourceKind: "work_session",
        sourceId: source.workSession.id,
      },
    };
  }

  if (source.kind === "ai_transition") {
    return {
      timestamp: source.occurredAt,
      item: {
        id: `ai-transition-${source.employeeId}-${source.occurredAt}`,
        label: source.fromState
          ? `AI state changed from ${source.fromState} to ${source.toState}.`
          : `AI state changed to ${source.toState}.`,
        timeLabel: formatTimeLabel(source.occurredAt),
        sourceKind: "employee_ai",
        sourceId: source.employeeId,
      },
    };
  }

  if (source.kind === "schedule") {
    return {
      timestamp: source.occurredAt,
      item: {
        id: `schedule-${source.employeeId}-${source.occurredAt}`,
        label: `${source.label}: ${source.scheduleState}.`,
        timeLabel: formatTimeLabel(source.occurredAt),
        sourceKind: "schedule",
        sourceId: source.employeeId,
      },
    };
  }

  if (!source.milestone.isMet || !source.occurredAt) return undefined;

  return {
    timestamp: source.occurredAt,
    item: {
      id: `progression-${source.milestone.milestoneId}`,
      label: `Company milestone met: ${source.milestone.label}.`,
      timeLabel: formatTimeLabel(source.occurredAt),
      sourceKind: "progression",
      sourceId: source.milestone.milestoneId,
    },
  };
}

function formatProgressLabel(progress: EmployeeInsightProgress | undefined, config: EmployeeKnowledgeConfig) {
  if (!progress) return config.fallbackProgressLabel;
  if (progress.percent === undefined) return progress.label;

  return `${progress.label} (${progress.percent}%)`;
}

function createThinkingText(
  insight: EmployeeInsightSource,
  taskLabel: string,
  projectLabel: string,
  config: EmployeeKnowledgeConfig,
) {
  if (insight.currentTask) return `Thinking about ${taskLabel} for ${projectLabel}.`;
  if (insight.aiState === "walking") return "Thinking about getting to the right place.";
  if (insight.aiState === "working") return `Thinking about ${taskLabel}.`;
  if (insight.aiState === "talking") return "Thinking about the current conversation context.";
  if (insight.aiState === "taking_break") return "Thinking about recharging before the next focus block.";
  if (insight.aiState === "going_home") return "Thinking about wrapping up for the day.";
  if (taskLabel !== config.fallbackTaskLabel) return `Thinking about ${taskLabel}.`;

  return "Thinking about the next useful task.";
}

function formatConfidenceLabel(confidence: NonNullable<EmployeeKnowledgeSource["confidence"]>) {
  if (confidence.percent === undefined) return confidence.label;
  return `${confidence.label} (${confidence.percent}%)`;
}

function formatWorkSessionLabel(status: string, summary: string | undefined) {
  const prefix = `${formatStateLabel(status)} work session`;
  return summary ? `${prefix}: ${summary}` : `${prefix}.`;
}

function getUpdatedAtLabel(insight: EmployeeInsightSource) {
  return insight.aiSnapshot?.lastUpdatedAt
    ?? insight.scheduleSnapshot?.lastUpdatedAt
    ?? insight.simulationSnapshot?.lastStateChangeAt;
}

function formatStateLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
}

function compactSourceKinds(values: Array<EmployeeKnowledgeSourceKind | undefined>): EmployeeKnowledgeSourceKind[] {
  return values.filter((value): value is EmployeeKnowledgeSourceKind => value !== undefined);
}

type TimelineCandidate = {
  timestamp: string;
  item: EmployeeKnowledgeTimelineItem;
};
