# Research: Execution Readiness Validation Foundation

## Decision: Readiness is separate from Execution Plan and runtime

**Rationale**: Spec 070 records what an agent would need; Spec 071 answers whether that captured plan still satisfies current product-side requirements. Keeping the models separate prevents a `Ready` result from implying human approval or runtime execution.

**Alternatives considered**:

- Add readiness fields to ExecutionPlan: rejected because plans are immutable and should not be rewritten.
- Start runtime after readiness: rejected as explicitly out of scope.

## Decision: Product-side evidence only

**Rationale**: The browser/product layer already has repository identity, sync snapshots, branch/path/spec signals, role labels, validation commands, and mutation scope in state. Spec 071 must validate those signals only and must not claim real OS verification.

**Alternatives considered**:

- Use `fs` or `git` checks in the service: rejected because it would cross into runtime adapter behavior and browser-incompatible Node APIs.
- Skip repository evidence checks entirely: rejected because readiness must catch stale or missing product-side repository state.

## Decision: Deterministic check records

**Rationale**: Human-readable dashboard rows and machine-readable tests need stable check categories, statuses, reasons, and messages. A fixed check list prevents hidden heuristic approval.

**Alternatives considered**:

- Store only a summary status: rejected because blocked/failure diagnostics would be ambiguous.
- Store full source objects inside checks: rejected because it duplicates large mutable domain objects and increases leakage risk.

## Decision: Latest collections with immutable snapshots

**Rationale**: Existing office services generally expose collections/results in controller state. Readiness can append or upsert immutable result snapshots while leaving source records unchanged.

**Alternatives considered**:

- Full event-sourcing framework: rejected as unnecessary.
- Single mutable result object: rejected because previous evaluations should not be silently rewritten.

## Decision: Mutation scope validation stays local and deterministic

**Rationale**: Readiness must confirm the plan's allowed mutation scope does not permit remote/GitHub/runtime actions and still matches the captured plan. It does not grant permission.

**Alternatives considered**:

- Reuse remote runner safety rules from agent workflow tooling: rejected because product code must stay independent from local CLI orchestration internals.
