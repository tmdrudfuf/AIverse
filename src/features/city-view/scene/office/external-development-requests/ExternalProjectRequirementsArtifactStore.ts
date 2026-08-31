export const EXTERNAL_PROJECT_REQUIREMENTS_ARTIFACT_ROOT = ".aiverse/external-requests";

export function createExternalProjectRequirementsArtifactPath(projectId: string, timestamp: string) {
  const safeProjectId = sanitizePathSegment(projectId) || "project";
  const safeTimestamp = timestamp.replace(/[^0-9a-zA-Z]/g, "").slice(0, 17);
  return `${EXTERNAL_PROJECT_REQUIREMENTS_ARTIFACT_ROOT}/${safeProjectId}/${safeTimestamp || "request"}-requirements.md`;
}

export function isExternalProjectRequirementsArtifactPath(value: string) {
  const normalized = normalizeSlashes(value.trim());
  return normalized === EXTERNAL_PROJECT_REQUIREMENTS_ARTIFACT_ROOT ||
    normalized.startsWith(`${EXTERNAL_PROJECT_REQUIREMENTS_ARTIFACT_ROOT}/`);
}

export function resolveExternalProjectRequirementsArtifactPath(value: string, applicationRoot = getApplicationRoot()) {
  const normalized = normalizeSlashes(value.trim());
  if (!applicationRoot || isAbsolutePath(normalized)) return normalized;
  const separator = applicationRoot.includes("\\") ? "\\" : "/";
  return `${applicationRoot.replace(/[\\/]+$/, "")}${separator}${normalized.replace(/\//g, separator)}`;
}

function getApplicationRoot() {
  const maybeProcess = globalThis as { process?: { cwd?: () => string } };
  return maybeProcess.process?.cwd?.();
}

function isAbsolutePath(value: string) {
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith("/") || value.startsWith("\\");
}

function normalizeSlashes(value: string) {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/");
}

function sanitizePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}
