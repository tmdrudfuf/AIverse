import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import type { ExternalProjectAdosRunStatus } from "./office/external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import { ProjectCompanyBindingService } from "./office/project-company-binding/ProjectCompanyBindingService";

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
  state: Pick<
    ProjectPortalState,
    | "projectRegistryEntries"
    | "externalProjectAdosRunStatuses"
  >;
};

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
          runStatus: input.state.externalProjectAdosRunStatuses[context.projectId],
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
  runStatus?: ExternalProjectAdosRunStatus;
}): CityProjectOperationStatus {
  if (!input.runStatus || input.runStatus.projectId !== input.projectId) {
    return {
      buildingId: input.building.id,
      projectId: input.projectId,
      projectName: input.projectName,
      companyName: input.companyName,
      stage: "idle",
      label: "IDLE",
      tone: "idle",
      mutationDisabled: false,
    };
  }

  const stage = toCityStage(input.runStatus);
  return {
    buildingId: input.building.id,
    projectId: input.projectId,
    projectName: input.projectName,
    companyName: input.companyName,
    stage,
    label: toCityLabel(stage),
    tone: toCityTone(stage),
    reasonText: stage === "blocked" ? createReasonText(input.runStatus) : undefined,
    updatedAt: input.runStatus.updatedAt,
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

function toCityStage(status: ExternalProjectAdosRunStatus): CityProjectOperationStatusStage {
  const raw = normalize(`${status.stage} ${status.status} ${status.reasonCodes.join(" ")}`);

  if (hasToken(raw, ["blocked", "failed", "timedout", "timed_out", "cancelled", "recovery", "unavailable"])) return "blocked";
  if (hasToken(raw, ["validation", "validating", "qa", "testing"])) return "validation";
  if (hasToken(raw, ["reviewer", "reviewing", "review", "changes_requested"])) return "review";
  if (hasToken(raw, ["publication", "publish", "merge", "pull_request", "pr_refresh", "exact_head"])) return "publication";
  if (status.stage === "Completed" || hasToken(raw, ["complete", "completed"])) return "complete";
  if (status.stage === "Prepared" || status.stage === "NotPrepared" || hasToken(raw, ["prepared", "preparing"])) return "preparing";
  if (status.stage === "Started" || hasToken(raw, ["started", "implementer", "implementation"])) return "implementation";
  return "idle";
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

function toCityTone(stage: CityProjectOperationStatusStage): CityProjectOperationStatusTone {
  if (stage === "blocked") return "warning";
  if (stage === "complete") return "complete";
  if (stage === "disconnected") return "disconnected";
  if (stage === "idle") return "idle";
  return "active";
}

function createReasonText(status: ExternalProjectAdosRunStatus) {
  if (!status.reasonCodes.length) return undefined;
  return status.reasonCodes.map((reason) => reason.replace(/_/g, " ")).join(", ");
}

function hasToken(value: string, tokens: ReadonlyArray<string>) {
  return tokens.some((token) => value.includes(token));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}
