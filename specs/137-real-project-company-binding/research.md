# Research: Real Project Company Binding

## Decision: Use the existing project registry as the authoritative project source

**Rationale**: The repository already has `ProjectRegistryService`, seed entries, local repository bindings, adapters, and browser-session restore/save support. Reusing it prevents a second registry and keeps external registration compatible.

**Alternatives considered**: A new company registry was rejected because it would duplicate project identity and violate the requirement to use existing registration infrastructure.

## Decision: Pass bound project identity from city building entry into office spawn context

**Rationale**: The clicked/entered company is the source of context. The city transition payload is already the boundary between city selection and office entry, so carrying project id and company title there keeps the flow explicit.

**Alternatives considered**: Reading the newest ADOS run globally or relying on portal selected index was rejected because it allows Project A state to appear in Project B.

## Decision: Reuse the Spec 135 office layout for multiple bound projects

**Rationale**: The requirement preserves the existing rendered office and allows shared furniture layout. Only identity/context changes per project.

**Alternatives considered**: Per-project office scenes or artwork were rejected as out of scope.

## Decision: Treat missing project/path as unavailable context

**Rationale**: A stale persisted binding must not crash or silently substitute another project. Downstream consumers should receive the requested project id and unavailable metadata.

**Alternatives considered**: Falling back to Daily Proof was rejected because it creates demo-state leakage.
