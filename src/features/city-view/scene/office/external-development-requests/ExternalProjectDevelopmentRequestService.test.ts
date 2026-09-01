import { describe, expect, it } from "vitest";

import { addExternalProjectDraftToState, applyExternalProjectDraftRepositoryIdentityChoiceToState, createProjectPortalState, EXTERNAL_PROJECT_DRAFT_ID } from "../OfficeProjectPortalRegistry";
import {
  canCreateExternalProjectDevelopmentRequestDraft,
  createExternalProjectDevelopmentRequestDraft,
  resolveDevelopmentRequestTargetProject,
} from "./ExternalProjectDevelopmentRequestService";

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
      requestText: "Create a development request for External Project Draft.",
      targetProjectIdentity: "external-project-draft (External Project Draft; local:AIverse/AIverse)",
      requirementsArtifactPath: ".aiverse/external-requests/external-project-draft/20260824T00000000-requirements.md",
      repositoryProvider: "local",
      repositoryOwner: "AIverse",
      repositoryName: "AIverse",
    });
    expect(draft.branchName).toBeUndefined();
    expect(draft.specPath).toBeUndefined();
    expect(draft.sideEffectBoundary).toContain("no runtime");
    expect(draft.requirementsArtifactContent).toContain("Target project id: external-project-draft");
    expect(draft.requirementsArtifactContent).toContain("Create a development request for External Project Draft.");
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

  it("targets the active bound company project instead of stale portal selection", () => {
    const state = createProjectPortalState({ activeProjectId: "daily-proof" });
    state.selectedProjectId = "portfolio";

    const target = resolveDevelopmentRequestTargetProject({
      activeProjectCompanyContext: state.activeProjectCompanyContext,
      selectedProjectId: state.selectedProjectId,
      projects: state.projects,
    });

    expect(target?.id).toBe("daily-proof");
  });

  it("preserves full hostile request text as requirements content, not a path segment", () => {
    const state = createProjectPortalState({ activeProjectId: "daily-proof" });
    const project = state.projects.find((item) => item.id === "daily-proof")!;
    const requestText = "Add docs && Remove-Item -Recurse C:/important\nKeep the full second line.";

    const draft = createExternalProjectDevelopmentRequestDraft({
      project,
      activeProjectCompanyContext: state.activeProjectCompanyContext,
      requestText,
      now: "2026-08-29T10:00:00.000Z",
    });

    expect(draft.projectId).toBe("daily-proof");
    expect(draft.requirementsArtifactContent).toContain(requestText);
    expect(draft.requirementsArtifactPath).not.toContain("Remove-Item");
    expect(draft.requirementsArtifactPath).not.toContain("&&");
  });

  it("uses the backlog task title as the visible request title without markdown heading syntax", () => {
    const state = createProjectPortalState({ activeProjectId: "daily-proof" });
    const project = state.projects.find((item) => item.id === "daily-proof")!;

    const draft = createExternalProjectDevelopmentRequestDraft({
      project,
      activeProjectCompanyContext: state.activeProjectCompanyContext,
      requestText: [
        "# Build export filters",
        "",
        "Source backlog task id: backlog-task-1",
        "",
        "## Task Description",
        "Keep the full task body.",
      ].join("\n"),
      sourceBacklogTaskId: "backlog-task-1",
      now: "2026-08-29T10:00:00.000Z",
    });

    expect(draft.title).toBe("Build export filters");
  });

  it("returns no mutation target when the active project-company binding is unavailable", () => {
    const state = createProjectPortalState({ activeProjectId: "missing-project" });

    const target = resolveDevelopmentRequestTargetProject({
      activeProjectCompanyContext: state.activeProjectCompanyContext,
      selectedProjectId: "daily-proof",
      projects: state.projects,
    });

    expect(target).toBeUndefined();
  });
});
