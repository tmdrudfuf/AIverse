import type { EmployeeConversationContext } from "../conversations/EmployeeConversationTypes";
import type { EmployeeAIState } from "../employees/EmployeeAITypes";
import type { EmployeeSimulationState } from "../employees/EmployeeSimulationTypes";
import type { EmployeeInsightProgress, EmployeeInsightSource, EmployeeInsightTarget } from "../insight/EmployeeInsightTypes";
import type { CompanyProgressionMilestone } from "../progression/CompanyProgressionTypes";
import type { EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";
import type { TaskActivity } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";

export type EmployeeKnowledgeConfig = {
  timelineLimit: number;
  fallbackTaskLabel: string;
  fallbackProjectLabel: string;
  fallbackProgressLabel: string;
  fallbackWhyLabel: string;
  fallbackGoalLabel: string;
  fallbackScheduleLabel: string;
  fallbackNextActivityLabel: string;
  fallbackConfidenceLabel: string;
};

export type EmployeeKnowledgeSourceKind =
  | "employee_ai"
  | "simulation"
  | "schedule"
  | "project"
  | "task"
  | "work_session"
  | "conversation"
  | "progression"
  | "insight";

export type EmployeeKnowledgeConfidence = {
  label: string;
  percent?: number;
  sourceKind?: EmployeeKnowledgeSourceKind;
};

export type EmployeeKnowledgeReason = {
  summary: string;
  sourceKinds: EmployeeKnowledgeSourceKind[];
  confidence?: EmployeeKnowledgeConfidence;
};

export type EmployeeKnowledgeGoal = {
  summary: string;
  sourceTaskId?: string;
  sourceProjectId?: string;
  aiState?: EmployeeAIState;
  simulationState?: EmployeeSimulationState;
  scheduleState?: EmployeeScheduleState;
};

export type EmployeeKnowledgeScheduleSummary = {
  currentBlockLabel?: string;
  currentScheduleState?: EmployeeScheduleState;
  nextBlockLabel?: string;
  plannedNextActivityText?: string;
};

export type EmployeeKnowledgeActivitySource =
  | {
      kind: "task_activity";
      activity: TaskActivity;
    }
  | {
      kind: "work_session";
      workSession: WorkSession;
    }
  | {
      kind: "ai_transition";
      employeeId: string;
      fromState?: EmployeeAIState;
      toState: EmployeeAIState;
      reason?: string;
      occurredAt: string;
    }
  | {
      kind: "schedule";
      employeeId: string;
      scheduleState: EmployeeScheduleState;
      label: string;
      occurredAt: string;
    }
  | {
      kind: "progression";
      milestone: CompanyProgressionMilestone;
      occurredAt?: string;
    };

export type EmployeeKnowledgeTimelineItem = {
  id: string;
  label: string;
  timeLabel: string;
  sourceKind: EmployeeKnowledgeSourceKind;
  sourceId?: string;
};

// Knowledge is a read-only understanding layer over Insight and simulation context.
// It must not own dialogue flow, memory, relationships, management, or employee control.
export type EmployeeKnowledgeSource = {
  insightTarget?: EmployeeInsightTarget;
  insightSource: EmployeeInsightSource;
  conversationContext?: EmployeeConversationContext;
  activitySources?: ReadonlyArray<EmployeeKnowledgeActivitySource>;
  confidence?: EmployeeKnowledgeConfidence;
};

export type EmployeeKnowledgeViewModel = {
  employeeId: string;
  name: string;
  roleLabel: string;
  aiStateLabel: string;
  taskLabel: string;
  projectLabel: string;
  progressLabel: string;
  moodLabel?: string;
  thinkingText: string;
  whyText: string;
  currentGoalText: string;
  scheduleSummary?: EmployeeKnowledgeScheduleSummary;
  recentActivityTimeline: EmployeeKnowledgeTimelineItem[];
  plannedNextActivityText?: string;
  confidenceLabel?: string;
  updatedAtLabel?: string;
};

export type EmployeeKnowledgeState = {
  source?: EmployeeKnowledgeSource;
  reason?: EmployeeKnowledgeReason;
  goal?: EmployeeKnowledgeGoal;
  progress?: EmployeeInsightProgress;
  viewModel?: EmployeeKnowledgeViewModel;
};
