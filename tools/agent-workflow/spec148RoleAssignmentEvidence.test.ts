import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveEffectiveRoles } from "./roleResolver.js";
import { CONVERGENCE_STATUSES, computeConvergenceStatus } from "./reviewConvergence.js";
import { targetsMatch } from "./validationPolicy.js";

// Adapt a bare durable SHA string into the { commit, dirty, dirtyHash } target
// shape the production comparator (validationPolicy.js `targetsMatch`, reached
// in production via validationPlan.js `isFinalValidationSatisfied`) expects.
// The durable validation record separately proves the worktree was unmutated
// across the run (head_before === head_after), i.e. `dirty: false`.
function shaTarget(sha: string | undefined): { commit: string; dirty: false; dirtyHash: null } | null {
  return sha ? { commit: sha, dirty: false, dirtyHash: null } : null;
}

// Spec 148 - Adaptive agent role and exact-candidate-ownership evidence
// (authoritative requirements 10, 11; Required Tests P-W, and part of X/U).
//
// The durable ADOS role assignment lives in
// `.agent-workflow/runs/<feature>/ados-run.json` (gitignored, worktree-absolute
// paths). Its non-path fields are mirrored into the tracked, sanitized
// `specs/148-.../ados-run.sanitized.json`. These tests assert:
//   - the sanitized artifact carries the durable role/candidate assignment
//     (and, when the durable file is present, that the sanitized copy still
//     matches it) - so the evidence is verified against ADOS state, not a
//     free-standing label;
//   - `runtime-evidence.json` transcribes the sanitized values unchanged;
//   - candidate/validated/reviewed SHA alignment is resolved from durable ADOS
//     sources when present, and the exact-HEAD + no-stale-approval gate holds
//     regardless via the real agent-workflow enforcement modules.

const specDir = new URL("../../specs/148-autonomous-company-operations-end-to-end/", import.meta.url);
const runDir = new URL("../../.agent-workflow/runs/148-autonomous-company-operations-end-to-end/", import.meta.url);

