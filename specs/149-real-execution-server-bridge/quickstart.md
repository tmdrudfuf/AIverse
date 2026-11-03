# Quickstart: Real Execution Server Bridge

## Prerequisites

- This repository's existing local setup (`npm install` already run).
- Claude CLI and/or Codex CLI installed and authenticated on this machine (whichever role you intend to exercise), the same tools already required by `AGENTS.md`'s multi-agent workflow.
- A project already registered in the app via the existing project registration/binding flow (Spec 123/137) — a real local directory that is safe to run an Implementer/Reviewer command against (use a disposable scratch repository for first verification, not a repository you care about).
- **Windows only**: confirm `claude`/`codex` resolve to a real `.exe` on PATH (`where claude`, `where codex`), not a `.cmd`/`.ps1` shim — this bridge spawns with `shell: false` (consistent with this codebase's other process-spawning code), which cannot execute a `.cmd`/`.ps1` wrapper directly and would report every real run as `failed` with an `ENOENT`-style error if the resolved command is one (round-5 independent review finding N-002, non-blocking). A global npm install of either CLI commonly installs as exactly this kind of shim; a native installer or `.exe` release typically does not.

## Enable real execution on this machine

1. In the project root, set in `.env.local` (not committed) whichever role(s) you intend to exercise — the two gates are independent:
   ```text
   AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN=1
   AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN=1
   ```
2. Start (or restart) the app: `npm run dev`.
3. Confirm the server sees it enabled without exposing it to the browser:
   ```bash
   curl -s http://localhost:3000/api/runtime/status
   ```
   Expected: `{"implementerEnabled":true,"reviewerEnabled":true}`.

## Verify the "not enabled" path first

1. Comment out / remove both env vars and restart `npm run dev`.
2. Repeat the `curl` above — expected `{"implementerEnabled":false,"reviewerEnabled":false}`.
3. In the app, open a registered project's office and approve a queued run — expected: a `refused` status with reason `not_enabled`, never a hang and never a false success.
4. Re-enable the env var and restart before continuing.

## Verify a real run end to end

1. In the app, open a registered real (scratch) project's office.
2. Approve a queued Implementer run.
3. Confirm the office UI moves out of `Blocked` and shows a genuine terminal status once the underlying CLI process finishes — correlate the command it ran with what actually happened in the scratch project's own history/output.
4. Inspect the durable record written for that run:
   ```bash
   cat .agent-workflow/real-runs/<runId>.json
   ```
   Expected: the recorded `command`, `workingDirectory`, and terminal `status`/`evidence` match what was observed in the UI.

## Verify timeout and cancel

1. Approve a run whose underlying command is expected to run long (or temporarily lower the configured timeout for a manual test), and confirm it is reported `timed_out`, not stuck `running` forever, and that the underlying process is no longer present (e.g. `ps` / Task Manager shows it gone) after the grace period.
2. Approve another run and, while it is `running`, call:
   ```bash
   curl -s -X DELETE http://localhost:3000/api/runtime/execute/<runId>
   ```
   Expected: `{"runId":"...","accepted":true}`, and the original run resolves as `cancelled`, not `completed`.

## Verify the concurrency guard

1. Approve a run for Project A, and while it is still `running`, approve a second run for Project A.
2. Expected: the second request is `refused` with reason `already_running`; it never starts a second process against the same project.

## Verify the human-only boundary is untouched

1. Run a scenario end to end (Implementer run → Reviewer run) and confirm neither ever runs `git push`, opens/updates a PR, or deletes a branch — those remain actions the operator takes themselves, exactly as before this feature.
