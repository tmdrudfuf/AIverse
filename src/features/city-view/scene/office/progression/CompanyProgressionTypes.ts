import type { OfficeZoneType } from "../layout/OfficeLayoutTypes";

export type CompanyStage = "garageStartup" | "smallOffice" | "growingCompany" | "headquarters";

export type CompanyProgressionMilestone = {
  milestoneId: string;
  label: string;
  description: string;
  isMet: boolean;
  targetValue?: number;
  currentValue?: number;
};

export type CompanyProgressionSnapshot = {
  companyLevel: number;
  companyStage: CompanyStage;
  unlockedOfficeZones: OfficeZoneType[];
  maxEmployees: number;
  requiredMilestones: CompanyProgressionMilestone[];
  layoutId: string;
  floorCount: number;
};

export type CompanyProgressionInput = {
  completedProjects?: number;
  activeEmployees?: number;
  revenue?: number;
};
