import type { CompanyProgressionSnapshot, CompanyProgressionTrigger } from "./CompanyProgressionTypes";

export type CompanyProgressionTriggerEvaluationInput = {
  previousSnapshot?: CompanyProgressionSnapshot;
  currentSnapshot?: CompanyProgressionSnapshot;
  reachedSnapshots: ReadonlyArray<CompanyProgressionSnapshot>;
};

export class CompanyProgressionTriggerService {
  evaluateLevelTriggers(input: CompanyProgressionTriggerEvaluationInput): CompanyProgressionTrigger[] {
    const { previousSnapshot, currentSnapshot } = input;
    if (!previousSnapshot || !currentSnapshot) return [];
    if (currentSnapshot.companyLevel <= previousSnapshot.companyLevel) return [];

    return input.reachedSnapshots
      .filter((snapshot) =>
        snapshot.companyLevel > previousSnapshot.companyLevel
        && snapshot.companyLevel <= currentSnapshot.companyLevel,
      )
      .sort((left, right) => left.companyLevel - right.companyLevel)
      .map((snapshot) => createLevelReachedTrigger(previousSnapshot.companyLevel, snapshot));
  }
}

function createLevelReachedTrigger(
  previousLevel: number,
  snapshot: CompanyProgressionSnapshot,
): CompanyProgressionTrigger {
  return {
    triggerId: `company-level-${snapshot.companyLevel}-reached`,
    triggerType: "company_level_reached",
    source: "company_progression",
    fromLevel: previousLevel,
    toLevel: snapshot.companyLevel,
    companyStage: snapshot.companyStage,
    layoutId: snapshot.layoutId,
    floorCount: snapshot.floorCount,
    maxEmployees: snapshot.maxEmployees,
    unlockedOfficeZones: [...snapshot.unlockedOfficeZones],
    milestones: snapshot.requiredMilestones.map((milestone) => ({ ...milestone })),
  };
}
