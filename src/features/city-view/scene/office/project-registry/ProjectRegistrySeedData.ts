import type { ProjectRegistryEntry } from "./ProjectRegistryTypes";

const SEED_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const DAILY_PROOF_REPOSITORY = {
  owner: "ai-verse",
  name: "daily-proof",
  url: "https://github.com/ai-verse/daily-proof",
  defaultBranch: "main",
} as const;

export function createDefaultProjectRegistryEntries(): ProjectRegistryEntry[] {
  return [
    {
      id: "daily-proof",
      displayName: "Daily Proof",
      shortDescription: "Daily Proof is the active company workspace for validating AIverse office workflows.",
      lifecycleStatus: "Active",
      projectType: "Company",
      localRepository: {
        connected: true,
        label: "Connected (local)",
      },
      remoteRepository: {
        owner: DAILY_PROOF_REPOSITORY.owner,
        name: DAILY_PROOF_REPOSITORY.name,
        url: DAILY_PROOF_REPOSITORY.url,
        visibility: "public",
      },
      repositoryIdentity: {
        provider: "github",
        owner: DAILY_PROOF_REPOSITORY.owner,
        name: DAILY_PROOF_REPOSITORY.name,
        url: DAILY_PROOF_REPOSITORY.url,
        defaultBranch: DAILY_PROOF_REPOSITORY.defaultBranch,
        connectionState: "Configured",
      },
      owner: {
        companyName: "Daily Proof Inc.",
      },
      createdAt: SEED_TIMESTAMP,
      lastActivityAt: SEED_TIMESTAMP,
    },
    {
      id: "portfolio",
      displayName: "Portfolio",
      shortDescription: "Portfolio will become the public-facing project showcase.",
      lifecycleStatus: "Planned",
      projectType: "Portfolio",
      localRepository: {
        connected: false,
        label: "Not connected",
      },
      repositoryIdentity: {
        provider: "local",
        connectionState: "Unknown",
      },
      owner: {
        companyName: "AIverse Internal",
      },
      createdAt: SEED_TIMESTAMP,
      lastActivityAt: SEED_TIMESTAMP,
    },
    {
      id: "ai-lab",
      displayName: "AI Lab",
      shortDescription: "AI Lab will house experimental agents and automation workflows.",
      lifecycleStatus: "Coming Soon",
      projectType: "Lab",
      localRepository: {
        connected: false,
        label: "Not connected",
      },
      repositoryIdentity: {
        provider: "local",
        connectionState: "Unknown",
      },
      owner: {
        companyName: "AIverse Internal",
      },
      createdAt: SEED_TIMESTAMP,
      lastActivityAt: SEED_TIMESTAMP,
    },
  ];
}
