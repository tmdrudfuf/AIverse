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
      featureId: "202608240100-development-request-for-external-project-draft",
      featureBranch: "codex/202608240100-development-request-for-external-project-draft",
      authoritativeBaseSha: "runtime-derived",
      specPath: "specs/202608240100-development-request-for-external-project-draft/spec.md",
      requirementsFilePath: ".aiverse/external-requests/external-project-draft/20260824T0000000-requirements.md",
      requirementsFileContent: "# Development Request\n\nFull request body",
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
    expect(preparation?.requirementsPreview).toContain("Full request body");
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

  it("derives a per-request feature identity when the draft has no target spec metadata", () => {
    const preparation = createExternalProjectAdosRunPreparation({
      projectId: "daily-proof",
      developmentRequestDraft: createDevelopmentRequestDraft({
        id: "daily-proof:external-development-request-draft",
        projectId: "daily-proof",
        projectName: "Daily Proof",
        branchName: undefined,
        specPath: undefined,
        title: "Add billing audit trail",
      }),
      now: "2026-08-29T12:34:00.000Z",
    });

    expect(preparation?.featureId).toBe("202608291234-add-billing-audit-trail");
    expect(preparation?.featureBranch).toBe("codex/202608291234-add-billing-audit-trail");
    expect(preparation?.specPath).toBe("specs/202608291234-add-billing-audit-trail/spec.md");
  });

  it("does not inherit a target project's stale bound branch or spec for a new request", () => {
    const billingPreparation = createExternalProjectAdosRunPreparation({
      projectId: "daily-proof",
      developmentRequestDraft: createDevelopmentRequestDraft({
        id: "daily-proof:external-development-request-draft",
        projectId: "daily-proof",
        projectName: "Daily Proof Inc.",
        title: "Add a billing export feature",
        branchName: "codex/103-daily-proof-configured-runtime-repository-context",
        specPath: "specs/103-daily-proof-configured-runtime-repository-context/spec.md",
      }),
      now: "2026-08-29T12:34:00.000Z",
    });
    const darkModePreparation = createExternalProjectAdosRunPreparation({
      projectId: "daily-proof",
      developmentRequestDraft: createDevelopmentRequestDraft({
        id: "daily-proof:external-development-request-draft",
        projectId: "daily-proof",
        projectName: "Daily Proof Inc.",
        title: "Add a dark mode toggle",
        branchName: "codex/103-daily-proof-configured-runtime-repository-context",
        specPath: "specs/103-daily-proof-configured-runtime-repository-context/spec.md",
      }),
      now: "2026-08-29T12:35:00.000Z",
    });

    expect(billingPreparation?.featureBranch).toBe("codex/202608291234-add-a-billing-export-feature");
    expect(billingPreparation?.specPath).toBe("specs/202608291234-add-a-billing-export-feature/spec.md");
    expect(darkModePreparation?.featureBranch).toBe("codex/202608291235-add-a-dark-mode-toggle");
    expect(darkModePreparation?.specPath).toBe("specs/202608291235-add-a-dark-mode-toggle/spec.md");
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
    requestText: "Full request body",
    targetProjectIdentity: "external-project-draft (External Project Draft; local:AIverse/AIverse)",
    localProjectPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-ados-run-status",
    requirementsArtifactPath: ".aiverse/external-requests/external-project-draft/20260824T0000000-requirements.md",
    requirementsArtifactContent: "# Development Request\n\nFull request body",
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
