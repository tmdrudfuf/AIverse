import { createDefaultProjectRegistryEntries } from "./ProjectRegistrySeedData";
import { applyLocalProjectRepositoryBindings, cloneLocalProjectRepositoryBinding } from "./LocalProjectRepositoryBinding";
import type { LocalProjectRepositoryBinding, ProjectRegistryEntry } from "./ProjectRegistryTypes";

export class ProjectRegistryService {
  private readonly entries: Map<string, ProjectRegistryEntry>;

  constructor(
    seedEntries: ReadonlyArray<ProjectRegistryEntry> = createDefaultProjectRegistryEntries(),
    localRepositoryBindings: ReadonlyArray<LocalProjectRepositoryBinding> = [],
  ) {
    const entries = localRepositoryBindings.length
      ? applyLocalProjectRepositoryBindings(seedEntries, localRepositoryBindings).entries
      : seedEntries;
    this.entries = new Map(entries.map((entry) => [entry.id, cloneEntry(entry)]));
  }

  getAllProjects(): ProjectRegistryEntry[] {
    return Array.from(this.entries.values()).map(cloneEntry);
  }

  getProject(id: string): ProjectRegistryEntry | undefined {
    const entry = this.entries.get(id);
    return entry ? cloneEntry(entry) : undefined;
  }

  registerProject(entry: ProjectRegistryEntry): void {
    if (this.entries.has(entry.id)) {
      throw new Error(`Project "${entry.id}" is already registered.`);
    }

    this.entries.set(entry.id, cloneEntry(entry));
  }
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
