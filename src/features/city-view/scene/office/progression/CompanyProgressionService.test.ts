import { describe, expect, it } from "vitest";

import { CompanyProgressionService } from "./CompanyProgressionService";

describe("CompanyProgressionService", () => {
  describe("resolveCurrentCompanyLevel", () => {
    it("stays at level 1 with no input", () => {
      const service = new CompanyProgressionService();

      expect(service.resolveCurrentCompanyLevel()).toBe(1);
      expect(service.resolveCurrentCompanyLevel({})).toBe(1);
    });

    it("advances to level 2 once all of level 2's milestones are met", () => {
      const service = new CompanyProgressionService();

      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 5, completedProjects: 1 })).toBe(2);
    });

    it("does not advance when only one of a level's milestones is met", () => {
      const service = new CompanyProgressionService();

      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 6, completedProjects: 0 })).toBe(1);
      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 0, completedProjects: 5 })).toBe(1);
    });

    it("does not skip a level even if a later level's thresholds happen to be met", () => {
      const service = new CompanyProgressionService();

      // Meets level 3's employee threshold (10) but not level 2's project threshold (1).
      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 10, completedProjects: 0 })).toBe(1);
    });

    it("caps at the highest defined level and never exceeds it", () => {
      const service = new CompanyProgressionService();

      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 20, completedProjects: 10 })).toBe(4);
    });

    it("treats an input exactly equal to targetValue as met (boundary, not almost-met)", () => {
      const service = new CompanyProgressionService();

      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 5, completedProjects: 1 })).toBe(2);
      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 10, completedProjects: 3 })).toBe(3);
      expect(service.resolveCurrentCompanyLevel({ activeEmployees: 18, completedProjects: 3 })).toBe(4);
    });
  });

  describe("getProgressionSnapshot", () => {
    it("returns the level 1 (garage-startup) snapshot by default", () => {
      const service = new CompanyProgressionService();

      const snapshot = service.getProgressionSnapshot();

      expect(snapshot.companyLevel).toBe(1);
      expect(snapshot.companyStage).toBe("garageStartup");
      expect(snapshot.layoutId).toBe("garage-startup-level-1");
      expect(snapshot.maxEmployees).toBe(5);
      expect(snapshot.requiredMilestones).toEqual([]);
    });

    it("returns the level 2 snapshot with real, met milestone values once thresholds are crossed", () => {
      const service = new CompanyProgressionService();

      const snapshot = service.getProgressionSnapshot({ activeEmployees: 5, completedProjects: 1 });

      expect(snapshot.companyLevel).toBe(2);
      expect(snapshot.companyStage).toBe("smallOffice");
      expect(snapshot.layoutId).toBe("small-office-level-2");
      expect(snapshot.maxEmployees).toBe(10);
      expect(snapshot.unlockedOfficeZones).toEqual(
        expect.arrayContaining(["reception", "storage"]),
      );

      const hireFive = snapshot.requiredMilestones.find((milestone) => milestone.milestoneId === "hire-five-employees");
      expect(hireFive).toMatchObject({ currentValue: 5, targetValue: 5, isMet: true });

      const firstProject = snapshot.requiredMilestones.find(
        (milestone) => milestone.milestoneId === "complete-first-client-project",
      );
      expect(firstProject).toMatchObject({ currentValue: 1, targetValue: 1, isMet: true });
    });

    it("reports the highest defined level's own milestones as met with real values, not an empty array", () => {
      const service = new CompanyProgressionService();

      const snapshot = service.getProgressionSnapshot({ activeEmployees: 20, completedProjects: 10 });

      expect(snapshot.companyLevel).toBe(4);
      expect(snapshot.requiredMilestones).toHaveLength(2);
      expect(snapshot.requiredMilestones.every((milestone) => milestone.isMet)).toBe(true);

      const hireEighteen = snapshot.requiredMilestones.find(
        (milestone) => milestone.milestoneId === "hire-eighteen-employees",
      );
      expect(hireEighteen).toMatchObject({ currentValue: 20, targetValue: 18, isMet: true });
    });

    it("does not mutate PROGRESSION_BY_LEVEL's static data between calls", () => {
      const service = new CompanyProgressionService();

      service.getProgressionSnapshot({ activeEmployees: 5, completedProjects: 1 });
      const freshSnapshot = service.getProgressionSnapshot();

      expect(freshSnapshot.companyLevel).toBe(1);
      expect(freshSnapshot.requiredMilestones).toEqual([]);
    });
  });

  describe("getUnlockedOfficeZones / getActiveLayoutMetadata", () => {
    it("derive from the resolved current level", () => {
      const service = new CompanyProgressionService();

      expect(service.getUnlockedOfficeZones({ activeEmployees: 0, completedProjects: 0 })).not.toContain("reception");
      expect(service.getUnlockedOfficeZones({ activeEmployees: 5, completedProjects: 1 })).toContain("reception");

      expect(service.getActiveLayoutMetadata({ activeEmployees: 5, completedProjects: 1 })).toEqual({
        layoutId: "small-office-level-2",
        companyStage: "smallOffice",
        floorCount: 1,
      });
    });
  });

  describe("getFutureProgressionMetadata", () => {
    it("returns levels 2-4 with real evaluated milestones while still at level 1", () => {
      const service = new CompanyProgressionService();

      const future = service.getFutureProgressionMetadata({ activeEmployees: 3, completedProjects: 0 });

      expect(future.map((snapshot) => snapshot.companyLevel)).toEqual([2, 3, 4]);

      const level2 = future.find((snapshot) => snapshot.companyLevel === 2)!;
      const hireFive = level2.requiredMilestones.find((milestone) => milestone.milestoneId === "hire-five-employees");
      expect(hireFive).toMatchObject({ currentValue: 3, targetValue: 5, isMet: false });
    });

    it("returns only levels above the resolved current level once the company advances", () => {
      const service = new CompanyProgressionService();

      const future = service.getFutureProgressionMetadata({ activeEmployees: 5, completedProjects: 1 });

      expect(future.map((snapshot) => snapshot.companyLevel)).toEqual([3, 4]);
    });

    it("returns an empty list at the highest defined level", () => {
      const service = new CompanyProgressionService();

      const future = service.getFutureProgressionMetadata({ activeEmployees: 20, completedProjects: 10 });

      expect(future).toEqual([]);
    });
  });

  describe("getNextOfficeZoneUnlock", () => {
    it("reports Reception as the next zone unlock, required at level 2, while still at level 1", () => {
      const service = new CompanyProgressionService();

      expect(service.getNextOfficeZoneUnlock({ activeEmployees: 0, completedProjects: 0 })).toEqual({
        zoneType: "reception",
        label: "Reception",
        requiredLevel: 2,
      });
    });

    it("reports the level 3 zone unlock once level 2 is reached (boundary: exact level-2 thresholds)", () => {
      const service = new CompanyProgressionService();

      expect(service.getNextOfficeZoneUnlock({ activeEmployees: 5, completedProjects: 1 })).toEqual({
        zoneType: "serverArea",
        label: "Server Room",
        requiredLevel: 3,
      });
    });

    it("reports the level 4 zone unlock once level 3 is reached", () => {
      const service = new CompanyProgressionService();

      expect(service.getNextOfficeZoneUnlock({ activeEmployees: 10, completedProjects: 3 })).toEqual({
        zoneType: "executiveArea",
        label: "Executive Suite",
        requiredLevel: 4,
      });
    });

    it("returns undefined once every zone is unlocked at the highest defined level", () => {
      const service = new CompanyProgressionService();

      expect(service.getNextOfficeZoneUnlock({ activeEmployees: 20, completedProjects: 10 })).toBeUndefined();
    });
  });
});
