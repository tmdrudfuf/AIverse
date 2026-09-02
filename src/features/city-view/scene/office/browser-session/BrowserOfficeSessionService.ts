import type { ProjectPortalState } from "../OfficeProjectPortalTypes";
import { createWorkspaces } from "../OfficeProjectPortalRegistry";
import { toProjectPortalProject, toRepositoryMapping } from "../project-registry/ProjectRegistryAdapters";
import type {
  NormalizedLocalProjectRepositoryBinding,
  ProjectRegistryEntry,
  ProjectRegistryRepositoryConnectionState,
  ProjectRegistryRepositoryIdentity,
} from "../project-registry/ProjectRegistryTypes";
import type { ProjectCompanyBinding } from "../project-company-binding/ProjectCompanyBindingTypes";
import {
  BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
  BROWSER_OFFICE_SESSION_STORAGE_KEY,
  type BrowserOfficeSessionSnapshot,
  type BrowserOfficeSessionState,
  type BrowserOfficeSessionStorage,
} from "./BrowserOfficeSessionTypes";
import type {
  ExternalProjectAdosRunStatus,
  ExternalProjectAdosRunStatuses,
} from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import { ProjectBacklogService, isBacklogCollection } from "../project-backlog/ProjectBacklogService";
import type { ProjectBacklogCollections } from "../project-backlog/ProjectBacklogTypes";
import { ProjectBacklogSuggestionService, isSuggestionCollection } from "../project-backlog/ProjectBacklogSuggestionService";
import type { ProjectBacklogSuggestionCollections } from "../project-backlog/ProjectBacklogSuggestionTypes";
import {
  ProjectBacklogSuggestionAcceptancePolicyService,
  isProjectBacklogSuggestionAcceptancePolicy,
} from "../project-backlog/ProjectBacklogSuggestionAcceptancePolicyService";
import type { ProjectBacklogSuggestionAcceptancePolicies } from "../project-backlog/ProjectBacklogSuggestionAcceptancePolicyTypes";
import { ProjectAutonomousExecutionPolicyService, isProjectAutonomyPolicy } from "../project-backlog/ProjectAutonomousExecutionPolicyService";
import type { ProjectAutonomyPolicies } from "../project-backlog/ProjectAutonomousExecutionPolicyTypes";

export type BrowserOfficeSessionServiceOptions = {
  storage?: BrowserOfficeSessionStorage;
  now?: () => string;
};

export class BrowserOfficeSessionService {
  private readonly storage?: BrowserOfficeSessionStorage;
  private readonly now: () => string;

  constructor(options: BrowserOfficeSessionServiceOptions = {}) {
    this.storage = options.storage ?? getDefaultStorage();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  loadSnapshot(): BrowserOfficeSessionSnapshot | undefined {
    if (!this.storage) return undefined;

    try {
      const rawSnapshot = this.storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY);
      if (!rawSnapshot) return undefined;

      const parsed = JSON.parse(rawSnapshot) as unknown;
      return isBrowserOfficeSessionSnapshot(parsed) ? clone(parsed) : undefined;
    } catch {
      return undefined;
    }
  }

