import { DEFAULT_EMPLOYEE_INSIGHT_CONFIG } from "./EmployeeInsightConfig";
import type {
  EmployeeInsightConfig,
  EmployeeInsightPlayerPosition,
  EmployeeInsightSource,
  EmployeeInsightState,
  EmployeeInsightTarget,
  EmployeeInsightViewModel,
} from "./EmployeeInsightTypes";

export class EmployeeInsightService {
  private readonly config: EmployeeInsightConfig;

  constructor(config: Partial<EmployeeInsightConfig> = {}) {
    this.config = {
      ...DEFAULT_EMPLOYEE_INSIGHT_CONFIG,
      ...config,
    };
  }

  getInsightState(
    playerPosition: EmployeeInsightPlayerPosition,
    sources: ReadonlyArray<EmployeeInsightSource>,
  ): EmployeeInsightState {
    const target = this.getNearestTarget(playerPosition, sources);
    if (!target) return {};

    return {
      target,
      viewModel: createViewModel(target, this.config),
    };
  }

  getNearestTarget(
    playerPosition: EmployeeInsightPlayerPosition,
    sources: ReadonlyArray<EmployeeInsightSource>,
  ): EmployeeInsightTarget | undefined {
    return sources
      .map((source) => createTarget(playerPosition, source))
      .filter((target): target is EmployeeInsightTarget => isTargetInsideRadius(target, this.config.proximityRadius))
      .sort((left, right) => left.distance - right.distance || left.employeeId.localeCompare(right.employeeId))[0];
  }
}

function isTargetInsideRadius(target: EmployeeInsightTarget | undefined, proximityRadius: number): target is EmployeeInsightTarget {
  return target !== undefined && target.distance <= proximityRadius;
}

function createTarget(
  playerPosition: EmployeeInsightPlayerPosition,
  source: EmployeeInsightSource,
): EmployeeInsightTarget | undefined {
  if (!source.movementPosition) return undefined;

  const distance = getDistance(playerPosition, source.movementPosition);
  if (!Number.isFinite(distance)) return undefined;

  return {
    employeeId: source.employeeId,
    distance,
    source,
  };
}

function createViewModel(target: EmployeeInsightTarget, config: EmployeeInsightConfig): EmployeeInsightViewModel {
  const { source } = target;
  const taskLabel = source.currentTask?.title ?? config.fallbackTaskLabel;
  const projectLabel = source.currentProject?.name ?? config.fallbackProjectLabel;

  return {
    employeeId: source.employeeId,
    titleName: source.name,
    roleLabel: source.role,
    aiStateLabel: formatStateLabel(source.aiState),
    taskLabel,
    progressLabel: formatProgressLabel(source, config),
    projectLabel,
    moodLabel: source.mood?.label,
    thinkingText: createThinkingText(source, taskLabel, projectLabel, config),
    distance: target.distance,
  };
}

function formatProgressLabel(source: EmployeeInsightSource, config: EmployeeInsightConfig) {
  if (!source.workProgress) return config.fallbackProgressLabel;
  if (source.workProgress.percent === undefined) return source.workProgress.label;

  return `${source.workProgress.label} (${source.workProgress.percent}%)`;
}

function createThinkingText(
  source: EmployeeInsightSource,
  taskLabel: string,
  projectLabel: string,
  config: EmployeeInsightConfig,
) {
  if (source.currentTask) return `Thinking about ${taskLabel} for ${projectLabel}.`;

  if (source.aiState === "walking") return "Thinking about getting to the right place.";
  if (source.aiState === "working") return `Thinking about ${taskLabel}.`;
  if (source.aiState === "talking") return "Thinking about the current conversation context.";
  if (source.aiState === "taking_break") return "Thinking about recharging before the next focus block.";
  if (source.aiState === "going_home") return "Thinking about wrapping up for the day.";

  if (taskLabel !== config.fallbackTaskLabel) return `Thinking about ${taskLabel}.`;
  return "Thinking about the next useful task.";
}

function formatStateLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getDistance(left: EmployeeInsightPlayerPosition, right: EmployeeInsightPlayerPosition) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
