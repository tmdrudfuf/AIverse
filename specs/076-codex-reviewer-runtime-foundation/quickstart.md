# Quickstart: Codex Reviewer Runtime Foundation

## Focused Tests

Run Reviewer Runtime focused coverage:

```powershell
npx vitest run src/features/city-view/scene/office/reviewer-runtime src/features/city-view/scene/office/OfficeProjectPortalController.reviewer-runtime.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.implementer-runtime.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Flow

1. Open the Project Dashboard for a project whose Implementer Runtime has reached a `Completed` result (advance the existing chain one explicit input at a time, ending with a successful `startImplementerPressed` action).
2. Confirm the dashboard shows `[REVIEWER RUNTIME] Codex ready; explicit start required; not started` — and that this row never appeared automatically merely because the Implementer Runtime completed.
3. Press the distinct Start-Reviewer input (`KeyR`, not Enter/Action/Start-Implementer — see `contracts/provider-contract.md`).
4. **In this repository today, expect a `Blocked` result with reason code `REVIEWER_RUNTIME_TARGET_UNCOMMITTED`.** `ReviewTarget.ts`'s deterministic resolver always reports `workingTreeState: "Uncommitted"` (no real git-backed commit stage exists yet) — see `plan.md`, Architecture Decision 1, and `contracts/output-decision-contract.md`'s "Exact-HEAD Gate". This is the correct, by-design outcome for every controller-driven attempt, not a bug.
5. Verify a second Start-Reviewer press against the same still-active or already-terminal attempt does not spawn a second process.
6. Verify staling any upstream record (plan, approval, preflight, Runtime Start, or the Implementer Runtime itself) after the fact blocks the next Start-Reviewer attempt.
7. Verify swapping the approved role binding (in a test fixture, not in the live dashboard, since the live dashboard always uses the approved Claude=Implementer/Codex=Reviewer constants) blocks with a role-mismatch reason.
8. Verify no Claude process starts, no dedicated Validation stage runs, no files are staged/committed, no Git mutation occurs, no GitHub mutation occurs, no push occurs, and no PR is created — regardless of the result status.

## Exercising the Codex Command-Safety and Spawn-Allow Gates (test-level only)

Because step 4 above always blocks at the Exact-HEAD Gate through the controller/UI, the command-safety check and the spawn-allow env-var gate can only be exercised today by constructing a `ReviewTarget` fixture directly with `workingTreeState: "Clean"` and calling `ReviewerRuntimeService.startReviewer` directly, bypassing the controller — exactly as `ReviewTarget.ts`'s own doc comment prescribes. See `OfficeProjectPortalController.reviewer-runtime.test.ts`'s `"ReviewerRuntimeService direct validation beyond the review-target gate"` describe block for the reference implementation of this pattern.

## Safe Manual Smoke Test (opt-in, human-triggered)

This procedure genuinely spawns a real `codex` CLI process. It is not run automatically by any test or by this feature's own implementation; a human must explicitly trigger it.

**Required opt-in**: `CodexReviewerRuntimeProvider` will not resolve a real `node:child_process` import unless the environment variable `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN` is set to exactly `"1"` in the process running the smoke test — this is in addition to the `typeof window !== "undefined"` browser guard, and is deliberately a **different** variable from Spec 075's `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` (see `plan.md`, Architecture Decision 4). Set this variable only in the shell running the smoke script; never set it for `npm test`/CI.

**Scope decision**: the smoke test's one approved, explicitly-scoped edit target is `specs/076-codex-reviewer-runtime-foundation/smoke-test-note.md`, a dedicated scratch file created specifically for this purpose and included in this feature's approved mutation scope. This is a documentation-only file inside the approved feature worktree; no other file may be touched by the smoke-test task. If a human runs this procedure and it produces a real edit to that file, the edit is intentionally in scope and may be committed as part of this feature; it does not need to be restored.

Steps:

1. In the dedicated Spec 076 feature worktree (`C:\Users\tmdru\Desktop\Ky-Project\AIverse-spec-076`, branch `codex/076-codex-reviewer-runtime-foundation`), set `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN=1` in the shell, then construct a real `CodexReviewerRuntimeProvider` and a matching `ReviewerRuntimeInput` whose `reviewTarget` is a directly constructed `Clean` fixture (per the note above) pointing at this worktree, and whose task is exactly: *"Inspect this worktree. Append a single line to `specs/076-codex-reviewer-runtime-foundation/smoke-test-note.md` recording the current UTC timestamp. Do not edit any other file. Reply with `Decision: Approved` or `Decision: Changes Requested`."*
2. Confirm Claude is represented as the approved Implementer in the constructed request but is not started.
3. Use a bounded timeout (for example 60000ms).
4. Run the invocation and record: the exact `command`/`arguments` spawned, whether the process started, the exit status, the parsed decision/findings, and the bounded/truncated output.
5. Verify `specs/076-codex-reviewer-runtime-foundation/smoke-test-note.md` contains exactly one new line and no other file changed (`git status --short`) — note this smoke test asks Codex itself to make that one edit as part of demonstrating a real, working directory-scoped invocation; a genuine review of an unrelated already-committed change would ask Codex to make no edits at all.
6. Verify Claude did not start (no `claude` process was spawned).
7. Verify the dedicated product Validation stage did not run (it does not exist yet; this is a structural check that no such stage was invoked).
8. Verify no remote mutation occurred (`git status --short` shows no staged/pushed state; no branch was pushed; no PR exists).

This procedure was not run as part of implementing Spec 076 itself (no human explicitly triggered it); it is documented here for a human to run later, opt-in.
