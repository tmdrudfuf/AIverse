// Spec 056 Part C: review convergence tracking.
//
// This module is a read layer on top of Spec 052's existing finding-lifecycle
// history (findingLifecycle.js) -- it does not replace or duplicate finding
// ID assignment, resume persistence, or new/still_open/resolved
// classification, all of which findingLifecycle.js already owns and tests
// cover. It adds exactly what Spec 052 does not track: whether a finding is
// new-this-run vs. a carryover, a best-effort "reopened" signal for a
// resolved issue resurfacing under a fresh ID (Spec 052 deliberately
// rejects ID reuse for a resolved finding -- see findingLifecycle.js
// preserveResolvedHistoryLifecycle -- so a genuine reopening necessarily
// arrives as a new ID; reviewConvergence.js links it back to the resolved
// entry it matches by file/location/summary), and the aggregate convergence
// metrics/status the run summary and orchestration loop both need to agree
// on (mirroring Spec 055's isFinalValidationSatisfied "single shared
// computation" pattern).

const CONVERGENCE_STATUSES = {
  NOT_STARTED: "not-started",
  IN_PROGRESS: "in-progress",
  CONVERGED: "converged",
  BUDGET_EXHAUSTED: "budget-exhausted",
  INCOMPLETE_REVIEW: "incomplete-review",
  BLOCKED: "blocked",
};

