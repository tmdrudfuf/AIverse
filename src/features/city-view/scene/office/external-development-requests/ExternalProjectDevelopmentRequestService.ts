import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ActiveProjectCompanyContext } from "../project-company-binding/ProjectCompanyBindingTypes";
import type { ExternalProjectDevelopmentRequestDraft } from "./ExternalProjectDevelopmentRequestTypes";

export const EXTERNAL_PROJECT_DEVELOPMENT_REQUEST_BOUNDARY =
  "Local draft only; no runtime, repository, GitHub, validation, publish, merge, or deploy side effects.";

export type CreateExternalProjectDevelopmentRequestDraftInput = {
  project: ProjectPortalProject;
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  requestText?: string;
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
      requirementsArtifactContent: createRequirementsArtifactContent({
        project: input.project,
        activeProjectCompanyContext: input.activeProjectCompanyContext,
        requestText,
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
  const requirementsArtifactPath = createRequirementsArtifactPath(input.project.id, timestamp);
  return {
    id: `${input.project.id}:external-development-request-draft`,
    projectId: input.project.id,
    projectName: input.project.name,
    companyName,
    status: "Draft",
    title: createRequestTitle(input.project.name, requestText),
    summary: requestText,
    requestText,
    targetProjectIdentity,
    localProjectPath,
    requirementsArtifactPath,
    requirementsArtifactContent: createRequirementsArtifactContent({
      project: input.project,
      activeProjectCompanyContext: input.activeProjectCompanyContext,
      requestText,
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

function createRequirementsArtifactPath(projectId: string, timestamp: string) {
  const safeProjectId = sanitizePathSegment(projectId) || "project";
  const safeTimestamp = timestamp.replace(/[^0-9a-zA-Z]/g, "").slice(0, 17);
  return `.agent-workflow/external-requests/${safeProjectId}/${safeTimestamp || "request"}-requirements.md`;
}

function createRequirementsArtifactContent(input: {
  project: ProjectPortalProject;
  activeProjectCompanyContext?: ActiveProjectCompanyContext;
  requestText: string;
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

function sanitizePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}
