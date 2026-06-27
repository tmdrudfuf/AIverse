import type { ProjectPortalProject, ProjectPortalServiceStatus, ProjectPortalState } from "./OfficeProjectPortalTypes";

const PLACEHOLDER_SERVICES: ProjectPortalServiceStatus[] = [
  {
    id: "github",
    label: "GitHub",
    status: "Not connected",
    enabled: false,
    placeholder: true,
  },
  {
    id: "firebase",
    label: "Firebase",
    status: "Not connected",
    enabled: false,
    placeholder: true,
  },
  {
    id: "analytics",
    label: "Analytics",
    status: "Placeholder",
    enabled: false,
    placeholder: true,
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    status: "Placeholder",
    enabled: false,
    placeholder: true,
  },
];

const PROJECTS: ProjectPortalProject[] = [
  {
    id: "daily-proof",
    name: "Daily Proof",
    status: "Active",
    type: "Company",
    enabled: true,
    description: "Daily Proof is the active company workspace for validating AIverse office workflows.",
    linkedServices: createLinkedServices(),
    nextAction: {
      label: "Review project workspace",
      enabled: true,
      placeholder: true,
    },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    status: "Planned",
    type: "Portfolio",
    enabled: false,
    description: "Portfolio will become the public-facing project showcase.",
    linkedServices: createLinkedServices(),
    nextAction: {
      label: "Coming soon",
      enabled: false,
      placeholder: true,
    },
  },
  {
    id: "ai-lab",
    name: "AI Lab",
    status: "Coming Soon",
    type: "Lab",
    enabled: false,
    description: "AI Lab will house experimental agents and automation workflows.",
    linkedServices: createLinkedServices(),
    nextAction: {
      label: "Coming soon",
      enabled: false,
      placeholder: true,
    },
  },
];

export function createProjectPortalState(): ProjectPortalState {
  return {
    isOpen: false,
    justOpened: false,
    viewMode: "list",
    selectedProjectIndex: 0,
    selectedProjectId: PROJECTS[0].id,
    projects: PROJECTS.map((project) => ({
      ...project,
      linkedServices: project.linkedServices.map((service) => ({ ...service })),
      nextAction: { ...project.nextAction },
    })),
    services: createLinkedServices(),
  };
}

function createLinkedServices() {
  return PLACEHOLDER_SERVICES.map((service) => ({ ...service }));
}