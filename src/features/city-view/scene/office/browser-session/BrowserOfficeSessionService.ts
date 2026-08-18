import type { ProjectPortalState } from "../OfficeProjectPortalTypes";
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
    state.taskCollections = clone(snapshot.taskCollections);
    state.employees = clone(snapshot.employees);
    state.confirmedEmployeeAssignmentRecords = clone(snapshot.confirmedEmployeeAssignmentRecords);
    state.confirmedEmployeeAssignmentResultCollections = clone(snapshot.confirmedEmployeeAssignmentResultCollections);
    state.preparedWorkSessionRecords = clone(snapshot.preparedWorkSessionRecords);
    state.preparedWorkSessionResultCollections = clone(snapshot.preparedWorkSessionResultCollections);
    state.activeWorkSessionStartResultCollections = clone(snapshot.activeWorkSessionStartResultCollections);
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
      taskCollections: clone(state.taskCollections),
      employees: clone(state.employees),
      confirmedEmployeeAssignmentRecords: clone(state.confirmedEmployeeAssignmentRecords),
      confirmedEmployeeAssignmentResultCollections: clone(state.confirmedEmployeeAssignmentResultCollections),
      preparedWorkSessionRecords: clone(state.preparedWorkSessionRecords),
      preparedWorkSessionResultCollections: clone(state.preparedWorkSessionResultCollections),
      activeWorkSessionStartResultCollections: clone(state.activeWorkSessionStartResultCollections),
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
    isRecord(value.taskCollections) &&
    Array.isArray(value.employees) &&
    isRecord(value.confirmedEmployeeAssignmentRecords) &&
    isRecord(value.confirmedEmployeeAssignmentResultCollections) &&
    isRecord(value.preparedWorkSessionRecords) &&
    isRecord(value.preparedWorkSessionResultCollections) &&
    isRecord(value.activeWorkSessionStartResultCollections) &&
    isRecordOfArrays(value.workSessions)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRecordOfArrays(value: unknown): value is Record<string, unknown[]> {
  return isRecord(value) && Object.values(value).every(Array.isArray);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function clampIndex(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
