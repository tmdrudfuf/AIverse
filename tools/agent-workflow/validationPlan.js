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
// validation attempt passed and its target does not *positively disagree*
// with the target of the latest review attempt, which must itself be
// Approved. Used identically by runSummary.js's
// humanGate/finalReadinessSatisfied computation so the two can never
// disagree about what "final validation satisfied" means.
//
// A record with no `target` at all predates Spec 055 (or was built without
// target tracking, e.g. legacy/hand-built state); this is "unknown", not a
// disagreement -- Spec 054 already reported humanGate.ready: true whenever
// every other condition held, with no commit-match evidence at all, and this
// feature must not retroactively withdraw that readiness for legacy data
// just because target tracking did not exist yet. Only a *positive*
// mismatch -- both targets present and actually different -- withholds
// readiness.
function isFinalValidationSatisfied(state) {
  const validationRuns = asArray(state && state.validationRuns);
  const reviewRuns = asArray(state && state.reviewRuns);

  const lastFullRecord = [...validationRuns].reverse().find((record) => isFullPhaseRecord(record));
  if (!lastFullRecord || lastFullRecord.status !== "passed") {
    return { satisfied: false, reason: "no-passed-full-validation" };
  }

  const lastReview = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
  if (!lastReview || lastReview.outcome !== "Approved") {
    return { satisfied: false, reason: "no-approved-review" };
  }

  if (lastFullRecord.target && lastReview.target && !targetsMatch(lastFullRecord.target, lastReview.target)) {
    return { satisfied: false, reason: "target-mismatch" };
  }

  return { satisfied: true, reason: null };
}

module.exports = {
  buildValidationPlanPreview,
  isFinalValidationSatisfied,
};
