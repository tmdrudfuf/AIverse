const { buildRunSummary } = require("./runSummary.js");
const { renderRunSummaryMarkdown } = require("./runSummaryRenderer.js");

/**
 * Read-only: computes the latest logical run summary directly from the
 * supplied state (never from a possibly-stale cached run-summary.json), and
 * never spawns a process, runs validation, mutates state, or writes any
 * artifact.
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
