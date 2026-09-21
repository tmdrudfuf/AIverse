import type {
  LocalProjectRepositoryBinding,
  LocalProjectRepositoryBindingApplication,
  LocalProjectRepositoryBindingResult,
  NormalizedLocalProjectRepositoryBinding,
  ProjectRegistryEntry,
} from "./ProjectRegistryTypes";

const LOCAL_BINDING_LABEL = "Bound (local)";

export function applyLocalProjectRepositoryBindings(
  entries: ReadonlyArray<ProjectRegistryEntry>,
  bindings: ReadonlyArray<LocalProjectRepositoryBinding>,
): LocalProjectRepositoryBindingApplication {
  const copiedEntries = entries.map(cloneEntry);
  const results: LocalProjectRepositoryBindingResult[] = [];

  for (const binding of bindings) {
    const projectId = binding.projectId.trim();
    const targetIndex = copiedEntries.findIndex((entry) => entry.id === projectId);
    if (targetIndex < 0) {
      results.push({ projectId, status: "Rejected", reason: "UnknownProject" });
      continue;
    }

    const normalized = normalizeBinding({ ...binding, projectId });
    if (!normalized) {
      results.push({ projectId, status: "Rejected", reason: "MissingLocalPath" });
      continue;
    }

    copiedEntries[targetIndex] = bindEntry(copiedEntries[targetIndex], normalized);
    results.push({ projectId, status: "Bound", binding: { ...normalized } });
  }

  return { entries: copiedEntries, results };
}

export function cloneLocalProjectRepositoryBinding(
  binding: NormalizedLocalProjectRepositoryBinding,
): NormalizedLocalProjectRepositoryBinding {
  return { ...binding };
}

function normalizeBinding(
  binding: LocalProjectRepositoryBinding,
): NormalizedLocalProjectRepositoryBinding | undefined {
  const repositoryPath = binding.repositoryPath?.trim();
  const worktreePath = binding.worktreePath?.trim();
  const normalizedPath = worktreePath || repositoryPath;
  if (!normalizedPath) return undefined;

  const normalized: NormalizedLocalProjectRepositoryBinding = {
    projectId: binding.projectId,
    repositoryPath: repositoryPath || normalizedPath,
    worktreePath: worktreePath || normalizedPath,
  };
  const branchName = trimOptional(binding.branchName);
  const specPath = trimOptional(binding.specPath);
  const source = trimOptional(binding.source);
  const boundAt = trimOptional(binding.boundAt);
  if (branchName) normalized.branchName = branchName;
  if (specPath) normalized.specPath = specPath;
  if (source) normalized.source = source;
  if (boundAt) normalized.boundAt = boundAt;
  return normalized;
}

function bindEntry(
  entry: ProjectRegistryEntry,
  binding: NormalizedLocalProjectRepositoryBinding,
): ProjectRegistryEntry {
  return {
    ...entry,
    localRepository: {
      connected: true,
      label: LOCAL_BINDING_LABEL,
    },
    localRepositoryBinding: cloneLocalProjectRepositoryBinding(binding),
    repositoryIdentity: {
      ...entry.repositoryIdentity,
      localPath: binding.worktreePath,
      connectionState: entry.repositoryIdentity.connectionState === "Available" ? "Available" : "Configured",
    },
  };
}

function cloneEntry(entry: ProjectRegistryEntry): ProjectRegistryEntry {
  return {
    ...entry,
    localRepository: { ...entry.localRepository },
    ...(entry.localRepositoryBinding ? { localRepositoryBinding: cloneLocalProjectRepositoryBinding(entry.localRepositoryBinding) } : {}),
    ...(entry.remoteRepository ? { remoteRepository: { ...entry.remoteRepository } } : {}),
    repositoryIdentity: { ...entry.repositoryIdentity },
    owner: { ...entry.owner },
  };
}

function trimOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
