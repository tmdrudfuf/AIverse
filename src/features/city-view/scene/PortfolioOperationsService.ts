import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import { deriveLiveAgentWorkState, type LiveAgentWorkState } from "./office/LiveAgentWorkVisualization";
import { ProjectBacklogService } from "./office/project-backlog/ProjectBacklogService";
import type { ProjectBacklogSummary } from "./office/project-backlog/ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCollections } from "./office/project-backlog/ProjectBacklogSuggestionTypes";
import { ProjectBacklogSuggestionAcceptancePolicyService } from "./office/project-backlog/ProjectBacklogSuggestionAcceptancePolicyService";
import type { ProjectBacklogSuggestionAcceptancePolicies } from "./office/project-backlog/ProjectBacklogSuggestionAcceptancePolicyTypes";
import { ProjectBacklogReadinessPromotionPolicyService } from "./office/project-backlog/ProjectBacklogReadinessPromotionPolicyService";
import type { ProjectBacklogReadinessPromotionPolicies } from "./office/project-backlog/ProjectBacklogReadinessPromotionPolicyTypes";
import { ProjectAutonomousExecutionPolicyService } from "./office/project-backlog/ProjectAutonomousExecutionPolicyService";
import type { ProjectAutonomyPolicies } from "./office/project-backlog/ProjectAutonomousExecutionPolicyTypes";
import { ProjectCompanyBindingService } from "./office/project-company-binding/ProjectCompanyBindingService";
import { toProjectPortalProject } from "./office/project-registry/ProjectRegistryAdapters";

export type PortfolioAttentionState =
  | "active"
  | "idle"
  | "needs-attention"
  | "blocked"
  | "recently-completed"
  | "disconnected";

export type PortfolioFilter = "all" | "active" | "attention" | "idle" | "completed" | "disconnected";

export type PortfolioVisualTone = "active" | "warning" | "complete" | "idle" | "disconnected";

export type PortfolioOperationsSummary = {
  buildingId: string;
  projectId?: string;
  projectName: string;
  companyName: string;
  bindingStatus: "bound" | "unavailable";
  workflowStage: LiveAgentWorkState["stage"] | "disconnected";
  attentionState: PortfolioAttentionState;
  attentionLabel: string;
  tone: PortfolioVisualTone;
  activeOrResumableRunId?: string;
  developmentRequest?: {
    status: string;
    title?: string;
    summary?: string;
  };
  blockedReasonSummary?: string;
  recentCompletedSummary?: string;
  backlogSummary?: ProjectBacklogSummary;
  backlogSuggestionSummary?: string;
  backlogSuggestionAcceptanceSummary?: {
    state: "On" | "Off";
    pendingCount: number;
    text: string;
  };
  backlogReadinessPromotionSummary?: {
    state: "On" | "Off";
    backlogCount: number;
    readyCount: number;
    text: string;
  };
  autonomySummary?: {
    state: "On" | "Waiting" | "Off";
    reason?: string;
    text: string;
  };
  updatedAt?: string;
  operatorActionAvailable: boolean;
};

export type PortfolioOperationsSummaryMap = Record<string, PortfolioOperationsSummary>;

export type DerivePortfolioOperationsInput = {
  buildings: ReadonlyArray<CityBuildingDefinition>;
  state: ProjectScopedPortfolioState;
};

type LiveAgentWorkStateInput = Parameters<typeof deriveLiveAgentWorkState>[0];

type ProjectScopedPortfolioState =
  Pick<ProjectPortalState, "projectRegistryEntries"> &
  Partial<Pick<ProjectPortalState, "projectBacklogCollections" | "projectBacklogSuggestionCollections" | "projectBacklogSuggestionAcceptancePolicies" | "projectBacklogReadinessPromotionPolicies" | "projectAutonomyPolicies">> &
  Partial<LiveAgentWorkStateInput>;

export function createPortfolioOperationsFromBrowserSession(
  buildings: ReadonlyArray<CityBuildingDefinition>,
): PortfolioOperationsSummaryMap {
  return derivePortfolioOperations({
    buildings,
    state: createProjectPortalState(),
  });
}

