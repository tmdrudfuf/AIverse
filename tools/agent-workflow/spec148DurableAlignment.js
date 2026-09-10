// Spec 148 verification helper - test-only, imported exclusively by the two
// Spec 148 test suites (spec148RoleAssignmentEvidence.test.ts and
// src/.../AutonomousCompanyOperationsE2E.test.ts). It is not an orchestration
// path and not a source of truth: it only OBSERVES the durable ADOS records the
// real pipeline writes and folds them for the existing production gates.
//
// `deriveDurableAlignment` reads the candidate / validation / review triple
// from a run directory and derives each SHA-alignment leg of the publication
// gate with the SAME comparator production uses (validationPolicy.js
// `targetsMatch`, reached in production through validationPlan.js
// `isFinalValidationSatisfied` at the orchestrateCommand.js final-verification
// stage). `convergenceForAlignment` feeds the result to the real
// reviewConvergence.js `computeConvergenceStatus`. Both suites call these over
// the run's own durable records; the E2E completion test and the fixture test
// additionally call them over a deterministic real-SHA triple written to a temp
// dir (authoritative requirement 23: the review runtime is a process boundary,
// like the implementer spawn and the suggestion provider).

const { execFileSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const { targetsMatch } = require("./validationPolicy.js");
const { computeConvergenceStatus } = require("./reviewConvergence.js");

const CONFIGURED_VALIDATION_COMMANDS = [
  "npm test",
  "npx tsc --noEmit",
  "npm run build",
  "npm run test:e2e:home-canvas",
  "git diff --check",
  "git diff --cached --check",
];

// Adapt a bare durable SHA into the { commit, dirty, dirtyHash } shape the
// production comparator expects. The durable validation record separately
// proves the worktree was unmutated across the run (head_before === head_after),
// i.e. `dirty: false`.
function shaTarget(sha) {
  return sha ? { commit: sha, dirty: false, dirtyHash: null } : null;
}

function readJsonIfPresent(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

function isAncestorOrEqual(sha, head) {
  if (sha === head) return true;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, head]);
    return true;
  } catch {
    return false;
  }
}

// `dir` - absolute path to a run directory holding any subset of candidate.json
// / validation-runtime.json / review-runtime.json. `exactHead` - the 40-hex
// commit publication must align to.
//
// Throws on tampering: a later pipeline stage present without its earlier
// sibling (pipeline order candidate -> validate -> review), a malformed SHA, a
// validation run that moved the worktree, or a PASS validation record missing a
// configured command / carrying a nonzero exit / a timeout.
//
// Returns the four alignment booleans plus the durable review decision. Each
// `*MatchesHead` defaults false and is only raised by a present, shape-valid,
// exact-HEAD-aligned record via `targetsMatch`, so an absent leg can never
// authorize convergence.
function deriveDurableAlignment(dir, exactHead) {
  const candidate = readJsonIfPresent(join(dir, "candidate.json"));
  const validation = readJsonIfPresent(join(dir, "validation-runtime.json"));
  const review = readJsonIfPresent(join(dir, "review-runtime.json"));

  if (review && !validation) {
    throw new Error("review-runtime.json present without validation-runtime.json (pipeline order candidate -> validate -> review)");
  }
  if (review && !candidate) {
    throw new Error("review-runtime.json present without candidate.json (pipeline order candidate -> validate -> review)");
  }
  if (validation && !candidate) {
    throw new Error("validation-runtime.json present without candidate.json (pipeline order candidate -> validate -> review)");
  }

  const headTarget = shaTarget(exactHead);

  let candidateMatchesHead = false;
  if (candidate) {
    if (!/^[0-9a-f]{40}$/.test(candidate.candidate_sha)) {
      throw new Error("durable candidate_sha is not a 40-hex commit");
    }
    // A trailing candidate is a legitimate state during implementation recovery,
    // so an ancestor is tolerated here - but it is never an authorization:
    // `candidateMatchesHead` folds into the alignment conjunction, so a
    // candidate that is not exact HEAD forces the gate below CONVERGED.
    if (!isAncestorOrEqual(candidate.candidate_sha, exactHead)) {
      throw new Error("durable candidate_sha must be exact HEAD or an ancestor of it, never divergent or ahead");
    }
    candidateMatchesHead = targetsMatch(shaTarget(candidate.candidate_sha), headTarget);
  }

  let validatedMatchesHead = false;
  if (validation) {
    if (validation.head_before !== validation.head_after) {
      throw new Error("validation mutated the worktree (head_before !== head_after)");
    }
    if (!Array.isArray(validation.commands)) {
      throw new Error("validation-runtime.json has no commands array");
    }
    // Acceptance criterion 19: a PASSING durable validation run must carry the
    // FULL configured command set, every command at exit 0 and no timeout -
    // asserted for ANY passing record, not only one aligned to exact HEAD (a
    // stale PASS still carries the complete list). Only status BLOCK (a failed
    // attempt, truncated command list) and an absent record escape this.
    if (validation.status === "PASS") {
      const ran = validation.commands.map((command) => command.command);
      for (const configured of CONFIGURED_VALIDATION_COMMANDS) {
        if (!ran.includes(configured)) {
          throw new Error(`passing validation record is missing configured command "${configured}"`);
        }
      }
      for (const command of validation.commands) {
        if (command.exit_code !== 0) {
          throw new Error(`${command.command} exited ${command.exit_code} in a PASS validation record`);
        }
        if (command.timed_out) {
          throw new Error(`${command.command} timed out in a PASS validation record`);
        }
      }
    }
    validatedMatchesHead = targetsMatch(shaTarget(validation.head_after), headTarget);
  }

  let reviewedMatchesHead = false;
  let reviewedMatchesValidated = false;
  if (review) {
    if (!/^[0-9a-f]{40}$/.test(review.reviewed_sha)) {
      throw new Error("durable reviewed_sha is not a 40-hex commit");
    }
    reviewedMatchesHead = targetsMatch(shaTarget(review.reviewed_sha), headTarget);
    reviewedMatchesValidated = validation
      ? targetsMatch(shaTarget(review.reviewed_sha), shaTarget(validation.head_after))
      : false;
  }

  const allAligned =
    candidateMatchesHead && validatedMatchesHead && reviewedMatchesHead && reviewedMatchesValidated;

  return {
    hasReview: Boolean(review),
    decision: review ? review.decision : undefined,
    candidateMatchesHead,
    validatedMatchesHead,
    reviewedMatchesHead,
    reviewedMatchesValidated,
    allAligned,
  };
}

// The publication gate, fed the derived alignment and the real durable review
// decision. Biconditional: CONVERGED iff an Approved review is aligned on
// candidate == validated == reviewed == exact HEAD.
function convergenceForAlignment(alignment) {
  return computeConvergenceStatus({
    hasAnyReviewAttempt: alignment.hasReview,
    latestReviewOutcome: alignment.decision,
    latestCompletenessStatus: "complete",
    activeBlockingFindingsCount: alignment.decision === "Approved" ? 0 : 1,
    exactTargetMatch: alignment.allAligned,
  });
}

module.exports = {
  CONFIGURED_VALIDATION_COMMANDS,
  shaTarget,
  deriveDurableAlignment,
  convergenceForAlignment,
};
