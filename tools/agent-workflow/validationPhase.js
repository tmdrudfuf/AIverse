// Shared normalization for the additive validation-record fields Spec 055
// introduces (`phase`, `triggerReason`, `target`), used both when
// orchestrateCommand.js writes a validationRuns record and when runSummary.js
// reads one back -- including legacy (pre-Spec-055) records that have none of
// these fields at all.

// A record with no `phase` predates this feature, when every validation
// occurrence used one uniform "full" command list -- so it is interpreted as
// `full`, never fabricated as `focused`.
function isFullPhaseRecord(record) {
  return !record || record.phase === "full" || !record.phase;
}

function isFocusedPhaseRecord(record) {
  return Boolean(record && record.phase === "focused");
}

function buildValidationRecordFields(input) {
  const { phase, triggerReason, target } = input || {};
  return {
    phase,
    triggerReason: triggerReason || null,
    target: target || null,
  };
}

module.exports = {
  isFullPhaseRecord,
  isFocusedPhaseRecord,
  buildValidationRecordFields,
};
