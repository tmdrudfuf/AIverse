# Research: GitHub Read Integration Preflight

## Decision: Encode the first public-read boundary as summary fields, not API responses

**Rationale**: Company Dashboard and Project Dashboard already consume `GitHubRepositorySummary`, source status, check status, latest commit, and mapping metadata. Encoding the boundary at this level keeps future real providers interchangeable with the fixture provider and avoids coupling views to raw GitHub API responses.

**Alternatives considered**:

- **Document only, no tests**: Rejected because the next real integration needs a small automated guardrail against scope creep.
- **Model raw GitHub API responses now**: Rejected because no real network provider exists yet and raw responses would leak implementation details into dashboards too early.

## Decision: Add contract/type tests but no real provider implementation

**Rationale**: The feature is explicitly a preflight/readiness slice. Tests can prove field boundaries, status mapping, no-network behavior, and existing provider interchangeability without creating real API code.

**Alternatives considered**:

- **Add a real public provider behind a disabled flag**: Rejected because it would still introduce network/API behavior.
- **Add a repository URL entry UI**: Rejected because mapping creation and user input are separate product decisions.

## Decision: Preserve summary-level issue and pull request mapping

**Rationale**: Existing dashboards show issue and pull request counts. Detailed issue/PR lists, labels, review threads, and PR authors should wait until the UI has an explicit place to use them.

**Alternatives considered**:

- **Add detailed issue/PR entities now**: Rejected as premature expansion.
- **Drop issue/PR from the first real read boundary**: Rejected because counts are already part of the dashboard source summaries.

## Decision: Treat provider errors as display-safe source states

**Rationale**: A future provider may encounter rate limits, offline mode, malformed responses, private repositories, or generic network errors. These must map to existing source status labels and safe reasons without credentials, retry loops, sync controls, or hidden mutation.

**Alternatives considered**:

- **Expose raw provider error text**: Rejected because it risks leaking implementation details or credentials.
- **Hide source rows on error**: Rejected because players still need to understand source availability.
