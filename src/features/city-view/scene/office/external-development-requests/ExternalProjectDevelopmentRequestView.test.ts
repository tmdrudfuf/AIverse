import { describe, expect, it } from "vitest";

import { createExternalProjectDevelopmentRequestDisplayRows } from "./ExternalProjectDevelopmentRequestView";

describe("ExternalProjectDevelopmentRequestView", () => {
  it("renders compact development request draft display rows", () => {
    expect(createExternalProjectDevelopmentRequestDisplayRows({
      id: "request-1",
      projectId: "external-project-draft",
      projectName: "External Project Draft",
      status: "Draft",
      title: "Development request for External Project Draft",
      summary: "Draft request.",
      repositoryProvider: "local",
      repositoryOwner: "AIverse",
      repositoryName: "AIverse",
      branchName: "codex/127-external-project-development-request-draft",
      specPath: "specs/127-external-project-development-request-draft/spec.md",
      createdAt: "2026-08-24T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z",
      sideEffectBoundary: "Local draft only; no runtime side effects.",
    })).toEqual({
      statusText: "Draft - Development request for External Project Draft",
      contextText: "local:AIverse/AIverse @ codex/127-external-project-development-request-draft; specs/127-external-project-development-request-draft/spec.md",
      boundaryText: "Local draft only; no runtime side effects.",
    });
  });
});
