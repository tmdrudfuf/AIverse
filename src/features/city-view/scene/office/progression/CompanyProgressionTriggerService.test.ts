import { describe, expect, it } from "vitest";

import { CompanyProgressionService } from "./CompanyProgressionService";
import { CompanyProgressionTriggerService } from "./CompanyProgressionTriggerService";

describe("CompanyProgressionTriggerService", () => {
  it("does not emit triggers during initial level-1 snapshot creation", () => {
    const progression = new CompanyProgressionService();
    const triggers = new CompanyProgressionTriggerService().evaluateLevelTriggers({
      currentSnapshot: progression.getProgressionSnapshot(),
      reachedSnapshots: progression.getReachedProgressionMetadata(),
    });

    expect(triggers).toEqual([]);
  });

  it("emits one copied level-up trigger when company reaches level 2", () => {
    const progression = new CompanyProgressionService();
    const previousSnapshot = progression.getProgressionSnapshot();
    const currentSnapshot = progression.getProgressionSnapshot({ activeEmployees: 5, completedProjects: 1 });
    const reachedSnapshots = progression.getReachedProgressionMetadata({ activeEmployees: 5, completedProjects: 1 });

    const triggers = new CompanyProgressionTriggerService().evaluateLevelTriggers({
      previousSnapshot,
      currentSnapshot,
      reachedSnapshots,
    });

    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toMatchObject({
      triggerId: "company-level-2-reached",
      triggerType: "company_level_reached",
      source: "company_progression",
      fromLevel: 1,
      toLevel: 2,
      companyStage: "smallOffice",
      layoutId: "small-office-level-2",
      floorCount: 1,
      maxEmployees: 10,
    });
    expect(triggers[0].unlockedOfficeZones).toContain("reception");
    expect(triggers[0].milestones).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ milestoneId: "hire-five-employees", currentValue: 5, isMet: true }),
        expect.objectContaining({ milestoneId: "complete-first-client-project", currentValue: 1, isMet: true }),
      ]),
    );

    triggers[0].unlockedOfficeZones.push("executiveArea");
    triggers[0].milestones[0].currentValue = 999;

    const freshReachedSnapshot = progression.getReachedProgressionMetadata({ activeEmployees: 5, completedProjects: 1 })
      .find((snapshot) => snapshot.companyLevel === 2)!;
    expect(freshReachedSnapshot.unlockedOfficeZones).not.toEqual(triggers[0].unlockedOfficeZones);
    expect(freshReachedSnapshot.requiredMilestones[0].currentValue).not.toBe(999);
  });

  it("does not emit duplicate triggers while company stays at the same level", () => {
    const progression = new CompanyProgressionService();
    const previousSnapshot = progression.getProgressionSnapshot({ activeEmployees: 5, completedProjects: 1 });
    const currentSnapshot = progression.getProgressionSnapshot({ activeEmployees: 6, completedProjects: 2 });

    const triggers = new CompanyProgressionTriggerService().evaluateLevelTriggers({
      previousSnapshot,
      currentSnapshot,
      reachedSnapshots: progression.getReachedProgressionMetadata({ activeEmployees: 6, completedProjects: 2 }),
    });

    expect(triggers).toEqual([]);
  });

  it("emits each newly reached level in order when progression jumps multiple levels", () => {
    const progression = new CompanyProgressionService();
    const previousSnapshot = progression.getProgressionSnapshot();
    const currentSnapshot = progression.getProgressionSnapshot({ activeEmployees: 20, completedProjects: 10 });

    const triggers = new CompanyProgressionTriggerService().evaluateLevelTriggers({
      previousSnapshot,
      currentSnapshot,
      reachedSnapshots: progression.getReachedProgressionMetadata({ activeEmployees: 20, completedProjects: 10 }),
    });

    expect(triggers.map((trigger) => trigger.toLevel)).toEqual([2, 3, 4]);
    expect(triggers.map((trigger) => trigger.triggerId)).toEqual([
      "company-level-2-reached",
      "company-level-3-reached",
      "company-level-4-reached",
    ]);
  });

  it("does not emit level-up triggers when progression regresses", () => {
    const progression = new CompanyProgressionService();
    const previousSnapshot = progression.getProgressionSnapshot({ activeEmployees: 20, completedProjects: 10 });
    const currentSnapshot = progression.getProgressionSnapshot({ activeEmployees: 5, completedProjects: 1 });

    const triggers = new CompanyProgressionTriggerService().evaluateLevelTriggers({
      previousSnapshot,
      currentSnapshot,
      reachedSnapshots: progression.getReachedProgressionMetadata({ activeEmployees: 5, completedProjects: 1 }),
    });

    expect(triggers).toEqual([]);
  });
});
