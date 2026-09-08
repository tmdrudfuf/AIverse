# Data Model: Autonomous Company Operations End-to-End Verification

Spec 148 introduces no new production entities. It observes existing ones and
records one derived evidence document.

## Reused existing entities (authoritative, unchanged)

| Entity | Owner spec | Role in the cycle |
| --- | --- | --- |
| `ProjectPortalProject` / project registry entry | registry | Canonical project identity for A and B |
| `ProjectAutonomousSuggestionPolicy` | 147 | Auto Suggestions consent + cooldown + bounded count |
| `ProjectBacklogSuggestionCollections` candidate | 143 | Proposed suggestion produced via Spec 143 abstraction |
| `ProjectBacklogSuggestionAcceptancePolicy` | 145 | Auto Accept consent + priority filter |
| `ProjectBacklogTask` | 141 | Authoritative task record and transition target |
| `ProjectBacklogReadinessPromotionPolicy` | 146 | Auto Ready consent + deterministic promotion |
| `ProjectAutonomyPolicy` | 144 | Auto Execute consent + concurrency safety |
| `ExternalProjectDevelopmentRequestDraft` | 138 | In-office development request |
| `ExternalProjectAdosRunPreparation` | 142 | Bridge output binding project + worktree + requirements |
| `ExternalProjectAdosExecution` / `ExternalProjectAdosRunStatus` | ADOS | Durable run identity and stage observable by office |
| ADOS `agentAssignment` in `ados-run.json` | ADOS | Durable implementer/reviewer/mode/reason/candidate owner |
| `ados-run.sanitized.json` | this feature | Tracked, path-stripped mirror of `ados-run.json`; test cross-checks it against the durable file when present |
| `.agent-workflow/runs/148-.../{candidate,validation-runtime,review-runtime}.json` | ADOS | Durable candidate / validated / reviewed SHA + validation exit codes + review decision, resolved at test time |

## Derived evidence document

`specs/148-autonomous-company-operations-end-to-end/runtime-evidence.json`

| Field | Source | Notes |
| --- | --- | --- |
| `feature`, `evidenceVersion`, `evidencePathsAreRepositoryRelative`, `runtimeEvidencePath` | this feature | Repository-relative only |
| `projectA.projectId` / `projectB.projectId` | canonical registry seed | `daily-proof` (Active company) + `ai-lab` (isolation), registered via `ProjectRegistryService` |
| `automationControls` | harness | Four independent policy states for Project A |
| `suggestionId` | Spec 147 -> 143 output | Proposed, project-scoped |
| `acceptedTaskId`, `backlogState` | Spec 145 -> 141 output | `backlog`, never `ready` from 145 |
| `readyTransition` | Spec 146 output | `promotedCount: 1`, exactly once |
| `developmentRequestId`, `executionPreparationId`, `executionRunId` | Spec 144 -> 142/138 output | Exact project/task binding |
| `adosRun` | `ados-run.sanitized.json` (mirrors `ados-run.json`) | `runId`, `agentAssignment.*`, `authoritativeBaseSha`, `featureBranch`, `specNumber`; absolute path fields deliberately dropped |
| `candidateOwner`, `reviewer` | `agentAssignment` | `claude` / `codex` |
| `shaAlignment.candidateBaseSha` | `authoritativeBaseSha` | Stable base for this run |
| `shaAlignment.durableSources` / `exactHeadInvariant` | ADOS-owned | candidate/validated/reviewed SHA available in the named durable files; `validated == reviewed == exact HEAD` enforced by `reviewConvergence.js`; proven by tests U/T and the durable-source cross-check |
| `dailyProofCycleCompletion` | harness + production `deriveExternalProjectAdosRunStatus` | Daily-proof cycle's terminal `completed` state: `evidence.completed` drives derived run stage `Completed`, active-execution count 0, task `completed` via existing operator transition; full validation PASS at exact HEAD (derived, not transcribed) |
| `spec148CandidatePublicationGate` | ADOS-owned / execution policy | This candidate's own review/validation/publication; `published`/`merged`/`deployed`/`primaryRepositoryMutated`/`githubMutated` all `false`; criterion 20 review pending post-handoff, never fabricated |
| `publicationResult` | ADOS-owned | Standing gate ("blocked until Approved review with validated == reviewed == exact HEAD"); human-only boundary preserved |
| `idempotency` | harness replay | Duplicate-event counts all remain 1 |
| `activeRunGating` | harness | Prohibited extra work count 0 with active execution |
| `reloadPersistence` | harness | Policy + lifecycle state preserved, no re-execution |
| `manualWorkflows` | harness | Manual generate/review/Ready/Start still valid |
| `fabricatedPercentageProgressIntroduced` | harness | `false` |

## State transitions exercised (once, in order)

```text
Planning:    Spec 147 event -> Spec 143 provider -> 1 proposed suggestion (project A)
Backlog:     Spec 145 accept -> Spec 143->141 conversion -> task.status = "backlog"
Ready:       Spec 146 evaluate -> ProjectBacklogService.updateTask(status:"ready") x1
Engineering: Spec 144 evaluate -> Spec 142/138 bridge -> ExternalProjectAdosExecutionService.start -> task.status = "in_progress", executionRunId set
Review:      ADOS -> Codex independent review (durable role assignment)
Validation:  ADOS -> configured validation pipeline
Complete:    merged/completed reflects actual ADOS completion (X)
```

Second project B: no suggestion, no task, no Ready, no execution, no ADOS
status, no candidate/reviewer state.