// High-risk categories remain blocking regardless of the Reviewer's
// self-reported severity (Spec 056 FR-016/§23).
const HIGH_RISK_CATEGORY_PATTERNS = [
  /false\s+readiness/i,
  /remote\s+mutation/i,
  /unsafe\s+command/i,
  /credential/i,
  /state\s+corrupt/i,
  /resume\s+corrupt/i,
  /exact.?head|exact.?target|provenance/i,
  /validation\s+bypass/i,
  /review\s+parser|approval\s+bug/i,
  /data\s+loss/i,
  /human.?gate/i,
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isHighRiskCategory(finding) {
  const text = [finding.summary, finding.reason, finding.recommendation, finding.category]
    .filter(Boolean).join(" ");
  return HIGH_RISK_CATEGORY_PATTERNS.some((pattern) => pattern.test(text));
}

// P3 findings are non-blocking by default, but a high-risk-category finding
// remains blocking regardless of the severity the Reviewer assigned
// (Spec 056 FR-016/§23) -- this is the one place severity can be overridden.
function isEffectivelyBlocking(finding) {
  if (isHighRiskCategory(finding)) return true;
  if (finding.severity === "P3") return false;
  return true;
}

function findResolvedMatch(finding, findingHistory) {
  const resolved = findingHistory.filter((entry) => entry.currentStatus === "resolved");
  return resolved.find((entry) => {
    const entryFinding = entry.finding || {};
    const sameLocation = finding.filePath && entryFinding.filePath === finding.filePath
      && finding.location && entryFinding.location === finding.location;
    const sameSummary = finding.summary && entry.summary && normalizeString(finding.summary) === normalizeString(entry.summary);
    return sameLocation || sameSummary;
  });
}

// Classifies each blocking finding reported in the *current* review attempt
// against the persisted finding history. `new` = never seen before this run;
// `previously-known` = the same ID already open (still_open/new) from an
// earlier attempt -- a carryover, not a fresh discovery; `reopened` = a new
// ID that content-matches a previously *resolved* entry (best-effort; see
// module header for why this cannot be exact-ID-based).
//
// `currentAttemptNumber`, when supplied, excludes a history entry whose
// `firstSeenReviewSequence` equals the attempt being classified: the caller
// (orchestrateCommand.js) applies Spec 052's finding-lifecycle update
// *before* calling this function, so a genuinely new finding from *this*
// attempt is already present in `findingHistory` by the time classification
// runs -- without this exclusion it would be misread as a carryover from an
// earlier attempt instead of a fresh discovery.
function classifyFindingsForAttempt(currentBlockingFindings, findingHistory = [], currentAttemptNumber) {
  const historyById = new Map(findingHistory.map((entry) => [entry.findingId, entry]));
  return (Array.isArray(currentBlockingFindings) ? currentBlockingFindings : []).map((finding) => {
    const id = normalizeString(finding.id);
    const priorEntry = historyById.get(id);
    const isFromCurrentAttempt = currentAttemptNumber !== undefined && priorEntry
      && priorEntry.firstSeenReviewSequence === currentAttemptNumber;
    if (priorEntry && priorEntry.currentStatus !== "resolved" && !isFromCurrentAttempt) {
      return { findingId: id, classification: "previously-known", finding };
    }
    const reopenedMatch = findResolvedMatch(finding, findingHistory);
    if (reopenedMatch) {
      return { findingId: id, classification: "reopened", finding, reopenedFromFindingId: reopenedMatch.findingId };
    }
    return { findingId: id, classification: "new", finding };
  });
}

function countByClassification(classifiedFindings, classification) {
  return classifiedFindings.filter((entry) => entry.classification === classification && isEffectivelyBlocking(entry.finding)).length;
}

// Running convergence metrics, updated once per completed (non-incomplete)
// review attempt. `firstBlockingFindings` is captured once, on the first
// attempt only; `newBlockingFindingsAfterFirstReview` accumulates over every
// later attempt -- the central convergence metric (Spec 056 §19/FR-012).
function updateConvergenceMetrics(previousMetrics, options) {
  const opts = options || {};
  const attemptNumber = opts.attemptNumber;
  const classifiedFindings = opts.classifiedFindings || [];
  const resolvedCountThisAttempt = Number(opts.resolvedCountThisAttempt || 0);
  const metrics = previousMetrics || {
    reviewAttempts: 0,
    firstReviewBlockingFindings: 0,
    newBlockingFindingsAfterFirstReview: 0,
    reopenedFindings: 0,
    resolvedFindingsVerified: 0,
  };
  const isFirstAttempt = attemptNumber === 1 || metrics.reviewAttempts === 0;
  const newCount = countByClassification(classifiedFindings, "new");
  const reopenedCount = countByClassification(classifiedFindings, "reopened");
  return {
    reviewAttempts: Math.max(metrics.reviewAttempts, attemptNumber),
    firstReviewBlockingFindings: isFirstAttempt
      ? classifiedFindings.filter((entry) => isEffectivelyBlocking(entry.finding)).length
      : metrics.firstReviewBlockingFindings,
    newBlockingFindingsAfterFirstReview: isFirstAttempt
      ? metrics.newBlockingFindingsAfterFirstReview
      : metrics.newBlockingFindingsAfterFirstReview + newCount + reopenedCount,
    reopenedFindings: metrics.reopenedFindings + reopenedCount,
    resolvedFindingsVerified: metrics.resolvedFindingsVerified + resolvedCountThisAttempt,
  };
}

// The finding ledger (Spec 056 FR-011) is a merged view of Spec 052's
// findingHistory (id/severity/summary/location/status/first-detected
// attempt -- already resume-safe and already tested) plus the reopened
// count this module tracks. It does not persist a second copy of finding
// identity; `reopenedCounts` is a plain `{ [findingId]: count }` map the
// caller accumulates across attempts (see performanceMetrics.js-adjacent
// state in orchestrateCommand.js) and passes back in on every call.
function buildFindingLedger(findingHistory = [], reopenedCounts = {}) {
  return findingHistory.map((entry) => ({
    id: entry.findingId,
    severity: entry.severity,
    blocking: entry.kind === "blocking",
    summary: entry.summary,
    location: (entry.finding && (entry.finding.location || entry.finding.filePath)) || "",
    firstDetectedReviewAttempt: entry.firstSeenReviewSequence,
    status: entry.currentStatus,
    resolutionTarget: entry.resolvedReviewSequence || null,
    resolutionNote: entry.recommendation || "",
    reopenedCount: reopenedCounts[entry.findingId] || 0,
  }));
}

// Convergence status is the single source of truth consulted by both the
// orchestration loop's stop decision and the run summary (Spec 055
// isFinalValidationSatisfied precedent) -- callers must not compute this
// independently.
function computeConvergenceStatus(options) {
  const opts = options || {};
  const latestReviewOutcome = opts.latestReviewOutcome;
  const latestCompletenessStatus = opts.latestCompletenessStatus;
  const activeBlockingFindingsCount = Number(opts.activeBlockingFindingsCount || 0);
  const exactTargetMatch = opts.exactTargetMatch !== false;
  const budgetExhausted = Boolean(opts.budgetExhausted);
  const hasAnyReviewAttempt = Boolean(opts.hasAnyReviewAttempt);
  if (!hasAnyReviewAttempt) return CONVERGENCE_STATUSES.NOT_STARTED;
  if (budgetExhausted) return CONVERGENCE_STATUSES.BUDGET_EXHAUSTED;
  if (latestCompletenessStatus === "incomplete") return CONVERGENCE_STATUSES.INCOMPLETE_REVIEW;
  if (latestCompletenessStatus === "invalid") return CONVERGENCE_STATUSES.BLOCKED;
  if (latestReviewOutcome === "Approved" && latestCompletenessStatus === "complete" && activeBlockingFindingsCount === 0 && exactTargetMatch) {
    return CONVERGENCE_STATUSES.CONVERGED;
  }
  return CONVERGENCE_STATUSES.IN_PROGRESS;
}

module.exports = {
  CONVERGENCE_STATUSES,
  buildFindingLedger,
  classifyFindingsForAttempt,
  computeConvergenceStatus,
  isEffectivelyBlocking,
  isHighRiskCategory,
  updateConvergenceMetrics,
};
