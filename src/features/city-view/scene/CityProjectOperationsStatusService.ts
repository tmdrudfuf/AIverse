import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import { deriveLiveAgentWorkState, type LiveAgentWorkState } from "./office/LiveAgentWorkVisualization";
import { ProjectCompanyBindingService } from "./office/project-company-binding/ProjectCompanyBindingService";
import { toProjectPortalProject } from "./office/project-registry/ProjectRegistryAdapters";

export type CityProjectOperationStatusStage =
  | "idle"
  | "preparing"
  | "implementation"
  | "validation"
  | "review"
  | "publication"
  | "blocked"
  | "complete"
  | "disconnected";

export type CityProjectOperationStatusTone = "active" | "warning" | "complete" | "idle" | "disconnected";

export type CityProjectOperationStatus = {
  buildingId: string;
  projectId?: string;
  projectName: string;
  companyName: string;
  stage: CityProjectOperationStatusStage;
  label: string;
  tone: CityProjectOperationStatusTone;
  reasonText?: string;
  updatedAt?: string;
  mutationDisabled: boolean;
};

export type CityProjectOperationStatusMap = Record<string, CityProjectOperationStatus>;

export type DeriveCityProjectOperationStatusesInput = {
  buildings: ReadonlyArray<CityBuildingDefinition>;
  state: ProjectScopedLiveWorkState;
};

type LiveAgentWorkStateInput = Parameters<typeof deriveLiveAgentWorkState>[0];

type ProjectScopedLiveWorkState = Pick<ProjectPortalState, "projectRegistryEntries"> & Partial<LiveAgentWorkStateInput>;

export function createCityProjectOperationStatusesFromBrowserSession(
  buildings: ReadonlyArray<CityBuildingDefinition>,
): CityProjectOperationStatusMap {
  return deriveCityProjectOperationStatuses({
    buildings,
    state: createProjectPortalState(),
  });
}

export function deriveCityProjectOperationStatuses(
  input: DeriveCityProjectOperationStatusesInput,
): CityProjectOperationStatusMap {
  const bindingService = new ProjectCompanyBindingService();
  return Object.fromEntries(
    input.buildings.map((building) => {
      const context = bindingService.resolveBuildingBinding(building, input.state.projectRegistryEntries);
      const status = context.status === "unavailable"
        ? createDisconnectedStatus(building, context.projectId, context.unavailableReason)
        : createAvailableStatus({
          building,
          projectId: context.projectId,
          projectName: context.project?.displayName ?? context.displayName,
          companyName: context.companyName,
          liveWorkState: deriveLiveAgentWorkState(createLiveWorkStateInput(input.state, context)),
        });

      return [building.id, status];
    }),
  );
}

function createAvailableStatus(input: {
  building: CityBuildingDefinition;
  projectId: string;
  projectName: string;
  companyName: string;
  liveWorkState: LiveAgentWorkState;
}): CityProjectOperationStatus {
  const stage = input.liveWorkState.stage;
  return {
    buildingId: input.building.id,
    projectId: input.projectId,
    projectName: input.projectName,
    companyName: input.companyName,
    stage,
    label: toCityLabel(stage),
    tone: toCityTone(input.liveWorkState),
    reasonText: input.liveWorkState.reasonText,
    updatedAt: input.liveWorkState.updatedAt,
    mutationDisabled: false,
  };
}

function createDisconnectedStatus(
  building: CityBuildingDefinition,
  projectId: string | undefined,
  reason: string | undefined,
): CityProjectOperationStatus {
  return {
    buildingId: building.id,
    projectId,
    projectName: building.name,
    companyName: building.name,
    stage: "disconnected",
    label: "DISCONNECTED",
    tone: "disconnected",
    reasonText: reason ? reason.replace(/([a-z])([A-Z])/g, "$1 $2") : "Project unavailable",
    mutationDisabled: true,
  };
}

function createLiveWorkStateInput(
  state: ProjectScopedLiveWorkState,
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

function toCityLabel(stage: CityProjectOperationStatusStage) {
  if (stage === "preparing") return "PREPARING";
  if (stage === "implementation") return "IMPLEMENTATION";
  if (stage === "validation") return "VALIDATION";
  if (stage === "review") return "REVIEW";
  if (stage === "publication") return "PUBLICATION";
  if (stage === "blocked") return "BLOCKED";
  if (stage === "complete") return "COMPLETE";
  if (stage === "disconnected") return "DISCONNECTED";
  return "IDLE";
}

function toCityTone(liveWorkState: LiveAgentWorkState): CityProjectOperationStatusTone {
  if (liveWorkState.lifecycle === "blocked") return "warning";
  if (liveWorkState.lifecycle === "complete") return "complete";
  if (liveWorkState.lifecycle === "no-active-run") return "idle";
  return "active";
}
