import { describe, expect, it } from "vitest";

import { addExternalProjectDraftToState, applyExternalProjectDraftRepositoryIdentityChoiceToState, createProjectPortalState, EXTERNAL_PROJECT_DRAFT_ID } from "../OfficeProjectPortalRegistry";
import { canCreateExternalProjectDevelopmentRequestDraft, createExternalProjectDevelopmentRequestDraft } from "./ExternalProjectDevelopmentRequestService";

describe("ExternalProjectDevelopmentRequestService", () => {
  it("creates a local-only development request draft for a configured external project", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    const project = state.projects.find((item) => item.id === EXTERNAL_PROJECT_DRAFT_ID);

    expect(canCreateExternalProjectDevelopmentRequestDraft(project)).toBe(true);

    const draft = createExternalProjectDevelopmentRequestDraft({
      project: project!,
      now: "2026-08-24T00:00:00.000Z",
    });

    expect(draft).toMatchObject({
      id: "external-project-draft:external-development-request-draft",
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      projectName: "External Project Draft",
      status: "Draft",
      repositoryProvider: "local",
      repositoryOwner: "AIverse",
      repositoryName: "AIverse",
      branchName: "codex/130-external-project-ados-run-status",
      specPath: "specs/130-external-project-ados-run-status/spec.md",
    });
    expect(draft.sideEffectBoundary).toContain("no runtime");
  });

  it("reuses an existing development request draft without changing its identity", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    const project = state.projects.find((item) => item.id === EXTERNAL_PROJECT_DRAFT_ID)!;
    const existingDraft = createExternalProjectDevelopmentRequestDraft({
      project,
      now: "2026-08-24T00:00:00.000Z",
    });

    const reusedDraft = createExternalProjectDevelopmentRequestDraft({
      project,
      existingDraft,
      now: "2026-08-24T00:05:00.000Z",
    });

    expect(reusedDraft.id).toBe(existingDraft.id);
    expect(reusedDraft.createdAt).toBe(existingDraft.createdAt);
    expect(reusedDraft.updatedAt).toBe("2026-08-24T00:05:00.000Z");
  });
});
