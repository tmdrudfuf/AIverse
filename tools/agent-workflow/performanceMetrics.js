// Spec 056 Part D: performance telemetry helpers.
//
// Pure module: computes prompt size and duration summaries from data the
// workflow already collects (reviewRuns[]/validationRuns[] records); it
// never times anything itself and never writes to disk. Validation phase
// bucketing reuses validationPhase.js's existing full/focused defaulting
// (Spec 055 precedent: a legacy record with no `phase` field is "full") so
// this module can never disagree with runSummary.js's own phase counting.

const { isFocusedPhaseRecord, isFullPhaseRecord } = require("./validationPhase.js");

function measurePromptSize(promptText) {
  const text = String(promptText || "");
  return { characters: text.length, bytes: Buffer.byteLength(text, "utf8") };
}

// Plain parameters (defaulted inside the body, not via a bare `= []`/`= {}`
// on the signature): TypeScript's allowJs inference for a parameter
// defaulted to an empty array/object literal with no other contextual
// information infers it as `never[]`/`{}`, which then rejects every real
// call site passing populated literals from a strict .ts test file.
function summarizeValidationPhaseDurations(validationRuns) {
  const records = Array.isArray(validationRuns) ? validationRuns : [];
  let focusedValidationDurationMs = 0;
  let fullValidationDurationMs = 0;
  for (const record of records) {
    const durationMs = Number(record.durationMs || 0);
    if (isFocusedPhaseRecord(record)) focusedValidationDurationMs += durationMs;
    else if (isFullPhaseRecord(record)) fullValidationDurationMs += durationMs;
  }
  return { focusedValidationDurationMs, fullValidationDurationMs };
}

function summarizeReviewDurationMs(reviewRuns) {
  return (Array.isArray(reviewRuns) ? reviewRuns : [])
    .reduce((sum, record) => sum + Number(record.durationMs || 0), 0);
}

function buildPerformanceSummary(options) {
  const opts = options || {};
  const reviewRuns = Array.isArray(opts.reviewRuns) ? opts.reviewRuns : [];
  const validationRuns = opts.validationRuns;
  const reviewAttempts = opts.reviewAttempts;
  const { focusedValidationDurationMs, fullValidationDurationMs } = summarizeValidationPhaseDurations(validationRuns);
  return {
    reviewDurationMs: summarizeReviewDurationMs(reviewRuns),
    focusedValidationDurationMs,
    fullValidationDurationMs,
    reviewAttempts: Number.isFinite(reviewAttempts) ? reviewAttempts : reviewRuns.length,
  };
}

module.exports = {
  buildPerformanceSummary,
  measurePromptSize,
  summarizeReviewDurationMs,
  summarizeValidationPhaseDurations,
};
