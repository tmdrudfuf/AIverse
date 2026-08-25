import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ExternalProjectDevelopmentRequestDraft } from "./ExternalProjectDevelopmentRequestTypes";

export const EXTERNAL_PROJECT_DEVELOPMENT_REQUEST_BOUNDARY =
  "Local draft only; no runtime, repository, GitHub, validation, publish, merge, or deploy side effects.";

export type CreateExternalProjectDevelopmentRequestDraftInput = {
  project: ProjectPortalProject;
  existingDraft?: ExternalProjectDevelopmentRequestDraft;
  now?: string;
};

export function canCreateExternalProjectDevelopmentRequestDraft(project: ProjectPortalProject | undefined) {
  return Boolean(
    project &&
    project.repositoryIdentity?.connectionState === "Configured" &&
    (project.repositoryIdentity.owner || project.repositoryIdentity.name || project.repositoryIdentity.localPath),
  );
}

export function createExternalProjectDevelopmentRequestDraft(
  input: CreateExternalProjectDevelopmentRequestDraftInput,
): ExternalProjectDevelopmentRequestDraft {
  const timestamp = input.now ?? new Date().toISOString();
  if (input.existingDraft) {
    return {
      ...input.existingDraft,
      updatedAt: timestamp,
    };
  }

  const identity = input.project.repositoryIdentity;
  return {
    id: `${input.project.id}:external-development-request-draft`,
    projectId: input.project.id,
    projectName: input.project.name,
    status: "Draft",
    title: `Development request for ${input.project.name}`,
    summary: "Draft request for future external project development work.",
    repositoryProvider: identity?.provider ?? "unknown",
    repositoryOwner: identity?.owner,
    repositoryName: identity?.name,
    branchName: input.project.localRepositoryBinding?.branchName ?? identity?.defaultBranch,
    specPath: input.project.localRepositoryBinding?.specPath,
    createdAt: timestamp,
    updatedAt: timestamp,
    sideEffectBoundary: EXTERNAL_PROJECT_DEVELOPMENT_REQUEST_BOUNDARY,
  };
}
