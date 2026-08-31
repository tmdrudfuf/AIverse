import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import { deriveLiveAgentWorkState, type LiveAgentWorkState } from "./office/LiveAgentWorkVisualization";
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
  updatedAt?: string;
  operatorActionAvailable: boolean;
};

export type PortfolioOperationsSummaryMap = Record<string, PortfolioOperationsSummary>;

export type DerivePortfolioOperationsInput = {
  buildings: ReadonlyArray<CityBuildingDefinition>;
  state: ProjectScopedPortfolioState;
};

type LiveAgentWorkStateInput = Parameters<typeof deriveLiveAgentWorkState>[0];

type ProjectScopedPortfolioState = Pick<ProjectPortalState, "projectRegistryEntries"> & Partial<LiveAgentWorkStateInput>;

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
  const attentionState = toAttentionState(input.liveWorkState);
  const blockedReasonSummary = input.liveWorkState.reasonText
    ? normalizeReason(input.liveWorkState.reasonText)
    : undefined;

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
    updatedAt: input.liveWorkState.updatedAt,
    operatorActionAvailable: true,
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

function toAttentionState(liveWorkState: LiveAgentWorkState): PortfolioAttentionState {
  if (liveWorkState.lifecycle === "complete") return "recently-completed";
  if (liveWorkState.lifecycle === "no-active-run") return "idle";
  const reason = normalizeReason(
    liveWorkState.lifecycle === "blocked"
      ? [liveWorkState.reasonText, liveWorkState.rawStatus].filter(Boolean).join(" ")
      : liveWorkState.reasonText ?? "",
  );
  if (isAttentionReason(reason)) return "needs-attention";
  return liveWorkState.lifecycle === "blocked" ? "blocked" : "active";
}

function isAttentionReason(reason: string) {
  return reason.includes("CHANGES REQUESTED")
    || reason.includes("VALIDATION")
    || reason.includes("REVIEW")
    || reason.includes("RECOVERY");
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
