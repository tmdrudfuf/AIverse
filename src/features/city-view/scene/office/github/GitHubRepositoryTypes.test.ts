import { describe, expect, it } from "vitest";

import {
  createGitHubExternalSourceStatus,
  type AIverseProjectRepositoryMapping,
  validateAIverseProjectRepositoryMapping,
} from "./GitHubRepositoryTypes";

describe("GitHub repository mapping and source status", () => {
  it("creates display-safe source status labels for all supported states", () => {
    expect([
      createGitHubExternalSourceStatus("fresh").label,
      createGitHubExternalSourceStatus("stale").label,
      createGitHubExternalSourceStatus("unavailable").label,
      createGitHubExternalSourceStatus("unauthenticated").label,
      createGitHubExternalSourceStatus("rate_limited").label,
      createGitHubExternalSourceStatus("offline").label,
      createGitHubExternalSourceStatus("unknown").label,
    ]).toEqual([
      "Fresh",
      "Stale",
      "Unavailable",
      "Unauthenticated",
      "Rate limited",
      "Offline",
      "Unknown",
    ]);
  });

  it("validates an enabled public repository mapping without duplicating simulation state", () => {
    const mapping = createMapping();
    const validation = validateAIverseProjectRepositoryMapping(mapping);

    expect(validation).toMatchObject({
      isValid: true,
      status: {
        state: "unknown",
        label: "Unknown",
      },
    });
    expect(Object.keys(mapping).sort()).toEqual([
      "enabled",
      "projectId",
      "repository",
      "sourceId",
    ]);
    expect(Object.keys(mapping.repository).sort()).toEqual([
      "name",
      "owner",
      "url",
      "visibility",
    ]);
  });

  it("returns unavailable status for missing, disabled, or invalid mappings", () => {
    expect(validateAIverseProjectRepositoryMapping(undefined)).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
    expect(validateAIverseProjectRepositoryMapping(createMapping({ enabled: false }))).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
    expect(validateAIverseProjectRepositoryMapping(createMapping({
      repository: {
        owner: "not valid",
        name: "daily-proof",
        visibility: "public",
      },
    }))).toMatchObject({
      isValid: false,
      status: { state: "unavailable" },
    });
  });

  it("keeps private repositories behind an unauthenticated status until credential handling is approved", () => {
    const validation = validateAIverseProjectRepositoryMapping(createMapping({
      repository: {
        owner: "ai-verse",
        name: "private-proof",
        visibility: "private",
      },
    }));

    expect(validation).toMatchObject({
      isValid: false,
      status: {
        state: "unauthenticated",
        label: "Unauthenticated",
      },
    });
    expect(validation.status.reason).not.toContain("token");
  });
});

function createMapping(overrides: Partial<AIverseProjectRepositoryMapping> = {}): AIverseProjectRepositoryMapping {
  return {
    projectId: overrides.projectId ?? "daily-proof",
    sourceId: overrides.sourceId ?? "github:ai-verse/daily-proof",
    repository: overrides.repository ?? {
      owner: "ai-verse",
      name: "daily-proof",
      url: "https://github.com/ai-verse/daily-proof",
      visibility: "public",
    },
    enabled: overrides.enabled ?? true,
  };
}
