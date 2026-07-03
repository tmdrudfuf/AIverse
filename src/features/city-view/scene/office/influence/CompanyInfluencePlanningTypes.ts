export type CompanyFocusId =
  | "delivery-speed"
  | "quality"
  | "team-morale"
  | "project-risk"
  | "company-growth";

export type CompanyFocusOption = {
  id: CompanyFocusId;
  label: string;
  description: string;
  advisorySummary: string;
  futureMetadataTags: string[];
};

export type CompanyInfluencePlanState = {
  selectedFocusId?: CompanyFocusId;
  updatedAt?: string;
};

export type CompanyFocusSummary = {
  isSet: boolean;
  currentFocus?: CompanyFocusOption;
  options: CompanyFocusOption[];
  summary: string;
};
