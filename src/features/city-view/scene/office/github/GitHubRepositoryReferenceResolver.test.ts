import { describe, expect, it } from "vitest";

import { createRepositoryReferenceResolver } from "./GitHubRepositoryReferenceResolver";
import type { AIverseProjectRepositoryMapping } from "./GitHubRepositoryTypes";

describe("createRepositoryReferenceResolver", () => {
  it("resolves an owner/name reference for a valid, enabled, public mapping", () => {
    const mappings = [createMapping()];
    const resolver = createRepositoryReferenceResolver(() => mappings);

    expect(resolver("daily-proof")).toEqual({ owner: "ai-verse", name: "daily-proof" });
  });

  it("returns undefined when no mapping exists for the project id", () => {
    const resolver = createRepositoryReferenceResolver(() => [createMapping()]);

    expect(resolver("unmapped-project")).toBeUndefined();
  });

  it("returns undefined when the mapping is disabled", () => {
    const resolver = createRepositoryReferenceResolver(() => [createMapping({ enabled: false })]);

    expect(resolver("daily-proof")).toBeUndefined();
  });

  it("returns undefined when the mapping's repository is private", () => {
    const resolver = createRepositoryReferenceResolver(() => [
      createMapping({ repository: { owner: "ai-verse", name: "daily-proof", visibility: "private" } }),
    ]);

    expect(resolver("daily-proof")).toBeUndefined();
  });

  it("returns undefined when the mapping's owner/name are not display-safe", () => {
    const resolver = createRepositoryReferenceResolver(() => [
      createMapping({ repository: { owner: "ai verse!", name: "daily-proof", visibility: "public" } }),
    ]);

    expect(resolver("daily-proof")).toBeUndefined();
  });

  it("never derives owner/name from a project's display name or title", () => {
    // The mapping's repository fields intentionally differ from any project display name;
    // the resolver must only ever read mapping.repository, never a project name lookup.
    const mappings = [createMapping({
      projectId: "internal-project-id",
      repository: { owner: "real-owner", name: "real-repo", visibility: "public" },
    })];
    const resolver = createRepositoryReferenceResolver(() => mappings);

    const reference = resolver("internal-project-id");

    expect(reference).toEqual({ owner: "real-owner", name: "real-repo" });
    expect(reference?.owner).not.toBe("Internal Project Display Name");
  });

  it("reads mappings live rather than a stale snapshot captured at construction time", () => {
    let mappings: AIverseProjectRepositoryMapping[] = [];
    const resolver = createRepositoryReferenceResolver(() => mappings);

    expect(resolver("daily-proof")).toBeUndefined();

    mappings = [createMapping()];

    expect(resolver("daily-proof")).toEqual({ owner: "ai-verse", name: "daily-proof" });
  });

  it("does not mutate the mapping array or mapping objects while resolving", () => {
    const mapping = createMapping();
    const mappings = [mapping];
    const beforeMappings = structuredClone(mappings);
    const resolver = createRepositoryReferenceResolver(() => mappings);

    resolver("daily-proof");
    resolver("unmapped-project");

    expect(mappings).toEqual(beforeMappings);
  });

  it("is deterministic for repeated calls with unchanged mapping data", () => {
    const mappings = [createMapping()];
    const resolver = createRepositoryReferenceResolver(() => mappings);

    const first = resolver("daily-proof");
    const second = resolver("daily-proof");

    expect(first).toEqual(second);
  });
});

function createMapping(
  overrides: Partial<AIverseProjectRepositoryMapping> & {
    repository?: Partial<AIverseProjectRepositoryMapping["repository"]>;
  } = {},
): AIverseProjectRepositoryMapping {
  return {
    projectId: overrides.projectId ?? "daily-proof",
    sourceId: overrides.sourceId ?? "github:ai-verse/daily-proof",
    enabled: overrides.enabled ?? true,
    repository: {
      owner: "ai-verse",
      name: "daily-proof",
      url: "https://github.com/ai-verse/daily-proof",
      visibility: "public",
      ...overrides.repository,
    },
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
  };
}