export function derivePortfolioOperations(input: DerivePortfolioOperationsInput): PortfolioOperationsSummaryMap {
  const bindingService = new ProjectCompanyBindingService();
  return Object.fromEntries(
    input.buildings.map((building) => {
      const context = bindingService.resolveBuildingBinding(building, input.state.projectRegistryEntries);
      const summary = context.status === "unavailable"
        ? createDisconnectedSummary(building, context.projectId, context.unavailableReason)
        : createAvailableSummary({
          building,
          projectId: context.projectId,
          projectName: context.project?.displayName ?? context.displayName,
          companyName: context.companyName,
          state: input.state,
          liveWorkState: deriveLiveAgentWorkState(createLiveWorkStateInput(input.state, context)),
        });

      return [building.id, summary];
    }),
  );
}

export function filterPortfolioSummaries(
  summaries: PortfolioOperationsSummaryMap,
  filter: PortfolioFilter,
): PortfolioOperationsSummaryMap {
  return Object.fromEntries(
    Object.entries(summaries).filter(([, summary]) => portfolioSummaryMatchesFilter(summary, filter)),
  );
}

export function portfolioSummaryMatchesFilter(summary: PortfolioOperationsSummary, filter: PortfolioFilter) {
  if (filter === "all") return true;
  if (filter === "active") return summary.attentionState === "active";
  if (filter === "attention") return summary.attentionState === "needs-attention" || summary.attentionState === "blocked";
  if (filter === "idle") return summary.attentionState === "idle";
  if (filter === "completed") return summary.attentionState === "recently-completed";
  return summary.attentionState === "disconnected";
}

export function orderPortfolioSummariesForAttention(
  summaries: ReadonlyArray<PortfolioOperationsSummary>,
): PortfolioOperationsSummary[] {
  return [...summaries].sort((left, right) => {
    const priorityDiff = getAttentionPriority(left.attentionState) - getAttentionPriority(right.attentionState);
    if (priorityDiff !== 0) return priorityDiff;
    return left.companyName.localeCompare(right.companyName);
  });
}

function createAvailableSummary(input: {
  building: CityBuildingDefinition;
  projectId: string;
  projectName: string;
  companyName: string;
  state: ProjectScopedPortfolioState;
  liveWorkState: LiveAgentWorkState;
}): PortfolioOperationsSummary {
  const runStatus = input.state.externalProjectAdosRunStatuses?.[input.projectId];
  const request = input.state.externalProjectDevelopmentRequestDrafts?.[input.projectId];
  const attentionSignal = getCurrentProjectAttentionSignal(
    input.liveWorkState,
    getProjectAttentionSignal(input.state, input.projectId),
  );
  const attentionState = toAttentionState(input.liveWorkState, attentionSignal);
  const blockedReasonSummary = attentionSignal?.reasonText
    ? normalizeReason(attentionSignal.reasonText)
    : input.liveWorkState.reasonText
      ? normalizeReason(input.liveWorkState.reasonText)
    : undefined;

  const backlogSummary = new ProjectBacklogService().createSummary(
    input.state.projectBacklogCollections?.[input.projectId],
    input.projectId,
  );

  return {
    buildingId: input.building.id,
    projectId: input.projectId,
    projectName: input.projectName,
    companyName: input.companyName,
    bindingStatus: "bound",
    workflowStage: input.liveWorkState.stage,
    attentionState,
    attentionLabel: toAttentionLabel(attentionState),
    tone: toPortfolioTone(attentionState),
    activeOrResumableRunId: request?.adosRunId
      ?? runStatus?.executionId
      ?? input.state.externalProjectAdosExecutions?.[input.projectId]?.id
      ?? input.state.externalProjectAdosRunPreparations?.[input.projectId]?.id,
    developmentRequest: request
      ? {
        status: request.status,
        title: compact(request.title, 48),
        summary: compact(request.summary, 72),
      }
      : undefined,
    blockedReasonSummary,
    recentCompletedSummary: attentionState === "recently-completed"
      ? createCompletedSummary(runStatus?.status, input.liveWorkState.updatedAt)
      : undefined,
    backlogSummary,
    backlogSuggestionSummary: createBacklogSuggestionSummary(
      input.state.projectBacklogSuggestionCollections,
      input.projectId,
    ),
    backlogSuggestionAcceptanceSummary: createBacklogSuggestionAcceptanceSummary(
      input.state.projectBacklogSuggestionAcceptancePolicies,
      input.state.projectBacklogSuggestionCollections,
      input.projectId,
    ),
    backlogReadinessPromotionSummary: createBacklogReadinessPromotionSummary(
      input.state.projectBacklogReadinessPromotionPolicies,
      backlogSummary,
      input.projectId,
    ),
    autonomySummary: createAutonomySummary(
      input.state.projectAutonomyPolicies,
      input.projectId,
      backlogSummary,
      input.liveWorkState,
      runStatus?.stage,
    ),
    updatedAt: input.liveWorkState.updatedAt,
    operatorActionAvailable: true,
  };
}

