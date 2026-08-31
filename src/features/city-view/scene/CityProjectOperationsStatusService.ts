import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import {
  createPortfolioOperationsFromBrowserSession,
  derivePortfolioOperations,
  type PortfolioOperationsSummary,
  type PortfolioOperationsSummaryMap,
  type PortfolioVisualTone,
} from "./PortfolioOperationsService";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import type { LiveAgentWorkState } from "./office/LiveAgentWorkVisualization";

export type CityProjectOperationStatusStage = LiveAgentWorkState["stage"] | "disconnected";

export type CityProjectOperationStatusTone = PortfolioVisualTone;

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
  portfolioSummary: PortfolioOperationsSummary;
};

export type CityProjectOperationStatusMap = Record<string, CityProjectOperationStatus>;

export type DeriveCityProjectOperationStatusesInput = {
  buildings: ReadonlyArray<CityBuildingDefinition>;
  state: Pick<ProjectPortalState, "projectRegistryEntries"> & Partial<ProjectPortalState>;
};

export function createCityProjectOperationStatusesFromBrowserSession(
  buildings: ReadonlyArray<CityBuildingDefinition>,
): CityProjectOperationStatusMap {
  return toCityStatusMap(createPortfolioOperationsFromBrowserSession(buildings));
}

export function deriveCityProjectOperationStatuses(
  input: DeriveCityProjectOperationStatusesInput,
): CityProjectOperationStatusMap {
  return toCityStatusMap(derivePortfolioOperations(input));
}

function toCityStatusMap(summaries: PortfolioOperationsSummaryMap): CityProjectOperationStatusMap {
  return Object.fromEntries(
    Object.entries(summaries).map(([buildingId, summary]) => [buildingId, toCityStatus(summary)]),
  );
}

function toCityStatus(summary: PortfolioOperationsSummary): CityProjectOperationStatus {
  return {
    buildingId: summary.buildingId,
    projectId: summary.projectId,
    projectName: summary.projectName,
    companyName: summary.companyName,
    stage: summary.workflowStage,
    label: summary.attentionLabel,
    tone: summary.tone,
    reasonText: summary.blockedReasonSummary,
    updatedAt: summary.updatedAt,
    mutationDisabled: !summary.operatorActionAvailable,
    portfolioSummary: summary,
  };
}
