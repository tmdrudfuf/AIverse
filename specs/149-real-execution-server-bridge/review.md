# Review: 149-real-execution-server-bridge

**Reviewed commit**: ba4a9dc753074016b0e0b3bc1dbd6e899a3c3a8f
**Decision**: Approved

## Blocking Findings

- None (as of round 6).

## Suggestions

- N-006: a request with a loopback `Host` and neither `Sec-Fetch-Site` nor `Origin` is trusted — any local process capable of reaching localhost can drive this endpoint once enabled. Documented in `RuntimeBridgeOrigin.ts` as consistent with the feature's single-operator, own-machine assumption.
- N-007: a reused client-supplied `runId` whose refusal was audited first could, under the exclusive (`wx`) audit write, block a later genuine run reusing the same id from recording its own audit record. Documented in `RuntimeBridgeTypes.ts`; not reachable via the browser's real usage path (both server-bridge providers always generate a fresh UUID).
- N-008 (round 5/6): on Windows, `claude`/`codex` installed as `.cmd` shims would fail to spawn under `shell: false`. Documented in `quickstart.md` with a `where claude`/`where codex` check; verified as real `.exe` files on this machine.

## Residual Risks

- T027 (the one manual, real-CLI quickstart walkthrough) is deliberately left for the operator — it genuinely spawns a real agent process and was never run by this implementation pass.
- T028/T029 (office UI label + Cancel control) are explicit, tracked, NOT-done follow-up tasks in `tasks.md` — the underlying mechanisms (enablement visibility, cancel) are complete and tested at the API/provider layer, but no UI control calls them yet. `spec.md`'s FR-003/FR-007 and the corresponding User Story 2/3 acceptance scenarios say so explicitly.
