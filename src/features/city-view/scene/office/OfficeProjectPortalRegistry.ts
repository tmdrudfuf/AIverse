import type { ProjectPortalState } from "./OfficeProjectPortalTypes";

export function createProjectPortalState(): ProjectPortalState {
  return {
    isOpen: false,
    justOpened: false,
    projects: [
      {
        id: "daily-proof",
        name: "Daily Proof",
        status: "Active",
        type: "company",
        enabled: true,
      },
      {
        id: "portfolio",
        name: "Portfolio",
        status: "Planned",
        type: "portfolio",
        enabled: false,
      },
      {
        id: "ai-lab",
        name: "AI Lab",
        status: "Coming Soon",
        type: "lab",
        enabled: false,
      },
    ],
    services: [
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
    ],
  };
}