  restoreState(state: ProjectPortalState): ProjectPortalState {
    const snapshot = this.loadSnapshot();
    if (!snapshot) return state;

    state.selectedProjectId = snapshot.selectedProjectId ?? state.selectedProjectId;
    state.selectedProjectDashboardProjectId = snapshot.selectedProjectDashboardProjectId;
    state.selectedProjectDashboardActiveWorkIndex = clampIndex(snapshot.selectedProjectDashboardActiveWorkIndex);
    state.selectedBacklogProjectId = snapshot.selectedBacklogProjectId;
    state.selectedBacklogTaskId = snapshot.selectedBacklogTaskId;
    state.selectedBacklogTaskIndex = clampIndex(snapshot.selectedBacklogTaskIndex);
    state.selectedBacklogSuggestionId = snapshot.selectedBacklogSuggestionId;
    state.selectedWorkSessionId = snapshot.selectedWorkSessionId;
    restoreProjectRegistryEntries(state, snapshot.projectRegistryEntries);
    state.projectCompanyBindings = cloneValidProjectCompanyBindings(snapshot.projectCompanyBindings ?? state.projectCompanyBindings);
    state.candidateTaskCollections = clone(snapshot.candidateTaskCollections);
    state.candidateAssignmentCollections = clone(snapshot.candidateAssignmentCollections);
    state.candidatePromotionReviewCollections = clone(snapshot.candidatePromotionReviewCollections);
    state.candidatePromotionDecisionRecords = clone(snapshot.candidatePromotionDecisionRecords);
    state.candidateProjectTaskPromotionResultCollections = clone(snapshot.candidateProjectTaskPromotionResultCollections);
    state.taskCollections = clone(snapshot.taskCollections);
    state.employees = clone(snapshot.employees);
    state.confirmedEmployeeAssignmentRecords = clone(snapshot.confirmedEmployeeAssignmentRecords);
    state.confirmedEmployeeAssignmentResultCollections = clone(snapshot.confirmedEmployeeAssignmentResultCollections);
    state.preparedWorkSessionRecords = clone(snapshot.preparedWorkSessionRecords);
    state.preparedWorkSessionResultCollections = clone(snapshot.preparedWorkSessionResultCollections);
    state.activeWorkSessionStartResultCollections = clone(snapshot.activeWorkSessionStartResultCollections);
    state.externalProjectDevelopmentRequestDrafts = clone(snapshot.externalProjectDevelopmentRequestDrafts ?? {});
    state.externalProjectAdosRunPreparations = clone(snapshot.externalProjectAdosRunPreparations ?? {});
    state.externalProjectAdosExecutions = clone(snapshot.externalProjectAdosExecutions ?? {});
    state.externalProjectAdosExecutionResults = clone(snapshot.externalProjectAdosExecutionResults ?? {});
    state.externalProjectAdosRunStatuses = cloneValidExternalProjectAdosRunStatuses(snapshot.externalProjectAdosRunStatuses);
    state.projectBacklogCollections = cloneValidProjectBacklogCollections(snapshot.projectBacklogCollections);
    state.projectBacklogSuggestionCollections = cloneValidProjectBacklogSuggestionCollections(snapshot.projectBacklogSuggestionCollections);
    state.projectBacklogSuggestionAcceptancePolicies = cloneValidProjectBacklogSuggestionAcceptancePolicies(snapshot.projectBacklogSuggestionAcceptancePolicies);
    state.projectAutonomyPolicies = cloneValidProjectAutonomyPolicies(snapshot.projectAutonomyPolicies);
    state.implementerRuntimeCollections = clone(snapshot.implementerRuntimeCollections ?? {});
    state.implementerRuntimeResultCollections = clone(snapshot.implementerRuntimeResultCollections ?? {});
    state.reviewerRuntimeCollections = clone(snapshot.reviewerRuntimeCollections ?? {});
    state.reviewerRuntimeResultCollections = clone(snapshot.reviewerRuntimeResultCollections ?? {});
    state.reviewPromotionCollections = clone(snapshot.reviewPromotionCollections ?? {});
    state.reviewPromotionResultCollections = clone(snapshot.reviewPromotionResultCollections ?? {});
    state.reviewFixRuntimeCollections = clone(snapshot.reviewFixRuntimeCollections ?? {});
    state.reviewFixRuntimeResultCollections = clone(snapshot.reviewFixRuntimeResultCollections ?? {});
    state.validationRuntimeCollections = clone(snapshot.validationRuntimeCollections ?? {});
    state.validationRuntimeResultCollections = clone(snapshot.validationRuntimeResultCollections ?? {});
    state.postValidationReviewTargetCollections = clone(snapshot.postValidationReviewTargetCollections ?? {});
    state.postValidationReviewTargetResultCollections = clone(snapshot.postValidationReviewTargetResultCollections ?? {});
    state.workSessions = clone(snapshot.workSessions);

    const selectedIndex = state.projects.findIndex((project) => project.id === state.selectedProjectId);
    state.selectedProjectIndex = selectedIndex >= 0 ? selectedIndex : state.selectedProjectIndex;

    return state;
  }

