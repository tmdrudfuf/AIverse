export type ProjectPortalProjectStatus = "Active" | "Planned" | "Coming Soon";

export type ProjectPortalProjectType = "Company" | "Portfolio" | "Lab";

export type ProjectPortalViewMode = "list" | "detail";

export type ProjectPortalServiceStatus = {
  id: string;
  label: string;
  status: "Not connected" | "Placeholder";
  enabled: boolean;
  placeholder: true;
};

export type ProjectPortalNextAction = {
  label: string;
  enabled: boolean;
  placeholder: true;
};

export type ProjectPortalProject = {
  id: string;
  name: string;
  status: ProjectPortalProjectStatus;
  type: ProjectPortalProjectType;
  enabled: boolean;
  description: string;
  linkedServices: ProjectPortalServiceStatus[];
  nextAction: ProjectPortalNextAction;
};

export type ProjectPortalPlaceholderAction = {
  projectId: string;
  actionLabel: string;
  status: "placeholder";
};

export type ProjectPortalState = {
  isOpen: boolean;
  justOpened: boolean;
  viewMode: ProjectPortalViewMode;
  selectedProjectIndex: number;
  selectedProjectId: string;
  lastPlaceholderAction?: ProjectPortalPlaceholderAction;
  projects: ProjectPortalProject[];
  services: ProjectPortalServiceStatus[];
};