function createAutonomySummary(
  policies: ProjectAutonomyPolicies | undefined,
  projectId: string,
  backlogSummary: ProjectBacklogSummary,
  liveWorkState: LiveAgentWorkState,
  runStage: string | undefined,
) {
  const policy = new ProjectAutonomousExecutionPolicyService().getPolicy(policies, projectId);
  if (!policy.enabled) {
    return { state: "Off" as const, text: "Auto: Off" };
  }

  const activeRun = liveWorkState.lifecycle !== "no-active-run" && liveWorkState.lifecycle !== "complete";
  if (activeRun || runStage === "Prepared" || runStage === "Started" || runStage === "Blocked" || runStage === "TimedOut") {
    return { state: "Waiting" as const, reason: "Active Run", text: "Auto: Waiting - Active Run" };
  }

  if (backlogSummary.readyTaskCount <= 0) {
    return { state: "Waiting" as const, reason: "No Ready Task", text: "Auto: Waiting - No Ready Task" };
  }

  if (policy.lastEvaluationReason === "PriorityNotAllowed") {
    return { state: "Waiting" as const, reason: "Priority Filter", text: "Auto: Waiting - Priority Filter" };
  }

  return { state: "On" as const, text: "Auto: On" };
}

function createBacklogReadinessPromotionSummary(
  policies: ProjectBacklogReadinessPromotionPolicies | undefined,
  backlogSummary: ProjectBacklogSummary,
  projectId: string,
) {
  const policy = new ProjectBacklogReadinessPromotionPolicyService().getPolicy(policies, projectId);
  const backlogCount = Math.max(
    backlogSummary.totalTaskCount -
      backlogSummary.readyTaskCount -
      backlogSummary.inDevelopmentTaskCount -
      backlogSummary.blockedTaskCount -
      backlogSummary.completedTaskCount,
    0,
  );
  const state = policy.enabled ? "On" as const : "Off" as const;
  return {
    state,
    backlogCount,
    readyCount: backlogSummary.readyTaskCount,
    text: `Auto Ready: ${state} - ${backlogCount} Backlog / ${backlogSummary.readyTaskCount} Ready`,
  };
}

function createBacklogSuggestionSummary(
  collections: ProjectBacklogSuggestionCollections | undefined,
  projectId: string,
) {
  const proposedCount = collections?.[projectId]?.candidates
    .filter((candidate) => candidate.projectId === projectId && candidate.status === "proposed").length ?? 0;
  if (proposedCount <= 0) return undefined;
  return `${proposedCount} AI ${proposedCount === 1 ? "suggestion" : "suggestions"} available`;
}

function createBacklogSuggestionAcceptanceSummary(
  policies: ProjectBacklogSuggestionAcceptancePolicies | undefined,
  collections: ProjectBacklogSuggestionCollections | undefined,
  projectId: string,
) {
  const policy = new ProjectBacklogSuggestionAcceptancePolicyService().getPolicy(policies, projectId);
  const pendingCount = collections?.[projectId]?.candidates
    .filter((candidate) => candidate.projectId === projectId && candidate.status === "proposed").length ?? 0;
  const state = policy.enabled ? "On" as const : "Off" as const;
  return {
    state,
    pendingCount,
    text: `AI Accept: ${state}${pendingCount > 0 ? ` - ${pendingCount} pending` : ""}`,
  };
}

function createDisconnectedSummary(
  building: CityBuildingDefinition,
  projectId: string | undefined,
  reason: string | undefined,
): PortfolioOperationsSummary {
  return {
    buildingId: building.id,
    projectId,
    projectName: building.name,
    companyName: building.name,
    bindingStatus: "unavailable",
    workflowStage: "disconnected",
    attentionState: "disconnected",
    attentionLabel: "DISCONNECTED",
    tone: "disconnected",
    blockedReasonSummary: reason ? normalizeReason(reason) : "Project unavailable",
    operatorActionAvailable: false,
  };
}