  saveState(state: BrowserOfficeSessionState): boolean {
    if (!this.storage) return false;

    const snapshot: BrowserOfficeSessionSnapshot = {
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: this.now(),
      selectedProjectId: state.selectedProjectId,
      selectedProjectDashboardProjectId: state.selectedProjectDashboardProjectId,
      selectedProjectDashboardActiveWorkIndex: clampIndex(state.selectedProjectDashboardActiveWorkIndex),
      selectedBacklogProjectId: state.selectedBacklogProjectId,
      selectedBacklogTaskId: state.selectedBacklogTaskId,
      selectedBacklogTaskIndex: clampIndex(state.selectedBacklogTaskIndex),
      selectedBacklogSuggestionId: state.selectedBacklogSuggestionId,
      selectedWorkSessionId: state.selectedWorkSessionId,
      projectRegistryEntries: cloneProjectRegistryEntries(state.projectRegistryEntries),
      projectCompanyBindings: cloneValidProjectCompanyBindings(state.projectCompanyBindings),
      candidateTaskCollections: clone(state.candidateTaskCollections),
      candidateAssignmentCollections: clone(state.candidateAssignmentCollections),
      candidatePromotionReviewCollections: clone(state.candidatePromotionReviewCollections),
      candidatePromotionDecisionRecords: clone(state.candidatePromotionDecisionRecords),
      candidateProjectTaskPromotionResultCollections: clone(state.candidateProjectTaskPromotionResultCollections),
      taskCollections: clone(state.taskCollections),
      employees: clone(state.employees),
      confirmedEmployeeAssignmentRecords: clone(state.confirmedEmployeeAssignmentRecords),
      confirmedEmployeeAssignmentResultCollections: clone(state.confirmedEmployeeAssignmentResultCollections),
      preparedWorkSessionRecords: clone(state.preparedWorkSessionRecords),
      preparedWorkSessionResultCollections: clone(state.preparedWorkSessionResultCollections),
      activeWorkSessionStartResultCollections: clone(state.activeWorkSessionStartResultCollections),
      externalProjectDevelopmentRequestDrafts: clone(state.externalProjectDevelopmentRequestDrafts),
      externalProjectAdosRunPreparations: clone(state.externalProjectAdosRunPreparations),
      externalProjectAdosExecutions: clone(state.externalProjectAdosExecutions),
      externalProjectAdosExecutionResults: clone(state.externalProjectAdosExecutionResults),
      externalProjectAdosRunStatuses: clone(state.externalProjectAdosRunStatuses),
      projectBacklogCollections: cloneValidProjectBacklogCollections(state.projectBacklogCollections),
      projectBacklogSuggestionCollections: cloneValidProjectBacklogSuggestionCollections(state.projectBacklogSuggestionCollections),
      projectBacklogSuggestionAcceptancePolicies: cloneValidProjectBacklogSuggestionAcceptancePolicies(state.projectBacklogSuggestionAcceptancePolicies),
      projectAutonomyPolicies: cloneValidProjectAutonomyPolicies(state.projectAutonomyPolicies),
      implementerRuntimeCollections: clone(state.implementerRuntimeCollections),
      implementerRuntimeResultCollections: clone(state.implementerRuntimeResultCollections),
      reviewerRuntimeCollections: clone(state.reviewerRuntimeCollections),
      reviewerRuntimeResultCollections: clone(state.reviewerRuntimeResultCollections),
      reviewPromotionCollections: clone(state.reviewPromotionCollections),
      reviewPromotionResultCollections: clone(state.reviewPromotionResultCollections),
      reviewFixRuntimeCollections: clone(state.reviewFixRuntimeCollections),
      reviewFixRuntimeResultCollections: clone(state.reviewFixRuntimeResultCollections),
      validationRuntimeCollections: clone(state.validationRuntimeCollections),
      validationRuntimeResultCollections: clone(state.validationRuntimeResultCollections),
      postValidationReviewTargetCollections: clone(state.postValidationReviewTargetCollections),
      postValidationReviewTargetResultCollections: clone(state.postValidationReviewTargetResultCollections),
      workSessions: clone(state.workSessions),
    };

    try {
      this.storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }
}

export function createBrowserOfficeSessionService(options?: BrowserOfficeSessionServiceOptions) {
  return new BrowserOfficeSessionService(options);
}

function getDefaultStorage(): BrowserOfficeSessionStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function isBrowserOfficeSessionSnapshot(value: unknown): value is BrowserOfficeSessionSnapshot {
  if (!isRecord(value)) return false;
  return (
    value.version === BROWSER_OFFICE_SESSION_SCHEMA_VERSION &&
    typeof value.savedAt === "string" &&
    isOptionalString(value.selectedProjectId) &&
    isOptionalString(value.selectedProjectDashboardProjectId) &&
    isOptionalString(value.selectedBacklogProjectId) &&
    isOptionalString(value.selectedBacklogTaskId) &&
    isOptionalString(value.selectedBacklogSuggestionId) &&
    (value.selectedBacklogTaskIndex === undefined || typeof value.selectedBacklogTaskIndex === "number") &&
    isOptionalString(value.selectedWorkSessionId) &&
    (value.selectedProjectDashboardActiveWorkIndex === undefined || typeof value.selectedProjectDashboardActiveWorkIndex === "number") &&
    (value.projectRegistryEntries === undefined || Array.isArray(value.projectRegistryEntries)) &&
    (value.projectCompanyBindings === undefined || Array.isArray(value.projectCompanyBindings)) &&
    isRecordOfRecords(value.candidateTaskCollections) &&
    isRecordOfRecords(value.candidateAssignmentCollections) &&
    isRecordOfRecords(value.candidatePromotionReviewCollections) &&
    isRecordOfRecords(value.candidatePromotionDecisionRecords) &&
    isResultCollectionRecord(value.candidateProjectTaskPromotionResultCollections) &&
    isTaskCollectionRecord(value.taskCollections) &&
    Array.isArray(value.employees) &&
    value.employees.every(isRecord) &&
    isRecordOfRecords(value.confirmedEmployeeAssignmentRecords) &&
    isResultCollectionRecord(value.confirmedEmployeeAssignmentResultCollections) &&
    isRecordOfRecords(value.preparedWorkSessionRecords) &&
    isResultCollectionRecord(value.preparedWorkSessionResultCollections) &&
    isResultCollectionRecord(value.activeWorkSessionStartResultCollections) &&
    (value.externalProjectDevelopmentRequestDrafts === undefined || isRecordOfRecords(value.externalProjectDevelopmentRequestDrafts)) &&
    (value.externalProjectAdosRunPreparations === undefined || isRecordOfRecords(value.externalProjectAdosRunPreparations)) &&
    (value.externalProjectAdosExecutions === undefined || isRecordOfRecords(value.externalProjectAdosExecutions)) &&
    (value.externalProjectAdosExecutionResults === undefined || isRecordOfRecords(value.externalProjectAdosExecutionResults)) &&
    (value.externalProjectAdosRunStatuses === undefined || isRecord(value.externalProjectAdosRunStatuses)) &&
    (value.projectBacklogCollections === undefined || isProjectBacklogCollectionRecord(value.projectBacklogCollections)) &&
    (value.projectBacklogSuggestionCollections === undefined || isProjectBacklogSuggestionCollectionRecord(value.projectBacklogSuggestionCollections)) &&
    (value.projectBacklogSuggestionAcceptancePolicies === undefined || isRecord(value.projectBacklogSuggestionAcceptancePolicies)) &&
    (value.projectAutonomyPolicies === undefined || isRecord(value.projectAutonomyPolicies)) &&
    (value.implementerRuntimeCollections === undefined || isRuntimeCollectionRecord(value.implementerRuntimeCollections)) &&
    (value.implementerRuntimeResultCollections === undefined || isResultCollectionRecord(value.implementerRuntimeResultCollections)) &&
    (value.reviewerRuntimeCollections === undefined || isRuntimeCollectionRecord(value.reviewerRuntimeCollections)) &&
    (value.reviewerRuntimeResultCollections === undefined || isResultCollectionRecord(value.reviewerRuntimeResultCollections)) &&
    (value.reviewPromotionCollections === undefined || isPromotionCollectionRecord(value.reviewPromotionCollections)) &&
    (value.reviewPromotionResultCollections === undefined || isResultCollectionRecord(value.reviewPromotionResultCollections)) &&
    (value.reviewFixRuntimeCollections === undefined || isRuntimeCollectionRecord(value.reviewFixRuntimeCollections)) &&
    (value.reviewFixRuntimeResultCollections === undefined || isResultCollectionRecord(value.reviewFixRuntimeResultCollections)) &&
    (value.validationRuntimeCollections === undefined || isRuntimeCollectionRecord(value.validationRuntimeCollections)) &&
    (value.validationRuntimeResultCollections === undefined || isResultCollectionRecord(value.validationRuntimeResultCollections)) &&
    (value.postValidationReviewTargetCollections === undefined || isTargetCollectionRecord(value.postValidationReviewTargetCollections)) &&
    (value.postValidationReviewTargetResultCollections === undefined || isResultCollectionRecord(value.postValidationReviewTargetResultCollections)) &&
    isRecordOfArrays(value.workSessions)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRecordOfArrays(value: unknown): value is Record<string, unknown[]> {
  return isRecord(value) && Object.values(value).every(Array.isArray);
}

function isRecordOfRecords(value: unknown): value is Record<string, Record<string, unknown>> {
  return isRecord(value) && Object.values(value).every(isRecord);
}

function isTaskCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    typeof collection.projectId === "string" &&
    Array.isArray(collection.tasks)
  ));
}

function isProjectBacklogCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every(isBacklogCollection);
}

function isProjectBacklogSuggestionCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every(isSuggestionCollection);
}

function isProjectBacklogSuggestionAcceptancePolicyRecord(value: unknown) {
  return isRecord(value) && Object.entries(value).every(([projectId, policy]) => (
    isProjectBacklogSuggestionAcceptancePolicy(policy) && policy.projectId === projectId
  ));
}

function isProjectAutonomyPolicyRecord(value: unknown) {
  return isRecord(value) && Object.entries(value).every(([projectId, policy]) => (
    isProjectAutonomyPolicy(policy) && policy.projectId === projectId
  ));
}

function isResultCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    Array.isArray(collection.results)
  ));
}

function isRuntimeCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    Array.isArray(collection.runtimes)
  ));
}

function isPromotionCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    Array.isArray(collection.promotions)
  ));
}

function isTargetCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    Array.isArray(collection.targets)
  ));
}

function cloneValidExternalProjectAdosRunStatuses(value: unknown): ExternalProjectAdosRunStatuses {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, ExternalProjectAdosRunStatus] =>
        isExternalProjectAdosRunStatus(entry[1])
      )
      .map(([projectId, status]) => [projectId, clone(status)]),
  );
}

function cloneValidProjectBacklogCollections(value: unknown) {
  return new ProjectBacklogService().cloneCollections(
    isProjectBacklogCollectionRecord(value) ? value as ProjectBacklogCollections : {},
  );
}

