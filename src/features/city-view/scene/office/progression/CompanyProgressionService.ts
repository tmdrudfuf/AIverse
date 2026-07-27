import type {
  CompanyProgressionInput,
  CompanyProgressionMilestone,
  CompanyProgressionSnapshot,
  CompanyStage,
  OfficeZoneUnlockPreview,
} from "./CompanyProgressionTypes";
import type { OfficeZoneType } from "../layout/OfficeLayoutTypes";

type MilestoneMetric = "activeEmployees" | "completedProjects";

type NormalizedProgressionInput = Record<MilestoneMetric, number>;

const PROGRESSION_BY_LEVEL: Record<number, CompanyProgressionSnapshot> = {
  1: {
    companyLevel: 1,
    companyStage: "garageStartup",
    unlockedOfficeZones: ["entrance", "workspace", "workstationArea", "meetingArea", "breakArea"],
    maxEmployees: 5,
    requiredMilestones: [],
    layoutId: "garage-startup-level-1",
    floorCount: 1,
  },
  2: {
    companyLevel: 2,
    companyStage: "smallOffice",
    unlockedOfficeZones: [
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "storage",
    ],
    maxEmployees: 10,
    requiredMilestones: [
      createMilestone("complete-first-client-project", "Complete first client project", 1),
      createMilestone("hire-five-employees", "Hire five employees", 5),
    ],
    layoutId: "small-office-level-2",
    floorCount: 1,
  },
  3: {
    companyLevel: 3,
    companyStage: "growingCompany",
    unlockedOfficeZones: [
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "serverArea",
      "storage",
    ],
    maxEmployees: 18,
    requiredMilestones: [
      createMilestone("complete-department-launch", "Complete department launch", 3),
      createMilestone("hire-ten-employees", "Hire ten employees", 10),
    ],
    layoutId: "growing-company-level-3",
    floorCount: 1,
  },
  4: {
    companyLevel: 4,
    companyStage: "headquarters",
    unlockedOfficeZones: [
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "serverArea",
      "storage",
      "executiveArea",
    ],
    maxEmployees: 32,
    requiredMilestones: [
      createMilestone("complete-headquarters-plan", "Complete headquarters expansion plan", 1),
      createMilestone("hire-eighteen-employees", "Hire eighteen employees", 18),
    ],
    layoutId: "headquarters-level-4",
    floorCount: 3,
  },
};

const MILESTONE_METRICS: Record<string, MilestoneMetric> = {
  "hire-five-employees": "activeEmployees",
  "complete-first-client-project": "completedProjects",
  "hire-ten-employees": "activeEmployees",
  "complete-department-launch": "completedProjects",
  "hire-eighteen-employees": "activeEmployees",
  "complete-headquarters-plan": "completedProjects",
};

const ASCENDING_LEVELS_ABOVE_ONE = Object.keys(PROGRESSION_BY_LEVEL)
  .map(Number)
  .filter((level) => level > 1)
  .sort((left, right) => left - right);

const OFFICE_ZONE_LABELS: Record<OfficeZoneType, string> = {
  entrance: "Entrance",
  workspace: "Shared Workspace",
  workstationArea: "Desk Area",
  meetingArea: "Meeting Area",
  breakArea: "Break Area",
  reception: "Reception",
  serverArea: "Server Room",
  storage: "Storage",
  executiveArea: "Executive Suite",
};

export class CompanyProgressionService {
  resolveCurrentCompanyLevel(input: CompanyProgressionInput = {}): number {
    const normalized = normalizeInput(input);
    let resolvedLevel = 1;

    for (const candidateLevel of ASCENDING_LEVELS_ABOVE_ONE) {
      const milestones = evaluateMilestones(PROGRESSION_BY_LEVEL[candidateLevel].requiredMilestones, normalized);
      if (milestones.length === 0 || !milestones.every((milestone) => milestone.isMet)) break;

      resolvedLevel = candidateLevel;
    }

    return resolvedLevel;
  }

