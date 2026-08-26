import type { ProjectPortalState } from "../OfficeProjectPortalTypes";
import { toProjectPortalProject, toRepositoryMapping } from "../project-registry/ProjectRegistryAdapters";
import type {
  NormalizedLocalProjectRepositoryBinding,
  ProjectRegistryEntry,
  ProjectRegistryRepositoryConnectionState,
  ProjectRegistryRepositoryIdentity,
} from "../project-registry/ProjectRegistryTypes";
import {
  BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
  BROWSER_OFFICE_SESSION_STORAGE_KEY,
  type BrowserOfficeSessionSnapshot,
  type BrowserOfficeSessionState,
  type BrowserOfficeSessionStorage,
} from "./BrowserOfficeSessionTypes";

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
    state.selectedWorkSessionId = snapshot.selectedWorkSessionId;
    restoreProjectRegistryEntries(state, snapshot.projectRegistryEntries);
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
      selectedWorkSessionId: state.selectedWorkSessionId,
      projectRegistryEntries: cloneProjectRegistryEntries(state.projectRegistryEntries),
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
    isOptionalString(value.selectedWorkSessionId) &&
    (value.selectedProjectDashboardActiveWorkIndex === undefined || typeof value.selectedProjectDashboardActiveWorkIndex === "number") &&
    (value.projectRegistryEntries === undefined || Array.isArray(value.projectRegistryEntries)) &&
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

function isResultCollectionRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((collection) => (
    isRecord(collection) &&
    Array.isArray(collection.results)
  ));
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
  state.repositoryMappings = registryEntries
    .map((entry) => toRepositoryMapping(entry))
    .filter((mapping): mapping is ProjectPortalState["repositoryMappings"][number] => Boolean(mapping));
}

function cloneProjectRegistryEntries(entries: ReadonlyArray<ProjectRegistryEntry>): ProjectRegistryEntry[] {
  return entries.map(cloneProjectRegistryEntry);
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