function cloneValidProjectBacklogSuggestionCollections(value: unknown) {
  return new ProjectBacklogSuggestionService().cloneCollections(
    isProjectBacklogSuggestionCollectionRecord(value) ? value as ProjectBacklogSuggestionCollections : {},
  );
}

function cloneValidProjectBacklogSuggestionAcceptancePolicies(value: unknown) {
  return new ProjectBacklogSuggestionAcceptancePolicyService().clonePolicies(
    isRecord(value) ? value as ProjectBacklogSuggestionAcceptancePolicies : {},
  );
}

function cloneValidProjectAutonomyPolicies(value: unknown) {
  return new ProjectAutonomousExecutionPolicyService().clonePolicies(
    isRecord(value) ? value as ProjectAutonomyPolicies : {},
  );
}

function isExternalProjectAdosRunStatus(status: unknown): status is ExternalProjectAdosRunStatus {
  return (
    isRecord(status) &&
    isNonEmptyString(status.id) &&
    isNonEmptyString(status.projectId) &&
    isExternalProjectAdosRunStatusStage(status.stage) &&
    typeof status.status === "string" &&
    (status.source === "preparation" || status.source === "execution" || status.source === "result") &&
    isOptionalString(status.preparationId) &&
    isOptionalString(status.executionId) &&
    Array.isArray(status.reasonCodes) &&
    status.reasonCodes.every((reasonCode) => typeof reasonCode === "string") &&
    isOptionalString(status.featureBranch) &&
    isOptionalString(status.worktreePath) &&
    typeof status.updatedAt === "string" &&
    status.validationStarted === false &&
    status.reviewStarted === false &&
    status.repositoryMutationStarted === false &&
    status.githubMutationStarted === false &&
    status.publishStarted === false &&
    status.mergeStarted === false &&
    status.deployStarted === false &&
    typeof status.rulesVersion === "string"
  );
}

function isExternalProjectAdosRunStatusStage(value: unknown) {
  return (
    value === "NotPrepared" ||
    value === "Prepared" ||
    value === "Started" ||
    value === "Completed" ||
    value === "Blocked" ||
    value === "Failed" ||
    value === "TimedOut" ||
    value === "Cancelled"
  );
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function restoreProjectRegistryEntries(
  state: ProjectPortalState,
  savedEntries: ProjectRegistryEntry[] | undefined,
) {
  if (!savedEntries) return;

  const validSavedEntries = savedEntries.filter(isProjectRegistryEntry).map(cloneProjectRegistryEntry);
  if (!validSavedEntries.length) return;

  const entriesById = new Map(state.projectRegistryEntries.map((entry) => [entry.id, cloneProjectRegistryEntry(entry)]));
  for (const entry of validSavedEntries) {
    entriesById.set(entry.id, cloneProjectRegistryEntry(entry));
  }

  const registryEntries = Array.from(entriesById.values());
  state.projectRegistryEntries = registryEntries.map(cloneProjectRegistryEntry);
  state.projects = registryEntries.map((entry) => toProjectPortalProject(entry, clone(state.services)));
  state.workspaces = createWorkspaces(registryEntries);
  state.repositoryMappings = registryEntries
    .map((entry) => toRepositoryMapping(entry))
    .filter((mapping): mapping is ProjectPortalState["repositoryMappings"][number] => Boolean(mapping));
}

function cloneProjectRegistryEntries(entries: ReadonlyArray<ProjectRegistryEntry>): ProjectRegistryEntry[] {
  return entries.map(cloneProjectRegistryEntry);
}

function cloneValidProjectCompanyBindings(value: unknown): ProjectCompanyBinding[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isProjectCompanyBinding).map((binding) => ({ ...binding }));
}