function createLiveWorkStateInput(
  state: ProjectScopedPortfolioState,
  context: ReturnType<ProjectCompanyBindingService["resolveBuildingBinding"]>,
): LiveAgentWorkStateInput {
  const projects = state.projects ?? state.projectRegistryEntries.map((entry) => toProjectPortalProject(entry, []));
  const selectedProjectIndex = projects.findIndex((project) => project.id === context.projectId);

  return {
    activeProjectCompanyContext: context.status === "unavailable" ? undefined : context,
    projects,
    selectedProjectIndex: selectedProjectIndex >= 0 ? selectedProjectIndex : 0,
    selectedProjectId: context.projectId,
    selectedProjectDashboardProjectId: context.projectId,
    externalProjectAdosRunPreparations: state.externalProjectAdosRunPreparations ?? {},
    externalProjectAdosExecutions: state.externalProjectAdosExecutions ?? {},
    externalProjectAdosExecutionResults: state.externalProjectAdosExecutionResults ?? {},
    externalProjectAdosRunStatuses: state.externalProjectAdosRunStatuses ?? {},
    externalProjectDevelopmentRequestDrafts: state.externalProjectDevelopmentRequestDrafts ?? {},
    employees: state.employees ?? [],
    implementerRuntimeCollections: state.implementerRuntimeCollections ?? {},
    implementerRuntimeResultCollections: state.implementerRuntimeResultCollections ?? {},
    reviewerRuntimeCollections: state.reviewerRuntimeCollections ?? {},
    reviewerRuntimeResultCollections: state.reviewerRuntimeResultCollections ?? {},
    reviewPromotionCollections: state.reviewPromotionCollections ?? {},
    reviewPromotionResultCollections: state.reviewPromotionResultCollections ?? {},
    reviewFixRuntimeCollections: state.reviewFixRuntimeCollections ?? {},
    reviewFixRuntimeResultCollections: state.reviewFixRuntimeResultCollections ?? {},
    validationRuntimeCollections: state.validationRuntimeCollections ?? {},
    validationRuntimeResultCollections: state.validationRuntimeResultCollections ?? {},
    postValidationReviewTargetCollections: state.postValidationReviewTargetCollections ?? {},
    postValidationReviewTargetResultCollections: state.postValidationReviewTargetResultCollections ?? {},
  };
}

type ProjectAttentionSignal = {
  attentionState: Extract<PortfolioAttentionState, "blocked" | "needs-attention">;
  reasonText: string;
  updatedAt?: string;
};

function toAttentionState(
  liveWorkState: LiveAgentWorkState,
  attentionSignal: ProjectAttentionSignal | undefined,
): PortfolioAttentionState {
  if (liveWorkState.lifecycle === "complete") return "recently-completed";
  if (liveWorkState.lifecycle === "no-active-run") return "idle";
  if (attentionSignal) return attentionSignal.attentionState;
  return liveWorkState.lifecycle === "blocked" ? "blocked" : "active";
}

function getProjectAttentionSignal(
  state: ProjectScopedPortfolioState,
  projectId: string,
): ProjectAttentionSignal | undefined {
  const signals = [
    getReviewerAttentionSignal(state, projectId),
    getValidationAttentionSignal(state, projectId),
    getReviewFixAttentionSignal(state, projectId),
    getRunStatusAttentionSignal(state, projectId),
  ].filter((signal): signal is ProjectAttentionSignal => Boolean(signal));

  return signals.sort((left, right) => compareTimestamp(right.updatedAt, left.updatedAt))[0];
}

function getCurrentProjectAttentionSignal(
  liveWorkState: LiveAgentWorkState,
  attentionSignal: ProjectAttentionSignal | undefined,
): ProjectAttentionSignal | undefined {
  if (!attentionSignal) return undefined;
  if (!attentionSignal.updatedAt || !liveWorkState.updatedAt) return attentionSignal;
  return compareTimestamp(attentionSignal.updatedAt, liveWorkState.updatedAt) < 0 ? undefined : attentionSignal;
}

function getReviewerAttentionSignal(
  state: ProjectScopedPortfolioState,
  projectId: string,
): ProjectAttentionSignal | undefined {
  const result = latestByTimestamp(state.reviewerRuntimeResultCollections?.[projectId]?.results, "resultAt");
  if (!result) return undefined;
  if (result.decision === "ChangesRequested") {
    return {
      attentionState: "needs-attention",
      reasonText: "Changes Requested",
      updatedAt: result.resultAt,
    };
  }
  if (isBlockingRuntimeStatus(result.status)) {
    return {
      attentionState: "blocked",
      reasonText: result.reasonCodes[0] ?? `Reviewer runtime ${result.status}`,
      updatedAt: result.resultAt,
    };
  }
  if (result.decision === "Unknown") {
    return {
      attentionState: "needs-attention",
      reasonText: result.reasonCodes[0] ?? "Reviewer runtime decision unknown",
      updatedAt: result.resultAt,
    };
  }
  return undefined;
}

