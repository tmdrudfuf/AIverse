export type ProjectPortalProjectStatus = "Active" | "Planned" | "Coming Soon";

export type ProjectPortalProjectType = "company" | "portfolio" | "lab";

export type ProjectPortalProject = {
  id: string;
  name: string;
  status: ProjectPortalProjectStatus;
  type: ProjectPortalProjectType;
  enabled: boolean;
};

export type ProjectPortalServiceStatus = {
  id: string;
  label: string;
  status: "Not connected" | "Placeholder";
  enabled: boolean;
  placeholder: true;
};

export type ProjectPortalState = {
  isOpen: boolean;
  justOpened: boolean;
  projects: ProjectPortalProject[];
  services: ProjectPortalServiceStatus[];
};