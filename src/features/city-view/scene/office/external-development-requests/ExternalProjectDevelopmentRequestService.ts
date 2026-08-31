import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ActiveProjectCompanyContext } from "../project-company-binding/ProjectCompanyBindingTypes";
import type { ExternalProjectDevelopmentRequestDraft } from "./ExternalProjectDevelopmentRequestTypes";
import { createExternalProjectRequirementsArtifactPath } from "./ExternalProjectRequirementsArtifactStore";

export const EXTERNAL_PROJECT_DEVELOPMENT_REQUEST_BOUNDARY =
  "Local draft only; no runtime, repository, GitHub, validation, publish, merge, or deploy side effects.";

export type CreateExternalProjectDevelopmentRequestDraftInput = {
  project: ProjectPortalProject;
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  requestText?: string;
  sourceBacklogTaskId?: string;
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
  const requestText = input.requestText?.trim() || input.existingDraft?.requestText || `Create a development request for ${input.project.name}.`;
  if (input.existingDraft) {
    return {
      ...input.existingDraft,
      status: input.existingDraft.status === "Draft" ? "Draft" : input.existingDraft.status,
      requestText,
      sourceBacklogTaskId: input.sourceBacklogTaskId ?? input.existingDraft.sourceBacklogTaskId,
      requirementsArtifactContent: createRequirementsArtifactContent({
        project: input.project,
        activeProjectCompanyContext: input.activeProjectCompanyContext,
        requestText,
        sourceBacklogTaskId: input.sourceBacklogTaskId ?? input.existingDraft.sourceBacklogTaskId,
        timestamp: input.existingDraft.createdAt,
      }),
      branchName: undefined,
      specPath: undefined,
      updatedAt: timestamp,
    };
  }

  const identity = input.project.repositoryIdentity;
  const companyName = input.activeProjectCompanyContext?.companyName ?? input.project.ownerCompany;
  const localProjectPath = input.project.localRepositoryBinding?.worktreePath ?? identity?.localPath;
  const targetProjectIdentity = createTargetProjectIdentity(input.project);
  const requirementsArtifactPath = createExternalProjectRequirementsArtifactPath(input.project.id, timestamp);
  return {
    id: createExternalProjectDevelopmentRequestDraftId(input.project.id, input.sourceBacklogTaskId),
    projectId: input.project.id,
    projectName: input.project.name,
    companyName,
    status: "Draft",
    title: createRequestTitle(input.project.name, requestText),
    summary: requestText,
    requestText,
    sourceBacklogTaskId: input.sourceBacklogTaskId,
    targetProjectIdentity,
    localProjectPath,
    requirementsArtifactPath,
    requirementsArtifactContent: createRequirementsArtifactContent({
      project: input.project,
      activeProjectCompanyContext: input.activeProjectCompanyContext,
      requestText,
      sourceBacklogTaskId: input.sourceBacklogTaskId,
      timestamp,
    }),
    repositoryProvider: identity?.provider ?? "unknown",
    repositoryOwner: identity?.owner,
    repositoryName: identity?.name,
    createdAt: timestamp,
    updatedAt: timestamp,
    sideEffectBoundary: EXTERNAL_PROJECT_DEVELOPMENT_REQUEST_BOUNDARY,
  };
}

function createExternalProjectDevelopmentRequestDraftId(projectId: string, sourceBacklogTaskId: string | undefined) {
  return sourceBacklogTaskId
    ? `${projectId}:backlog-task:${sourceBacklogTaskId}:external-development-request-draft`
    : `${projectId}:external-development-request-draft`;
}

export function resolveDevelopmentRequestTargetProject(input: {
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  selectedProjectId?: string;
  projects: ReadonlyArray<ProjectPortalProject>;
}): ProjectPortalProject | undefined {
  const activeContext = input.activeProjectCompanyContext;
  if (activeContext) {
    if (activeContext.status !== "bound") return undefined;
    return input.projects.find((project) => project.id === activeContext.projectId);
  }
  const selectedId = input.selectedProjectId;
  return selectedId ? input.projects.find((project) => project.id === selectedId) : undefined;
}

function createTargetProjectIdentity(project: ProjectPortalProject) {
  const identity = project.repositoryIdentity;
  const repository = identity?.owner && identity.name
    ? `${identity.provider}:${identity.owner}/${identity.name}`
    : identity?.name
      ? `${identity.provider}:${identity.name}`
      : identity?.provider ?? "unknown";
  return `${project.id} (${project.name}; ${repository})`;
}

function createRequirementsArtifactContent(input: {
  project: ProjectPortalProject;
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  requestText: string;
  sourceBacklogTaskId?: string;
  timestamp: string;
}) {
  const companyName = input.activeProjectCompanyContext?.companyName ?? input.project.ownerCompany ?? input.project.name;
  return [
    `# Development Request - ${input.project.name}`,
    "",
    `Target project id: ${input.project.id}`,
    `Target project name: ${input.project.name}`,
    `Company context: ${companyName}`,
    `Created at: ${input.timestamp}`,
    ...(input.sourceBacklogTaskId ? [`Source backlog task id: ${input.sourceBacklogTaskId}`] : []),
    "",
    "## Authoritative Requirements",
    "",
    input.requestText,
  ].join("\n");
}

function createRequestTitle(projectName: string, requestText: string) {
  const firstLine = requestText.split(/\r?\n/).find((line) => line.trim())?.trim();
  if (!firstLine) return `Development request for ${projectName}`;
  return firstLine.length <= 64 ? firstLine : `${firstLine.slice(0, 61)}...`;
}