function getValidationAttentionSignal(
  state: ProjectScopedPortfolioState,
  projectId: string,
): ProjectAttentionSignal | undefined {
  const result = latestByTimestamp(state.validationRuntimeResultCollections?.[projectId]?.results, "resultAt");
  if (!result || result.status === "Completed") return undefined;
  return {
    attentionState: result.status === "Blocked" ? "blocked" : "needs-attention",
    reasonText: result.reasonCodes[0] ?? `Validation runtime ${result.status}`,
    updatedAt: result.resultAt,
  };
}

function getReviewFixAttentionSignal(
  state: ProjectScopedPortfolioState,
  projectId: string,
): ProjectAttentionSignal | undefined {
  const result = latestByTimestamp(state.reviewFixRuntimeResultCollections?.[projectId]?.results, "resultAt");
  if (!result || result.status === "Completed") return undefined;
  return {
    attentionState: result.status === "Blocked" ? "blocked" : "needs-attention",
    reasonText: result.reasonCodes[0] ?? `Review fix runtime ${result.status}`,
    updatedAt: result.resultAt,
  };
}

function getRunStatusAttentionSignal(
  state: ProjectScopedPortfolioState,
  projectId: string,
): ProjectAttentionSignal | undefined {
  const runStatus = state.externalProjectAdosRunStatuses?.[projectId];
  if (!runStatus) return undefined;
  const statusText = normalizeReason([runStatus.stage, runStatus.status, ...(runStatus.reasonCodes ?? [])].join(" "));
  if (!isRunStatusAttention(statusText)) return undefined;
  return {
    attentionState: "blocked",
    reasonText: runStatus.reasonCodes?.[0] ?? runStatus.status,
    updatedAt: runStatus.updatedAt,
  };
}

function isBlockingRuntimeStatus(status: string) {
  return status === "Blocked" || status === "Failed" || status === "TimedOut";
}

function isRunStatusAttention(statusText: string) {
  return [
    "BLOCKED",
    "FAILED",
    "TIMED OUT",
    "TIMEDOUT",
    "CANCELLED",
    "INTERVENTION",
    "PROVIDER UNAVAILABLE",
    "SPAWN FAILED",
    "COMMAND FAILED",
    "RECOVERY",
  ].some((token) => statusText.includes(token));
}

function toAttentionLabel(attentionState: PortfolioAttentionState) {
  if (attentionState === "active") return "ACTIVE";
  if (attentionState === "needs-attention") return "NEEDS ATTENTION";
  if (attentionState === "blocked") return "BLOCKED";
  if (attentionState === "recently-completed") return "RECENTLY COMPLETED";
  if (attentionState === "disconnected") return "DISCONNECTED";
  return "IDLE";
}

function toPortfolioTone(attentionState: PortfolioAttentionState): PortfolioVisualTone {
  if (attentionState === "blocked" || attentionState === "needs-attention") return "warning";
  if (attentionState === "recently-completed") return "complete";
  if (attentionState === "idle") return "idle";
  if (attentionState === "disconnected") return "disconnected";
  return "active";
}

function getAttentionPriority(attentionState: PortfolioAttentionState) {
  if (attentionState === "blocked") return 1;
  if (attentionState === "needs-attention") return 2;
  if (attentionState === "active") return 3;
  if (attentionState === "idle") return 4;
  if (attentionState === "recently-completed") return 5;
  return 6;
}

function createCompletedSummary(status: string | undefined, updatedAt: string | undefined) {
  return [status ? `Run ${status}` : "Run completed", updatedAt].filter(Boolean).join(" at ");
}

function normalizeReason(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function compact(value: string | undefined, maxLength: number) {
  if (!value) return undefined;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function latestByTimestamp<T extends Record<string, unknown>>(items: ReadonlyArray<T> | undefined, timestampKey: keyof T): T | undefined {
  return [...(items ?? [])].sort((left, right) => compareTimestamp(String(right[timestampKey] ?? ""), String(left[timestampKey] ?? "")))[0];
}

function compareTimestamp(left: string | undefined, right: string | undefined) {
  const diff = Date.parse(left ?? "") - Date.parse(right ?? "");
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return String(left ?? "").localeCompare(String(right ?? ""));
}
