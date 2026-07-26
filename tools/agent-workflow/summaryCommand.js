const { buildRunSummary } = require("./runSummary.js");
const { renderRunSummaryMarkdown } = require("./runSummaryRenderer.js");

/**
 * Read-only: computes the latest logical run summary directly from the
 * supplied state (never from a possibly-stale cached run-summary.json), and
 * never spawns a process (including git), runs validation, mutates state, or
 * writes any artifact. commits.currentBranchHead is therefore only ever
 * populated by an orchestrate-written summary (which already has live git
 * context from its own real run and passes it in) -- reading it here would
 * require a new git subprocess this command must never spawn, so read-only
 * summary inspection reports it as unknown/null instead.
 */
function getRunSummaryForDisplay(state, options = {}) {
  return buildRunSummary(state, { cwd: options.cwd || process.cwd() });
}

function formatSummaryCommandOutput(summary, format = "markdown") {
  if (format === "json") {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }
  return renderRunSummaryMarkdown(summary);
}

module.exports = {
  getRunSummaryForDisplay,
  formatSummaryCommandOutput,
};
