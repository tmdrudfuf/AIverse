const { buildRunSummary } = require("./runSummary.js");
const { renderRunSummaryMarkdown } = require("./runSummaryRenderer.js");
const { collectGitContext } = require("./reviewCommand.js");

/**
 * Read-only: computes the latest logical run summary directly from the
 * supplied state (never from a possibly-stale cached run-summary.json), and
 * never spawns a process, runs validation, mutates state, or writes any
 * artifact. Best-effort reads the live HEAD commit (a read-only `git
 * rev-parse`, the same call collectGitContext already makes for other
 * read-only commands) so commits.currentBranchHead is populated the same
 * way it is for an orchestrate-written summary.
 */
function getRunSummaryForDisplay(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  let currentBranchHead = null;
  try {
    currentBranchHead = collectGitContext({ cwd, baseBranch: state.baseBranch }).headCommit || null;
  } catch (error) {
    currentBranchHead = null;
  }
  return buildRunSummary(state, { cwd, currentBranchHead });
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
