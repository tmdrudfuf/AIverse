export type CompanyDashboardSourceSystem =
  | "employee_ai"
  | "schedule"
  | "projects"
  | "company_progression"
  | "office_layout"
  | "conversation"
  | "employee_insight"
  | "employee_knowledge"
  | "work_session"
  | "task_activity";

export type CompanyDashboardSourceAvailability = {
  source: CompanyDashboardSourceSystem;
  available: boolean;
  reason?: string;
};