function readJson(url: URL): unknown {
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

function readJsonIfPresent(url: URL): unknown | undefined {
  const path = fileURLToPath(url);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

const evidence = readJson(new URL("runtime-evidence.json", specDir)) as {
  adosRun: { runId: string; agentAssignment: Record<string, unknown> };
  candidateOwner: string;
  reviewer: string;
  publicationResult: string;
  shaAlignment: { staleApprovalReuseAllowed: boolean; candidateOwner: string };
};

const sanitized = readJson(new URL("ados-run.sanitized.json", specDir)) as {
  _durableSource: string;
  _derivedFields: string[];
  runId: string;
  specNumber: string;
  featureBranch: string;
  authoritativeBaseSha: string;
  executionPolicyVersion: string;
  agentAssignment: {
    mode: string;
    implementerId: string;
    reviewerId: string;
    candidateOwnerId: string;
    reason: string;
    [key: string]: unknown;
  };
};

const durableRun = readJsonIfPresent(new URL("ados-run.json", runDir)) as
  | { runId: string; featureBranch: string; authoritativeBaseSha: string; executionPolicyVersion: string; status: string; agentAssignment: Record<string, unknown> }
  | undefined;
// A clean checkout has no `.agent-workflow` run dir at all (gitignored), so the
// durable cross-check below simply does not apply. But if any *other* durable
// run artifact is present, the run dir is live and `ados-run.json` - the role
// assignment source of truth - must be present too; it may not be selectively
// deleted while its siblings remain. Under authoritative ADOS validation the run
// dir is fully populated (this branch's dir currently holds ados-run.json,
// candidate.json, implementer-runtime.json, validation-runtime.json,
// review-runtime.json), so the field-for-field check does execute there.
const RUN_DIR_SIBLING_ARTIFACTS = [
  "candidate.json",
  "implementer-runtime.json",
  "validation-runtime.json",
  "review-runtime.json",
  "bootstrap-runtime.json",
];
const runDirIsPopulated = RUN_DIR_SIBLING_ARTIFACTS.some((name) =>
  existsSync(fileURLToPath(new URL(name, runDir))),
);
const VOLATILE_DURABLE_FIELDS = [
  "status",
  "nextStage",
  "implementationFailure",
  "implementationRecoveryAttempts",
  "implementationRecoveryBlock",
];
const durableCandidate = readJsonIfPresent(new URL("candidate.json", runDir)) as
  | { candidate_sha: string; status: string }
  | undefined;
const durableValidation = readJsonIfPresent(new URL("validation-runtime.json", runDir)) as
  | {
      head_before: string;
      head_after: string;
      status?: string;
      commands: Array<{ command: string; exit_code: number; timed_out?: boolean }>;
    }
  | undefined;
const durableReview = readJsonIfPresent(new URL("review-runtime.json", runDir)) as
  | { reviewed_sha: string; status: string; decision: string }
  | undefined;

describe("Spec 148 durable ADOS role assignment", () => {
  const assignment = sanitized.agentAssignment;

  it("carries the durable role/candidate assignment in the sanitized ADOS artifact (Tests P, S)", () => {
    expect(assignment.implementerId).toBe("claude");
    expect(assignment.reviewerId).toBe("codex");
    expect(assignment.candidateOwnerId).toBe("claude");
    expect(assignment.mode).toBe("adaptive");
    expect(assignment.reason.toLowerCase()).toContain("claude");
    expect(sanitized.runId).toMatch(/^[a-z0-9]+$/);
    expect(sanitized.featureBranch).toBe("codex/148-autonomous-company-operations-end-to-end");
    expect(sanitized.authoritativeBaseSha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("declares provenance from the durable ADOS run record, not a free-standing label (Tests P, Q, S)", () => {
    expect(sanitized._durableSource).toBe(
      ".agent-workflow/runs/148-autonomous-company-operations-end-to-end/ados-run.json",
    );
    // The sanitized artifact is an allowlisted copy of stable identity fields.
    // It must not freeze any volatile per-cycle lifecycle field: those go stale
    // the moment this commit advances HEAD (authoritative requirement 21).
    const sanitizedKeys = new Set(Object.keys(sanitized));
    for (const volatileField of VOLATILE_DURABLE_FIELDS) {
      expect(sanitizedKeys.has(volatileField), `${volatileField} must not be frozen into tracked evidence`).toBe(false);
    }
    expect(sanitized._derivedFields).toEqual([
      "runId",
      "specNumber",
      "featureBranch",
      "authoritativeBaseSha",
      "executionPolicyVersion",
      "agentAssignment",
    ]);
  });

  it("carries no absolute machine path and no unexpected field, in any checkout (Tests P, Q, S)", () => {
    // This must hold for the tracked artifact itself, independent of whether a
    // live ADOS run dir exists in this worktree.
    const allowed = new Set([...sanitized._derivedFields, "_note", "_durableSource", "_derivedFields"]);
    for (const key of Object.keys(sanitized)) {
      expect(allowed.has(key), `sanitized artifact must not carry unexpected field ${key}`).toBe(true);
    }
    expect(JSON.stringify(sanitized)).not.toMatch(/[A-Za-z]:[\\/]/);
  });

  it("requires the durable ADOS run record whenever the run dir is populated (Tests P, Q, S)", () => {
    // Not dodgeable by deleting ados-run.json alone inside a live run dir: if any
    // sibling run artifact exists, the durable role-assignment record must too.
    if (!runDirIsPopulated) return;
    expect(
      durableRun,
      "ados-run.json must exist when the .agent-workflow run dir is populated",
    ).toBeDefined();
  });

  it.skipIf(!durableRun)(
    "matches the durable ADOS run record field-for-field when it is present in the worktree (Tests P, Q, S)",
    () => {
      // Every allowlisted field is transcribed unchanged from durable ADOS state.
      // Reported as skipped (not passed) in a clean checkout with no run dir, so
      // it can never be a silent green that never proved provenance.
      for (const field of sanitized._derivedFields) {
        expect(
          (sanitized as Record<string, unknown>)[field],
          `sanitized.${field} must equal durable ados-run.json`,
        ).toEqual((durableRun as Record<string, unknown>)[field]);
      }
    },
  );

  it("has runtime-evidence.json transcribe the sanitized assignment unchanged (Tests P, Q, R, S)", () => {
    const transcribed = evidence.adosRun.agentAssignment;
    for (const [key, value] of Object.entries(sanitized.agentAssignment)) {
      expect(transcribed[key]).toEqual(value);
    }
    expect(evidence.adosRun.runId).toBe(sanitized.runId);
    expect(evidence.candidateOwner).toBe(sanitized.agentAssignment.candidateOwnerId);
    expect(evidence.reviewer).toBe(sanitized.agentAssignment.reviewerId);
  });

  it("keeps implementer and reviewer distinct (Test R)", () => {
    expect(assignment.implementerId).not.toBe(assignment.reviewerId);
    expect(evidence.candidateOwner).not.toBe(evidence.reviewer);
  });
});

describe("Spec 148 independent-review and exact-HEAD enforcement", () => {
  it("resolves Claude implementer to a distinct Codex reviewer (Tests R, W)", () => {
    const result = resolveEffectiveRoles({ state: {}, requestedImplementerId: "claude" });
    expect(result.ok).toBe(true);
    expect(result.roles).toEqual({ implementer: "claude", reviewer: "codex" });
    expect(result.roles?.reviewer).not.toBe(result.roles?.implementer);
  });

  it("refuses to let Claude review its own candidate when no distinct reviewer exists (Test W)", () => {
    const result = resolveEffectiveRoles({
      state: { roleRoster: ["claude"] },
      requestedImplementerId: "claude",
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("No distinct Reviewer candidate exists");
  });

  it("blocks safely when the Codex reviewer runtime is unavailable (Test V)", () => {
    const result = resolveEffectiveRoles({
      state: { agentRunners: { codex: { enabled: false } } },
      requestedImplementerId: "claude",
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ").toLowerCase()).toContain("codex");
  });

  // The durable/resumed ADOS role path is authoritative per requirement 10, so
  // it must enforce the same guards as a fresh resolution - not wave through
  // whatever roles are pinned.
  it("rejects durable/resumed roles that put one agent in both seats (no self-review from ADOS state) (Tests P, W)", () => {
    const result = resolveEffectiveRoles({
      state: {},
      existingRunRoles: { implementer: "claude", reviewer: "claude", source: "resume" },
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ")).toContain("review its own candidate");
  });

  it("blocks a resumed run whose durable Codex reviewer runtime is unavailable (Tests Q, V)", () => {
    const result = resolveEffectiveRoles({
      state: { agentRunners: { codex: { enabled: false } } },
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "resume" },
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics.join(" ").toLowerCase()).toContain("codex");
  });

  it("preserves valid durable Claude implementer / Codex reviewer roles on resume (Tests P, Q, R)", () => {
    const result = resolveEffectiveRoles({
      state: {},
      existingRunRoles: { implementer: "claude", reviewer: "codex", source: "cli-override" },
    });
    expect(result.ok).toBe(true);
    expect(result.roles).toEqual({ implementer: "claude", reviewer: "codex" });
    expect(result.roles?.implementer).not.toBe(result.roles?.reviewer);
  });

  it("does not converge without any reviewer attempt (no self-review fallback) (Test W)", () => {
    expect(computeConvergenceStatus({ hasAnyReviewAttempt: false })).toBe(CONVERGENCE_STATUSES.NOT_STARTED);
  });

  it("converges only when validated == reviewed == exact HEAD (Test U)", () => {
    const aligned = {
      hasAnyReviewAttempt: true,
      latestReviewOutcome: "Approved",
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: 0,
      exactTargetMatch: true,
    };
    expect(computeConvergenceStatus(aligned)).toBe(CONVERGENCE_STATUSES.CONVERGED);
    expect(computeConvergenceStatus({ ...aligned, exactTargetMatch: false })).toBe(CONVERGENCE_STATUSES.IN_PROGRESS);
  });

  it("does not converge on 'Changes Requested' even at exact HEAD (Tests U, X)", () => {
    expect(
      computeConvergenceStatus({
        hasAnyReviewAttempt: true,
        latestReviewOutcome: "Changes Requested",
        latestCompletenessStatus: "complete",
        activeBlockingFindingsCount: 0,
        exactTargetMatch: true,
      }),
    ).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
  });

  it("does not let a stale approval authorize a newer candidate (Test T)", () => {
    // A prior "Approved" recorded against an older SHA is modelled as
    // exactTargetMatch=false once a newer candidate exists.
    expect(
      computeConvergenceStatus({
        hasAnyReviewAttempt: true,
        latestReviewOutcome: "Approved",
        latestCompletenessStatus: "complete",
        activeBlockingFindingsCount: 0,
        exactTargetMatch: false,
      }),
    ).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
    expect(evidence.shaAlignment.staleApprovalReuseAllowed).toBe(false);
  });

  it("enforces validated == reviewed == exact HEAD from durable ADOS state before publication (Tests S, U, X)", () => {
    // Pipeline order is candidate -> validate -> review. A later-stage durable
    // file that is simply ABSENT means that stage has not completed yet (on the
    // first cycle of a run dir none of candidate/validation/review-runtime.json
    // exists, and this suite runs inside `npm test` = validation command #1, so
    // validation-runtime.json naming the current HEAD can only exist *after*
    // this passes) - absence is tolerated below by DERIVING that leg's match as
    // false, never by skipping the gate. But a later-stage file present WITHOUT
    // its earlier-stage sibling is tampering - fail. This is the pipeline-order
    // form of the sibling-artifact rule the ados-run.json check above applies.
    if (durableReview) {
      expect(
        durableValidation,
        "review-runtime.json present without validation-runtime.json (pipeline order candidate -> validate -> review)",
      ).toBeDefined();
      expect(
        durableCandidate,
        "review-runtime.json present without candidate.json (pipeline order candidate -> validate -> review)",
      ).toBeDefined();
    }
    if (durableValidation) {
      expect(
        durableCandidate,
        "validation-runtime.json present without candidate.json (pipeline order candidate -> validate -> review)",
      ).toBeDefined();
    }

    const exactHead = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    expect(exactHead).toMatch(/^[0-9a-f]{40}$/);

    // Compare the durable targets (candidate/validated/reviewed) against exact
    // HEAD with the SAME comparator production uses - validationPolicy.js
    // `targetsMatch`, reached in production through validationPlan.js
    // `isFinalValidationSatisfied` (orchestrateCommand.js final-verification
    // stage) - not a test-local `===`. Each `*MatchesHead` below DEFAULTS to
    // false and is only raised to true by a present-and-aligned durable record,
    // so the publication-gate biconditional at the end runs unconditionally and
    // an absent leg can never silently authorize convergence.
    const headTarget = shaTarget(exactHead);

    let candidateMatchesHead = false;
    if (durableCandidate) {
      // The durable candidate must name a commit on this branch's history - exact
      // HEAD or an ancestor of it, never one that diverges from or leads HEAD
      // (which would be tampering). A trailing candidate is a legitimate *state*
      // during implementation recovery (the implementer may commit fixes after
      // candidate.json was written, the same shape as every cycle after the
      // first), so the ancestor check below tolerates it - but it is never an
      // *authorization*: `candidateMatchesHead` is folded into the alignment
      // conjunction, so a candidate that is not exact HEAD forces
      // `exactTargetMatch=false` and nothing can reach CONVERGED. Criterion 11
      // requires candidate == validated == reviewed == exact HEAD - all four -
      // before publication.
      expect(durableCandidate.candidate_sha).toMatch(/^[0-9a-f]{40}$/);
      if (durableCandidate.candidate_sha === exactHead) {
        expect(durableCandidate.candidate_sha).toBe(exactHead);
      } else {
        let candidateIsAncestorOfHead = false;
        try {
          execFileSync("git", ["merge-base", "--is-ancestor", durableCandidate.candidate_sha, exactHead]);
          candidateIsAncestorOfHead = true;
        } catch {
          candidateIsAncestorOfHead = false;
        }
        expect(
          candidateIsAncestorOfHead,
          "durable candidate_sha must be exact HEAD or an ancestor of it, never divergent or ahead",
        ).toBe(true);
      }
      // Derived with the production comparator (criterion 11: candidate must
      // equal exact HEAD, not merely be an ancestor, to authorize publication).
      candidateMatchesHead = targetsMatch(shaTarget(durableCandidate.candidate_sha), headTarget);
    }

    let validatedMatchesHead = false;
    if (durableValidation) {
      // Validation must never leave the worktree at a different commit than it
      // started (no mutation during the run), for any cycle, stale or current.
      expect(durableValidation.head_before).toBe(durableValidation.head_after);
      expect(Array.isArray(durableValidation.commands)).toBe(true);
      validatedMatchesHead = targetsMatch(shaTarget(durableValidation.head_after), headTarget);
      // When a COMPLETE, passing durable validation record names exact HEAD, the
      // FULL configured validation set (acceptance criterion 19) must be present
      // and every command must have passed. Only a passing run has the full list:
      // ADOS also writes validation-runtime.json for a FAILED attempt (status
      // "BLOCK") at this same HEAD, with the command list truncated at the first
      // failing / timed-out command. This suite runs inside `npm test` -
      // validation command #1 - so asserting completeness against a prior
      // failed-at-HEAD record would deadlock recovery (the full list can only
      // exist once every command, this one included, has already passed once).
      // Gate fail-closed: run the assertion for an explicit PASS (and any
      // unknown status token), skip it only for an explicit BLOCK. (A stale prior
      // cycle's list is not asserted either - after cycle one the durable
      // validation, and always the durable review, describe an already-finished
      // earlier candidate, caught by validatedMatchesHead above.)
      if (validatedMatchesHead && durableValidation.status !== "BLOCK") {
        const CONFIGURED_VALIDATION_COMMANDS = [
          "npm test",
          "npx tsc --noEmit",
          "npm run build",
          "npm run test:e2e:home-canvas",
          "git diff --check",
          "git diff --cached --check",
        ];
        const ranCommands = durableValidation.commands.map((command) => command.command);
        for (const configured of CONFIGURED_VALIDATION_COMMANDS) {
          expect(ranCommands, `configured validation command "${configured}" must have run at exact HEAD`)
            .toContain(configured);
        }
        for (const command of durableValidation.commands) {
          expect(command.exit_code, `${command.command} must exit 0`).toBe(0);
          expect(command.timed_out ?? false, `${command.command} must not have timed out`).toBe(false);
        }
      }
    }

    let reviewedMatchesHead = false;
    let reviewedMatchesValidated = false;
    if (durableReview) {
      expect(durableReview.reviewed_sha).toMatch(/^[0-9a-f]{40}$/);
      reviewedMatchesHead = targetsMatch(shaTarget(durableReview.reviewed_sha), headTarget);
      reviewedMatchesValidated = durableValidation
        ? targetsMatch(shaTarget(durableReview.reviewed_sha), shaTarget(durableValidation.head_after))
        : false;
    }

    // The publication gate, fed the REAL durable review decision and the
    // exactTargetMatch DERIVED above. Runs UNCONDITIONALLY - an absent
    // candidate/validation/review record leaves its `*MatchesHead` false, so
    // `allAligned` is false and the assertion is "must not authorize
    // publication", a real invariant that fails if absence ever produced
    // CONVERGED. Biconditional: converge iff an Approved review is aligned on
    // candidate == validated == reviewed == exact HEAD. Both branches carry a
    // real invariant - a stale review (reviewed_sha != HEAD, the state on every
    // cycle after the first) derives exactTargetMatch=false and must not
    // authorize publication; a "Changes Requested" against exact HEAD (the
    // durable state while this candidate is under review) must not either; and
    // no review attempt at all (clean checkout) is NOT_STARTED, never CONVERGED.
    const allAligned =
      candidateMatchesHead && validatedMatchesHead && reviewedMatchesHead && reviewedMatchesValidated;
    const reviewDecision = durableReview ? durableReview.decision : undefined;
    const status = computeConvergenceStatus({
      hasAnyReviewAttempt: Boolean(durableReview),
      latestReviewOutcome: reviewDecision,
      latestCompletenessStatus: "complete",
      activeBlockingFindingsCount: reviewDecision === "Approved" ? 0 : 1,
      exactTargetMatch: allAligned,
    });
    if (reviewDecision === "Approved" && allAligned) {
      expect(status).toBe(CONVERGENCE_STATUSES.CONVERGED);
    } else {
      // A non-Approved or non-aligned review must not merely fail to converge -
      // it must resolve to a SPECIFIC non-converged status and leave no
      // publication-authorizing state behind. This branch cannot be turned into
      // a hard failure when the durable review is "Changes Requested": this
      // suite runs inside `npm test` (validation command #1), `npm test` must
      // pass before ADOS validation, and ADOS validation must pass before the
      // Codex review runs, so a test that fails here would deadlock the very
      // review it is waiting on. The enforceable invariant is the block itself.
      const expected = durableReview
        ? CONVERGENCE_STATUSES.IN_PROGRESS   // e.g. "Changes Requested", or a stale/trailing reviewed_sha
        : CONVERGENCE_STATUSES.NOT_STARTED;  // clean checkout, no review attempt yet
      expect(status).toBe(expected);
      expect(status).not.toBe(CONVERGENCE_STATUSES.CONVERGED);
      // No publication-authorizing side effect: the tracked evidence keeps
      // publicationResult a standing "Blocked until ..." gate, never a frozen
      // per-candidate "published" verdict.
      expect(evidence.publicationResult).toMatch(/^Blocked until\b/);
    }

    expect(evidence.shaAlignment.candidateOwner).toBe("claude");
    expect(evidence.shaAlignment.staleApprovalReuseAllowed).toBe(false);
  });

  it("keeps publicationResult a standing gate, not a frozen per-candidate verdict (Tests U, X, Y)", () => {
    expect(evidence.publicationResult).toMatch(/Approved/);
    expect(evidence.publicationResult.toLowerCase()).toContain("exact head");
    // No frozen candidate SHA literal in the publication result.
    expect(evidence.publicationResult).not.toMatch(/[0-9a-f]{40}/);
  });
});
