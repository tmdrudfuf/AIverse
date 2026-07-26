const {
  resolveValidationPolicy,
  resolvePhaseForStage,
  commandsForPhase,
  targetsMatch,
} = require("./validationPolicy.js");
const { isFullPhaseRecord } = require("./validationPhase.js");

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

// Shared by orchestrate --dry-run's preview and (indirectly, via the same
// resolvePhaseForStage rules) the real run, so the two can never disagree
// about which phase would run next.
function buildValidationPlanPreview(state, stage, options = {}) {
  const policy = resolveValidationPolicy(state, options);
  const phase = resolvePhaseForStage(policy, stage, options);
  const commands = commandsForPhase(policy, phase);
  const reason = options.forceFullValidation
    ? "manual-request (--force-full-validation)"
    : (stage === "final-verification"
      ? "final-verification is always the full phase"
      : `strategy=${policy.strategy}`);
  return {
    strategy: policy.strategy,
    focusedCommands: policy.focusedCommands || [],
    fullCommands: policy.fullCommands,
    phase,
    commands,
    reason,
  };
}

// Inspects durable state only (no I/O): satisfied iff the latest full-phase
// validation attempt passed, its target exactly matches the target of the
// latest review attempt (which must itself be Approved), and BOTH targets
// are actually present. Used identically by runSummary.js's
// humanGate/finalReadinessSatisfied computation so the two can never
// disagree about what "final validation satisfied" means.
//
// Per spec.md FR-010, readiness MUST be false whenever the comparison is
// inconclusive OR either target is missing -- exact-match evidence is a
// requirement this feature introduces, not an optional enhancement, so
// absent evidence must never be read as a free pass (Codex review round 2,
// finding P1-001). This is a deliberate change from this feature's earlier
// draft behavior, which treated missing evidence as "unknown, not
// disproven" for backward compatibility with pre-Spec-055 data; that
// permissiveness contradicted this function's own written contract and is
// corrected here. Genuinely old run directories remain fully *readable*
// (FR-023 is about reading, not about claiming a stricter, newer readiness
// guarantee retroactively) -- they simply report `finalReadinessSatisfied:
// false` / `exactCommitMatch: "unknown"` rather than a confident `true`.
function isFinalValidationSatisfied(state) {
  const validationRuns = asArray(state && state.validationRuns);
  const reviewRuns = asArray(state && state.reviewRuns);

  // Must be specifically the final-verification stage, not merely any
  // full-phase record: under full-every-cycle (or --force-full-validation,
  // requiresFullValidation, or the focused-command fallback),
  // validate/revalidate occurrences are ALSO phase "full", so filtering by
  // phase alone could accept an earlier validate/revalidate pass as if it
  // were the final gate -- a false-readiness risk if state is inspected
  // (e.g. via the `summary` command) between an Approved review and
  // final-verification actually running (Codex review round 4, finding
  // P1-002).
  const lastFullRecord = [...validationRuns].reverse().find((record) => record.stage === "final-verification" && isFullPhaseRecord(record));
  if (!lastFullRecord || lastFullRecord.status !== "passed") {
    return { satisfied: false, reason: "no-passed-full-validation" };
  }

  const lastReview = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
  if (!lastReview || lastReview.outcome !== "Approved") {
    return { satisfied: false, reason: "no-approved-review" };
  }

  if (!lastFullRecord.target || !lastReview.target) {
    return { satisfied: false, reason: "target-evidence-missing" };
  }

  if (!targetsMatch(lastFullRecord.target, lastReview.target)) {
    return { satisfied: false, reason: "target-mismatch" };
  }

  return { satisfied: true, reason: null };
}

module.exports = {
  buildValidationPlanPreview,
  isFinalValidationSatisfied,
};
