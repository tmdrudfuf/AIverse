import type { EmployeeInsightConfig } from "./EmployeeInsightTypes";

export const DEFAULT_EMPLOYEE_INSIGHT_PROXIMITY_RADIUS = 72;

export const DEFAULT_EMPLOYEE_INSIGHT_CONFIG = {
  proximityRadius: DEFAULT_EMPLOYEE_INSIGHT_PROXIMITY_RADIUS,
  hideWhenBlockingOverlayOpen: true,
  fallbackTaskLabel: "Between tasks",
  fallbackProjectLabel: "No active project",
  fallbackProgressLabel: "Progress unavailable",
} satisfies EmployeeInsightConfig;
