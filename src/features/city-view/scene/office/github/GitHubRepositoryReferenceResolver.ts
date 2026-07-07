import type { GitHubRepositoryReferenceResolver } from "./GitHubPublicRepositoryProvider";
import type { AIverseProjectRepositoryMapping } from "./GitHubRepositoryTypes";
import { validateAIverseProjectRepositoryMapping } from "./GitHubRepositoryTypes";

/**
 * Builds a resolver that maps a projectId to a { owner, name } reference using only the
 * existing AIverseProjectRepositoryMapping data already validated elsewhere in the dashboard
 * flow (spec 031/033-034). It never derives owner/name from a project's display name/title,
 * and it re-reads getMappings() on every call so it always reflects current state rather than
 * a stale snapshot captured at construction time.
 */
export function createRepositoryReferenceResolver(
  getMappings: () => ReadonlyArray<AIverseProjectRepositoryMapping>,
): GitHubRepositoryReferenceResolver {
  return (projectId: string) => {
    const mapping = getMappings().find((item) => item.projectId === projectId);
    if (!mapping) return undefined;

    const validation = validateAIverseProjectRepositoryMapping(mapping);
    if (!validation.isValid) return undefined;

    return {
      owner: mapping.repository.owner,
      name: mapping.repository.name,
    };
  };
}
