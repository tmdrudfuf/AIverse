import { describe, expect, it } from "vitest";

import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import {
  EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY,
  createExternalProjectAdosRunPreparation,
} from "./ExternalProjectAdosRunPreparationService";

describe("ExternalProjectAdosRunPreparationService", () => {
  it("creates a local ADOS run preparation from a development request draft", () => {
    const preparation = createExternalProjectAdosRunPreparation({
      projectId: "external-project-draft",
      developmentRequestDraft: createDevelopmentRequestDraft(),
      now: "2026-08-24T01:00:00.000Z",
    });

    expect(preparation).toMatchObject({
      id: "external-project-draft:external-ados-run-preparation",
      projectId: "external-project-draft",
      developmentRequestDraftId: "external-project-draft:external-development-request-draft",
      status: "Prepared",
      featureBranch: "codex/130-external-project-ados-run-status",
      authoritativeBaseSha: "7570ef96767957102b992e68b4df87e7d70ce5cb",
      specPath: "specs/130-external-project-ados-run-status/spec.md",
      reviewerCommand: "claude -p",
      executionPolicyVersion: 1,
      createdAt: "2026-08-24T01:00:00.000Z",
      updatedAt: "2026-08-24T01:00:00.000Z",
      sideEffectBoundary: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY,
    });
    expect(preparation?.validationCommands).toEqual([
      "npm test",
      "npx tsc --noEmit",
      "npm run build",
      "npm run test:e2e:home-canvas",
      "git diff --check",
      "git diff --cached --check",
    ]);
  });

  it("reuses an existing preparation without changing its identity", () => {
    const firstPreparation = createExternalProjectAdosRunPreparation({
      projectId: "external-project-draft",
      developmentRequestDraft: createDevelopmentRequestDraft(),
      now: "2026-08-24T01:00:00.000Z",
    });

    const reusedPreparation = createExternalProjectAdosRunPreparation({
      projectId: "external-project-draft",
      developmentRequestDraft: createDevelopmentRequestDraft(),
      existingPreparation: firstPreparation,
      now: "2026-08-24T02:00:00.000Z",
    });

    expect(reusedPreparation?.id).toBe(firstPreparation?.id);
    expect(reusedPreparation?.createdAt).toBe(firstPreparation?.createdAt);
    expect(reusedPreparation?.updatedAt).toBe("2026-08-24T02:00:00.000Z");
    expect(reusedPreparation?.validationCommands).toEqual(firstPreparation?.validationCommands);
    expect(reusedPreparation?.validationCommands).not.toBe(firstPreparation?.validationCommands);
  });

  it("does not create a preparation without a matching development request draft", () => {
    expect(createExternalProjectAdosRunPreparation({
      projectId: "external-project-draft",
      developmentRequestDraft: undefined,
    })).toBeUndefined();
    expect(createExternalProjectAdosRunPreparation({
      projectId: "external-project-draft",
      developmentRequestDraft: createDevelopmentRequestDraft({ projectId: "other-project" }),
    })).toBeUndefined();
  });
});

function createDevelopmentRequestDraft(
  overrides: Partial<ExternalProjectDevelopmentRequestDraft> = {},
): ExternalProjectDevelopmentRequestDraft {
  return {
    id: "external-project-draft:external-development-request-draft",
    projectId: "external-project-draft",
    projectName: "External Project Draft",
    status: "Draft",
    title: "Development request for External Project Draft",
    summary: "Draft request for future external project development work.",
    repositoryProvider: "local",
    repositoryOwner: "AIverse",
    repositoryName: "AIverse",
    branchName: "codex/130-external-project-ados-run-status",
    specPath: "specs/130-external-project-ados-run-status/spec.md",
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    sideEffectBoundary: "Local draft only.",
    ...overrides,
  };
}
