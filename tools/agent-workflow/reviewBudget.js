// Spec 056 Part C: review/fix-cycle budget resolution and enforcement.
//
// Pure module: resolves a small, safe set of default ceilings from CLI
// overrides and state, and checks a supplied usage snapshot against them.
// It never mutates state, never raises its own limits, and never decides
// approval -- only orchestrateCommand.js's stop-reason wiring does that,
// consulting this module's output.

const DEFAULT_REVIEW_BUDGET = {
  maxReviewAttempts: 3,
  maxAutomaticFixCycles: 2,
  maxIncompleteReviewRetries: 1,
  maxReviewerQuestionCycles: 1,
};

const REVIEW_CONVERGENCE_FAILED_STOP_REASON = "review-convergence-failed";

function normalizePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

// Precedence (Spec 056 clarifications.md Q16/Q17): an explicit CLI
// `--review-*` flag wins; otherwise an explicit `state.reviewBudget.*` value
// wins; otherwise `maxAutomaticFixCycles` mirrors the existing
// `--max-fix-cycles`/`state.maxFixCycles` value (so the two never silently
// diverge for the Reviewer-requested fix path unless a state file
// explicitly overrides `reviewBudget.maxAutomaticFixCycles`); every other
// ceiling falls back to its documented default.
function resolveReviewBudget({ cliOverrides = {}, state = {}, maxFixCyclesFallback } = {}) {
  const stateBudget = (state && typeof state.reviewBudget === "object" && state.reviewBudget) || {};
  const fixCyclesFallback = normalizePositiveInt(
    maxFixCyclesFallback ?? state.maxFixCycles,
    DEFAULT_REVIEW_BUDGET.maxAutomaticFixCycles,
  );

  return {
    maxReviewAttempts: normalizePositiveInt(
      cliOverrides.maxReviewAttempts ?? stateBudget.maxReviewAttempts,
      DEFAULT_REVIEW_BUDGET.maxReviewAttempts,
    ),
    maxAutomaticFixCycles: normalizePositiveInt(
      cliOverrides.maxAutomaticFixCycles ?? stateBudget.maxAutomaticFixCycles,
      fixCyclesFallback,
    ),
    maxIncompleteReviewRetries: normalizePositiveInt(
      cliOverrides.maxIncompleteReviewRetries ?? stateBudget.maxIncompleteReviewRetries,
      DEFAULT_REVIEW_BUDGET.maxIncompleteReviewRetries,
    ),
    maxReviewerQuestionCycles: normalizePositiveInt(
      cliOverrides.maxReviewerQuestionCycles ?? stateBudget.maxReviewerQuestionCycles,
      DEFAULT_REVIEW_BUDGET.maxReviewerQuestionCycles,
    ),
  };
}

// Checks a usage snapshot against the resolved budget. Returns the first
// exhausted ceiling found (stable enumeration order below), or
// `{ exhausted: false }` when none are exhausted. Never mutates usage or
// budget; never raises limits.
function isBudgetExhausted(usage = {}, budget = DEFAULT_REVIEW_BUDGET) {
  const checks = [
    ["maxReviewAttempts", "reviewAttempts"],
    ["maxAutomaticFixCycles", "automaticFixCycles"],
    ["maxIncompleteReviewRetries", "incompleteReviewRetries"],
    ["maxReviewerQuestionCycles", "reviewerQuestionCycles"],
  ];
  for (const [budgetKey, usageKey] of checks) {
    const limit = Number(budget[budgetKey]);
    const used = Number(usage[usageKey] || 0);
    if (Number.isFinite(limit) && used >= limit) {
      return { exhausted: true, ceiling: budgetKey, used, limit };
    }
  }
  return { exhausted: false, ceiling: null };
}

function buildExhaustionReport(usage = {}, budget = DEFAULT_REVIEW_BUDGET, options = {}) {
  const exhaustion = isBudgetExhausted(usage, budget);
  const openBlockingFindings = Number(options.openBlockingFindingsCount || 0);
  const newFindingsLatestRound = Number(options.newFindingsLatestRound || 0);
  const reopenedFindings = Number(options.reopenedFindingsCount || 0);
  return {
    stopReason: REVIEW_CONVERGENCE_FAILED_STOP_REASON,
    exhaustedCeiling: exhaustion.ceiling,
    attemptCount: usage.reviewAttempts || 0,
    configuredLimit: exhaustion.ceiling ? budget[exhaustion.ceiling] : null,
    openBlockingFindings,
    newFindingsLatestRound,
    reopenedFindings,
    recommendedHumanAction: openBlockingFindings > 0 || newFindingsLatestRound > 0
      ? "Review the open/newly-discovered blocking findings; either resolve them manually or resume with an increased reviewBudget/--max-fix-cycles once you are confident the remaining work is bounded."
      : "Inspect why the review/fix loop has not converged (e.g. a flapping Reviewer decision) before resuming with a larger budget.",
  };
}

module.exports = {
  DEFAULT_REVIEW_BUDGET,
  REVIEW_CONVERGENCE_FAILED_STOP_REASON,
  buildExhaustionReport,
  isBudgetExhausted,
  resolveReviewBudget,
};
