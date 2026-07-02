import type { EmployeeKnowledgeConfig } from "./EmployeeKnowledgeTypes";

export const DEFAULT_EMPLOYEE_KNOWLEDGE_TIMELINE_LIMIT = 4;

export const DEFAULT_EMPLOYEE_KNOWLEDGE_CONFIG = {
  timelineLimit: DEFAULT_EMPLOYEE_KNOWLEDGE_TIMELINE_LIMIT,
  fallbackTaskLabel: "Between tasks",
  fallbackProjectLabel: "No active project",
  fallbackProgressLabel: "Progress unavailable",
  fallbackWhyLabel: "Waiting for clearer simulation context.",
  fallbackGoalLabel: "Looking for the next useful task.",
  fallbackScheduleLabel: "Schedule unavailable",
  fallbackNextActivityLabel: "Next activity unavailable",
  fallbackConfidenceLabel: "Confidence unavailable",
} satisfies EmployeeKnowledgeConfig;