  getProgressionSnapshot(input: CompanyProgressionInput = {}): CompanyProgressionSnapshot {
    const normalized = normalizeInput(input);
    const companyLevel = this.resolveCurrentCompanyLevel(input);
    const base = PROGRESSION_BY_LEVEL[companyLevel] ?? PROGRESSION_BY_LEVEL[1];

    return cloneProgressionSnapshot(base, evaluateMilestones(base.requiredMilestones, normalized));
  }

  getUnlockedOfficeZones(input: CompanyProgressionInput = {}): OfficeZoneType[] {
    return [...this.getProgressionSnapshot(input).unlockedOfficeZones];
  }

  getActiveLayoutMetadata(input: CompanyProgressionInput = {}) {
    const snapshot = this.getProgressionSnapshot(input);
    return {
      layoutId: snapshot.layoutId,
      companyStage: snapshot.companyStage,
      floorCount: snapshot.floorCount,
    };
  }

  getFutureProgressionMetadata(input: CompanyProgressionInput = {}): ReadonlyArray<CompanyProgressionSnapshot> {
    const normalized = normalizeInput(input);
    const currentLevel = this.resolveCurrentCompanyLevel(input);

    return Object.values(PROGRESSION_BY_LEVEL)
      .filter((snapshot) => snapshot.companyLevel > currentLevel)
      .map((snapshot) => cloneProgressionSnapshot(snapshot, evaluateMilestones(snapshot.requiredMilestones, normalized)));
  }

  getNextOfficeZoneUnlock(input: CompanyProgressionInput = {}): OfficeZoneUnlockPreview | undefined {
    const currentLevel = this.resolveCurrentCompanyLevel(input);
    const unlockedZones = new Set(this.getProgressionSnapshot(input).unlockedOfficeZones);

    for (const level of ASCENDING_LEVELS_ABOVE_ONE) {
      if (level <= currentLevel) continue;

      const zoneType = PROGRESSION_BY_LEVEL[level].unlockedOfficeZones.find((candidate) => !unlockedZones.has(candidate));
      if (zoneType) {
        return { zoneType, label: OFFICE_ZONE_LABELS[zoneType], requiredLevel: level };
      }
    }

    return undefined;
  }
}

function normalizeInput(input: CompanyProgressionInput): NormalizedProgressionInput {
  return {
    activeEmployees: input.activeEmployees ?? 0,
    completedProjects: input.completedProjects ?? 0,
  };
}

function evaluateMilestones(
  milestones: ReadonlyArray<CompanyProgressionMilestone>,
  normalizedInput: NormalizedProgressionInput,
): CompanyProgressionMilestone[] {
  return milestones.map((milestone) => evaluateMilestone(milestone, normalizedInput));
}

function evaluateMilestone(
  milestone: CompanyProgressionMilestone,
  normalizedInput: NormalizedProgressionInput,
): CompanyProgressionMilestone {
  const metric = MILESTONE_METRICS[milestone.milestoneId];
  const targetValue = milestone.targetValue ?? 0;
  const currentValue = metric ? normalizedInput[metric] : milestone.currentValue ?? 0;

  return {
    ...milestone,
    currentValue,
    isMet: currentValue >= targetValue,
  };
}

function createMilestone(milestoneId: string, label: string, targetValue: number): CompanyProgressionMilestone {
  return {
    milestoneId,
    label,
    description: `${label} to unlock the next office stage.`,
    isMet: false,
    targetValue,
    currentValue: 0,
  };
}

function cloneProgressionSnapshot(
  snapshot: CompanyProgressionSnapshot,
  requiredMilestones: ReadonlyArray<CompanyProgressionMilestone> = snapshot.requiredMilestones,
): CompanyProgressionSnapshot {
  return {
    ...snapshot,
    companyStage: snapshot.companyStage as CompanyStage,
    unlockedOfficeZones: [...snapshot.unlockedOfficeZones],
    requiredMilestones: requiredMilestones.map((milestone) => ({ ...milestone })),
  };
}
