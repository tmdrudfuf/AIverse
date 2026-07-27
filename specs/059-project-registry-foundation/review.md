# Review: 059-project-registry-foundation

## Round 1

**Reviewed commit**: 88accbee55ef19e4e0d6c25730fc8f7bc8bcb5f6
**Decision**: Changes Requested

### Blocking Findings

- P2-001 — `src/features/city-view/scene/office/OfficeProjectPortalView.ts:270-272,486-492` — Repository and Company metadata were rendered as one combined row (`Repository: X  |  Company: Y`) instead of the two separate lines the spec requires. Fixed in commit `4f8fc65` by splitting into two independent `addText` calls and updating the corresponding view tests.
- P2-002 — `specs/059-project-registry-foundation/tasks.md:17-65` — Completed implementation tasks were left unchecked. Fixed in commit `4f8fc65` by marking T001–T013 as `[X]` and splitting T014 into T014a (focused validation, done) and T014b (final validation gate, pending Approved review).

### Suggestions

(none recorded this round)

### Residual Risks

(superseded by Round 2 — see below)

---

## Round 2 (re-review after fix cycle)

**Reviewed commit**: 4f8fc658623d133ac05329c73639c819f8ceaf2b
**Decision**: Approved

### Blocking Findings

- None. 0 open blocking findings.

### Suggestions

- P3-001 (non-blocking) — `src/features/city-view/scene/office/OfficeProjectPortalView.ts:267-280` — The new Repository/Company detail rows aren't covered by a test where `lastPlaceholderAction` is also present (which shifts their vertical position lower, closer to the bottom instruction row). Recommendation: add a view test covering that combined state. Not addressed in this Spec — noted as follow-up since it is non-blocking and the current layout was already verified not to overlap the instruction row at the panel heights used by existing tests.

### Residual Risks

- The `lastPlaceholderAction` + registry-detail-row combined layout (per P3-001) has no explicit overlap-regression test, though the fixed pixel offsets (406/424 vs. instruction row at `panelHeight - 34`) were checked by hand not to collide at the panel dimensions this codebase's tests use.
- `ProjectRegistryService.registerProject` has no wired-up runtime UI control in this Spec (out of scope per spec.md) — a future Spec adding "register project" as a player action should re-verify duplicate-id handling under concurrent/repeated invocation if that ever becomes reachable from the UI.
