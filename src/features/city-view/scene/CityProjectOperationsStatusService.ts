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
    | "reviewerRuntimeCollections"
    | "reviewerRuntimeResultCollections"
    | "reviewPromotionCollections"
    | "reviewPromotionResultCollections"
    | "validationRuntimeCollections"
    | "validationRuntimeResultCollections"
    | "postValidationReviewTargetCollections"
    | "postValidationReviewTargetResultCollections"
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
          latestFact: getLatestProjectFact(input.state, context.projectId),
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
  latestFact?: CityProjectStatusFact;
}): CityProjectOperationStatus {
  const runStatus = input.runStatus?.projectId === input.projectId ? input.runStatus : undefined;

  if (!runStatus && !input.latestFact) {
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

  const stage = toCityStage(runStatus, input.latestFact);
  return {
    buildingId: input.building.id,
    projectId: input.projectId,
    projectName: input.projectName,
    companyName: input.companyName,
    stage,
    label: toCityLabel(stage),
    tone: toCityTone(stage),
    reasonText: stage === "blocked" ? createReasonText(runStatus, input.latestFact) : undefined,
    updatedAt: latestTimestamp(runStatus?.updatedAt, input.latestFact?.updatedAt),
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

type CityProjectStatusFact = {
  kind: Exclude<CityProjectOperationStatusStage, "idle" | "disconnected" | "complete"> | "complete";
  status: string;
  updatedAt?: string;
  reasonCodes?: ReadonlyArray<string>;
};

function getLatestProjectFact(
  state: DeriveCityProjectOperationStatusesInput["state"],
  projectId: string,
): CityProjectStatusFact | undefined {
  const facts: CityProjectStatusFact[] = [];
  const reviewerRuntime = latestByTimestamp(state.reviewerRuntimeCollections[projectId]?.runtimes, "startedAt");
  const reviewerResult = latestByTimestamp(state.reviewerRuntimeResultCollections[projectId]?.results, "resultAt");
  const reviewPromotion = latestByTimestamp(state.reviewPromotionCollections[projectId]?.promotions, "promotedAt");
  const reviewPromotionResult = latestByTimestamp(state.reviewPromotionResultCollections[projectId]?.results, "resultAt");
  const validationRuntime = latestByTimestamp(state.validationRuntimeCollections[projectId]?.runtimes, "startedAt");
  const validationResult = latestByTimestamp(state.validationRuntimeResultCollections[projectId]?.results, "resultAt");
  const postValidationTarget = latestByTimestamp(state.postValidationReviewTargetCollections[projectId]?.targets, "resolvedAt");
  const postValidationResult = latestByTimestamp(state.postValidationReviewTargetResultCollections[projectId]?.results, "resultAt");

  if (reviewerRuntime) facts.push({
    kind: "review",
    status: String(reviewerRuntime.status),
    updatedAt: String(reviewerRuntime.startedAt ?? ""),
  });
  if (reviewerResult) facts.push({
    kind: reviewerResult.decision === "ChangesRequested" ? "blocked" : "review",
    status: reviewerResult.decision === "ChangesRequested" ? "ChangesRequested" : String(reviewerResult.status),
    updatedAt: reviewerResult.resultAt,
    reasonCodes: reviewerResult.reasonCodes,
  });
  if (reviewPromotion) facts.push({
    kind: "publication",
    status: "ReviewPromotionGranted",
    updatedAt: reviewPromotion.promotedAt,
  });
  if (reviewPromotionResult) facts.push({
    kind: reviewPromotionResult.granted ? "publication" : "blocked",
    status: reviewPromotionResult.granted ? "ReviewPromotionGranted" : "ReviewPromotionBlocked",
    updatedAt: reviewPromotionResult.resultAt,
    reasonCodes: reviewPromotionResult.reasonCodes,
  });
  if (validationRuntime) facts.push({
    kind: "validation",
    status: String(validationRuntime.status),
    updatedAt: String(validationRuntime.startedAt ?? ""),
  });
  if (validationResult) facts.push({
    kind: "validation",
    status: String(validationResult.status),
    updatedAt: validationResult.resultAt,
    reasonCodes: validationResult.reasonCodes,
  });
  if (postValidationTarget) facts.push({
    kind: "review",
    status: "PostValidationReviewReady",
    updatedAt: postValidationTarget.resolvedAt,
  });
  if (postValidationResult) facts.push({
    kind: postValidationResult.targetReady ? "review" : "blocked",
    status: postValidationResult.status,
    updatedAt: postValidationResult.resultAt,
    reasonCodes: postValidationResult.reasonCodes,
  });

  return latestFact(facts);
}

function toCityStage(
  status: ExternalProjectAdosRunStatus | undefined,
  latestFact: CityProjectStatusFact | undefined,
): CityProjectOperationStatusStage {
  const raw = normalize(`${status?.stage ?? ""} ${status?.status ?? ""} ${status?.reasonCodes.join(" ") ?? ""}`);
  const factRaw = normalize(`${latestFact?.kind ?? ""} ${latestFact?.status ?? ""} ${latestFact?.reasonCodes?.join(" ") ?? ""}`);

  if (latestFact && hasToken(factRaw, ["blocked", "failed", "timedout", "timed_out", "cancelled", "recovery", "unavailable", "changesrequested", "changes_requested"])) return "blocked";
  if (latestFact?.kind) return latestFact.kind;

  if (hasToken(raw, ["blocked", "failed", "timedout", "timed_out", "cancelled", "recovery", "unavailable"])) return "blocked";
  if (hasToken(raw, ["validation", "validating", "qa", "testing"])) return "validation";
  if (hasToken(raw, ["reviewer", "reviewing", "review", "changes_requested"])) return "review";
  if (hasToken(raw, ["publication", "publish", "merge", "pull_request", "pr_refresh", "exact_head"])) return "publication";
  if (status?.stage === "Completed" || hasToken(raw, ["complete", "completed"])) return "complete";
  if (status?.stage === "Prepared" || status?.stage === "NotPrepared" || hasToken(raw, ["prepared", "preparing"])) return "preparing";
  if (status?.stage === "Started" || hasToken(raw, ["started", "implementer", "implementation"])) return "implementation";
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

function createReasonText(
  status: ExternalProjectAdosRunStatus | undefined,
  latestFact: CityProjectStatusFact | undefined,
) {
  const reasonCodes = latestFact?.reasonCodes?.length ? latestFact.reasonCodes : status?.reasonCodes;
  if (!reasonCodes?.length) return undefined;
  return reasonCodes.map((reason) => reason.replace(/_/g, " ")).join(", ");
}

function latestByTimestamp<T extends Record<string, unknown>>(
  items: ReadonlyArray<T> | undefined,
  timestampKey: keyof T,
): T | undefined {
  return [...(items ?? [])].sort((left, right) => compareTimestamp(String(right[timestampKey] ?? ""), String(left[timestampKey] ?? "")))[0];
}

function latestFact(facts: ReadonlyArray<CityProjectStatusFact>) {
  return [...facts].sort((left, right) => compareTimestamp(right.updatedAt, left.updatedAt))[0];
}

function latestTimestamp(...timestamps: Array<string | undefined>) {
  return timestamps.filter(Boolean).sort((left, right) => compareTimestamp(right, left))[0];
}

function compareTimestamp(left: string | undefined, right: string | undefined) {
  const diff = Date.parse(left ?? "") - Date.parse(right ?? "");
  if (Number.isFinite(diff) && diff !== 0) return diff;
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function hasToken(value: string, tokens: ReadonlyArray<string>) {
  return tokens.some((token) => value.includes(token));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s-]+/g, "_");
}