function isProjectCompanyBinding(value: unknown): value is ProjectCompanyBinding {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.bindingId) &&
    isNonEmptyString(value.buildingId) &&
    isNonEmptyString(value.projectId) &&
    isNonEmptyString(value.companyName) &&
    (value.status === "bound" || value.status === "unavailable") &&
    (value.unavailableReason === undefined || value.unavailableReason === "MissingProject" || value.unavailableReason === "MissingLocalPath")
  );
}

function cloneProjectRegistryEntry(entry: ProjectRegistryEntry): ProjectRegistryEntry {
  return {
    ...entry,
    localRepository: { ...entry.localRepository },
    ...(entry.localRepositoryBinding ? { localRepositoryBinding: { ...entry.localRepositoryBinding } } : {}),
    ...(entry.remoteRepository ? { remoteRepository: { ...entry.remoteRepository } } : {}),
    repositoryIdentity: { ...entry.repositoryIdentity },
    owner: { ...entry.owner },
  };
}

function isProjectRegistryEntry(value: unknown): value is ProjectRegistryEntry {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.displayName) &&
    typeof value.shortDescription === "string" &&
    isProjectLifecycleStatus(value.lifecycleStatus) &&
    isNonEmptyString(value.projectType) &&
    isLocalRepository(value.localRepository) &&
    (value.localRepositoryBinding === undefined || isNormalizedLocalProjectRepositoryBinding(value.localRepositoryBinding)) &&
    (value.remoteRepository === undefined || isRemoteRepository(value.remoteRepository)) &&
    isRepositoryIdentity(value.repositoryIdentity) &&
    isOwner(value.owner) &&
    typeof value.createdAt === "string" &&
    typeof value.lastActivityAt === "string"
  );
}

function isProjectLifecycleStatus(value: unknown) {
  return value === "Active" || value === "Planned" || value === "Coming Soon";
}

function isLocalRepository(value: unknown) {
  return isRecord(value) && typeof value.connected === "boolean" && typeof value.label === "string";
}

function isNormalizedLocalProjectRepositoryBinding(value: unknown): value is NormalizedLocalProjectRepositoryBinding {
  return (
    isRecord(value) &&
    isNonEmptyString(value.projectId) &&
    isNonEmptyString(value.repositoryPath) &&
    isNonEmptyString(value.worktreePath) &&
    isOptionalString(value.branchName) &&
    isOptionalString(value.specPath) &&
    isOptionalString(value.source) &&
    isOptionalString(value.boundAt)
  );
}

function isRemoteRepository(value: unknown) {
  return (
    isRecord(value) &&
    isNonEmptyString(value.owner) &&
    isNonEmptyString(value.name) &&
    isOptionalString(value.url) &&
    (value.visibility === "public" || value.visibility === "private" || value.visibility === "unknown") &&
    isOptionalString(value.defaultBranchHint)
  );
}

function isRepositoryIdentity(value: unknown): value is ProjectRegistryRepositoryIdentity {
  return (
    isRecord(value) &&
    isNonEmptyString(value.provider) &&
    isRepositoryConnectionState(value.connectionState) &&
    isOptionalString(value.owner) &&
    isOptionalString(value.name) &&
    isOptionalString(value.defaultBranch) &&
    isOptionalString(value.url) &&
    isOptionalString(value.localPath) &&
    isOptionalString(value.lastVerifiedAt)
  );
}

function isRepositoryConnectionState(value: unknown): value is ProjectRegistryRepositoryConnectionState {
  return value === "Configured" || value === "Available" || value === "Unavailable" || value === "Unknown";
}

function isOwner(value: unknown) {
  return isRecord(value) && typeof value.companyName === "string";
}

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function clampIndex(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
