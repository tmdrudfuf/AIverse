import type {
  CompanyProgressionInput,
  CompanyProgressionMilestone,
  CompanyProgressionSnapshot,
  CompanyStage,
} from "./CompanyProgressionTypes";
import type { OfficeZoneType } from "../layout/OfficeLayoutTypes";

const CURRENT_COMPANY_LEVEL = 1;

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
      createMilestone("complete-first-client-project", "Complete first client project", 1, 0),
      createMilestone("hire-five-employees", "Hire five employees", 5, 0),
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
      createMilestone("complete-department-launch", "Complete department launch", 3, 0),
      createMilestone("hire-ten-employees", "Hire ten employees", 10, 0),
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
      createMilestone("complete-headquarters-plan", "Complete headquarters expansion plan", 1, 0),
      createMilestone("hire-eighteen-employees", "Hire eighteen employees", 18, 0),
    ],
    layoutId: "headquarters-level-4",
    floorCount: 3,
  },
};

export class CompanyProgressionService {
  resolveCurrentCompanyLevel(_input: CompanyProgressionInput = {}): number {
    return CURRENT_COMPANY_LEVEL;
  }

  getProgressionSnapshot(input: CompanyProgressionInput = {}): CompanyProgressionSnapshot {
    const companyLevel = this.resolveCurrentCompanyLevel(input);
    return cloneProgressionSnapshot(PROGRESSION_BY_LEVEL[companyLevel] ?? PROGRESSION_BY_LEVEL[1]);
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

  getFutureProgressionMetadata(): ReadonlyArray<CompanyProgressionSnapshot> {
    return Object.values(PROGRESSION_BY_LEVEL)
      .filter((snapshot) => snapshot.companyLevel > CURRENT_COMPANY_LEVEL)
      .map(cloneProgressionSnapshot);
  }
}

function createMilestone(
  milestoneId: string,
  label: string,
  targetValue: number,
  currentValue: number,
): CompanyProgressionMilestone {
  return {
    milestoneId,
    label,
    description: `${label} to unlock the next office stage.`,
    isMet: currentValue >= targetValue,
    targetValue,
    currentValue,
  };
}

function cloneProgressionSnapshot(snapshot: CompanyProgressionSnapshot): CompanyProgressionSnapshot {
  return {
    ...snapshot,
    companyStage: snapshot.companyStage as CompanyStage,
    unlockedOfficeZones: [...snapshot.unlockedOfficeZones],
    requiredMilestones: snapshot.requiredMilestones.map((milestone) => ({ ...milestone })),
  };
}
