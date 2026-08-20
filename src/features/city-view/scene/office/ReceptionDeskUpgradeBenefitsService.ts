import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

export type ReceptionDeskUpgradeBenefits = {
  source: "reception_desk_upgrade";
  level: number;
  heading: string;
  summary: string;
  benefits: string[];
};

export class ReceptionDeskUpgradeBenefitsService {
  createBenefits(progression: CompanyProgressionSnapshot | undefined): ReceptionDeskUpgradeBenefits | undefined {
    if (!progression || progression.companyLevel < 2 || !progression.unlockedOfficeZones.includes("reception")) {
      return undefined;
    }

    return {
      source: "reception_desk_upgrade",
      level: progression.companyLevel,
      heading: "Reception Upgrade Benefits",
      summary: `Level ${progression.companyLevel} reception is active for this workspace.`,
      benefits: [
        "Reception area unlocked",
        `Employee capacity increased to ${progression.maxEmployees}`,
        "Workspace coordination now has a front-desk entry point",
      ],
    };
  }
}
