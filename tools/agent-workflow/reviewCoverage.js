// Spec 056 Part B: deterministic changed-file inventory, high-risk
// classification, and review-completeness computation.
//
// This module is pure: it only ever reads a supplied gitContext-shaped
// object (already computed by reviewCommand.js#collectGitContext, real or
// fake) and a supplied structured-review analysis; it never shells out to
// git or touches the filesystem itself, matching the Spec 053/054/055
// precedent (roleResolver.js, validationPolicy.js) of pure, state-in/
// value-out modules.

const HIGH_RISK_FILENAMES = new Set([
  "orchestrateCommand.js",
  "reviewCommand.js",
  "runSummary.js",
  "runSummarySchema.js",
  "agentRunner.js",
  "agentWorkflow.js",
  "structuredReview.js",
  "structuredAnswers.js",
  "findingLifecycle.js",
  "roleResolver.js",
  "validationPolicy.js",
  "validationPlan.js",
  "validationPhase.js",
  "reviewCoverage.js",
  "reviewConvergence.js",
  "reviewBudget.js",
  "performanceMetrics.js",
  "cli.js",
]);
const HIGH_RISK_PATH_PREFIX = "tools/agent-workflow/";
const DEFAULT_HIGH_RISK_LINE_THRESHOLD = 40;

const COMPLETENESS = {
  COMPLETE: "complete",
  INCOMPLETE: "incomplete",
  INVALID: "invalid",
};

function normalizePath(rawPath) {
  return String(rawPath || "").trim().replace(/\\/g, "/");
}

// git diff --stat renders renames as "old.js => new.js" or, for a shared
// prefix, "dir/{old => new}/file.js"; either way the resulting (current)
// path is what a Reviewer needs to inspect.
function resolveRenameTargetPath(rawPath) {
  if (!rawPath.includes("=>")) return rawPath;
  const braceMatch = rawPath.match(/\{(.*?)\s*=>\s*(.*?)\}/);
  if (braceMatch) return rawPath.replace(braceMatch[0], braceMatch[2]).replace(/\/{2,}/g, "/");
  const parts = rawPath.split("=>").map((part) => part.trim());
  return parts[parts.length - 1];
}

function parseDiffStat(statText) {
  const lines = String(statText || "").split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const match = line.match(/^\s*(.+?)\s*\|\s*(\d+|Bin)\s*(.*)$/);
    if (!match) continue;
    const rawPath = normalizePath(resolveRenameTargetPath(match[1].trim()));
    if (!rawPath) continue;
    const changesToken = match[2];
    const bar = match[3] || "";
    const changes = changesToken === "Bin" ? 0 : Number(changesToken) || 0;
    const additions = (bar.match(/\+/g) || []).length;
    const deletions = (bar.match(/-/g) || []).length;
    entries.push({ path: rawPath, changes, additions, deletions });
  }
  return entries;
}

// git diff --numstat gives exact per-file addition/deletion counts as plain
// tab-separated integers and never truncates or scales the way --stat's
// human-readable bar graph does (Spec 056 Codex review round 2, P1-001): a
// long path is abbreviated with a leading "..." in --stat output, and the
// +/- bar is scaled to fit a fixed display width once a diff is large
// enough, silently corrupting the changed-file path and undercounting the
// line-count-based high-risk classification for exactly the large,
// deeply-nested changes this feature most needs to classify correctly.
// Confirmed empirically: `git diff --stat` on a 499-line change to a long
// path renders ` .../deeply/nested/.../file.js | 499 +++++++++++++++++++++`
// (21 `+` characters for 499 real insertions, and a mangled path), while
// `git diff --numstat` on the same change renders the exact
// `499\t0\tfull/real/path/file.js`. --numstat's rename notation matches
// --stat's (the same brace/arrow condensed form for a similar-directory
// rename), so resolveRenameTargetPath is reused unchanged; a binary file is
// reported as `-\t-\t<path>` and treated as 0/0, consistent with this
// module's existing "Bin" handling for --stat.
function parseNumstat(statText) {
  const lines = String(statText || "").split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!match) continue;
    const rawPath = normalizePath(resolveRenameTargetPath(match[3].trim()));
    if (!rawPath) continue;
    const additions = match[1] === "-" ? 0 : Number(match[1]) || 0;
    const deletions = match[2] === "-" ? 0 : Number(match[2]) || 0;
    entries.push({ path: rawPath, additions, deletions });
  }
  return entries;
}

// Whether the supplied gitContext was collected with numstat support (real
// collectGitContext always includes these keys, even as "" for "no changes
// in that diff"). Distinguishing by key presence, not content, keeps every
// pre-existing test/fixture that hand-builds a gitContext-shaped object with
// only the `*DiffStat` fields exercising the exact bar-parsing behavior it
// always has -- this fix does not retroactively change their expectations.
function hasNumstatSupport(gitContext) {
  return gitContext.committedDiffNumstat !== undefined
    || gitContext.stagedDiffNumstat !== undefined
    || gitContext.unstagedDiffNumstat !== undefined;
}

function parseStatusCodes(statusPorcelain) {
  const map = new Map();
  const lines = String(statusPorcelain || "").split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const code = line.slice(0, 2);
    let rest = line.slice(3);
    if (rest.includes(" -> ")) rest = rest.split(" -> ")[1];
    map.set(normalizePath(rest), code.trim());
  }
  return map;
}

function describeStatus(code) {
  if (!code) return "modified";
  if (code === "??" || code.includes("A")) return "added";
  if (code.includes("D")) return "deleted";
  if (code.includes("R")) return "renamed";
  return "modified";
}

function classifyHighRisk(filePath, stats = {}, options = {}) {
  const threshold = Number.isFinite(options.highRiskLineThreshold)
    ? options.highRiskLineThreshold
    : DEFAULT_HIGH_RISK_LINE_THRESHOLD;
  const normalized = normalizePath(filePath);
  const basename = normalized.split("/").pop() || normalized;
  if (normalized.startsWith(HIGH_RISK_PATH_PREFIX) && HIGH_RISK_FILENAMES.has(basename)) return true;
  const netChange = Number(stats.additions || 0) + Number(stats.deletions || 0);
  return netChange >= threshold;
}

// Builds the deterministic changed-file inventory from a gitContext object,
// cross-referenced against `git status --porcelain` for status codes. When
// the supplied gitContext includes numstat data (real collectGitContext
// always does; see hasNumstatSupport), exact per-file additions/deletions
// come from `git diff --numstat`, which never truncates a long path or
// scales its counts the way --stat's bar graph does (Codex Spec 056 review
// round 2, P1-001). Callers that only supply `*DiffStat` fields (every
// pre-Spec-056-round-2 test fixture) fall back to the original --stat
// bar-character parsing unchanged.
function buildChangedFileInventory(gitContext = {}, options = {}) {
  const statusMap = parseStatusCodes(gitContext.statusPorcelain);
  const combined = new Map();
  if (hasNumstatSupport(gitContext)) {
    const numstatSources = [gitContext.committedDiffNumstat, gitContext.stagedDiffNumstat, gitContext.unstagedDiffNumstat];
    for (const source of numstatSources) {
      for (const entry of parseNumstat(source)) {
        const existing = combined.get(entry.path);
        if (existing) {
          existing.additions = Math.max(existing.additions, entry.additions);
          existing.deletions = Math.max(existing.deletions, entry.deletions);
        } else {
          combined.set(entry.path, { additions: entry.additions, deletions: entry.deletions });
        }
      }
    }
  } else {
    const statSources = [gitContext.committedDiffStat, gitContext.stagedDiffStat, gitContext.unstagedDiffStat];
    for (const source of statSources) {
      for (const entry of parseDiffStat(source)) {
        const existing = combined.get(entry.path);
        if (existing) {
          existing.additions = Math.max(existing.additions, entry.additions);
          existing.deletions = Math.max(existing.deletions, entry.deletions);
        } else {
          combined.set(entry.path, { additions: entry.additions, deletions: entry.deletions });
        }
      }
    }
  }
  for (const path of statusMap.keys()) {
    if (!combined.has(path)) combined.set(path, { additions: 0, deletions: 0 });
  }

  const inventory = [];
  for (const [filePath, stats] of combined) {
    const statusCode = statusMap.get(filePath) || "";
    inventory.push({
      path: filePath,
      status: describeStatus(statusCode),
      additions: stats.additions,
      deletions: stats.deletions,
      highRisk: classifyHighRisk(filePath, stats, options),
    });
  }
  inventory.sort((a, b) => a.path.localeCompare(b.path));
  return inventory;
}

function summarizeInventory(inventory) {
  const changedFilesTotal = inventory.length;
  const highRiskFilesTotal = inventory.filter((entry) => entry.highRisk).length;
  return { changedFilesTotal, highRiskFilesTotal };
}

// Deterministic-count verification (Spec 056 §14/§21): the Reviewer's
// self-reported changedFilesInspected/highRiskFilesInspected are only
// trusted up to the independently computed totals -- a claim of covering
// more files than actually changed, or fewer than the deterministic total,
// is not "complete" coverage.
function validateReviewCoverage(reportedCoverage, inventory) {
  const { changedFilesTotal, highRiskFilesTotal } = summarizeInventory(inventory);
  const reported = reportedCoverage || {};
  const changedFilesInspected = Math.min(Number(reported.changedFilesInspected) || 0, changedFilesTotal);
  const highRiskFilesInspected = Math.min(Number(reported.highRiskFilesInspected) || 0, highRiskFilesTotal);
  const coverageSufficient = changedFilesInspected >= changedFilesTotal && highRiskFilesInspected >= highRiskFilesTotal;
  return {
    changedFilesTotal,
    changedFilesInspected,
    highRiskFilesTotal,
    highRiskFilesInspected,
    checklistCompleted: Boolean(reported.checklistCompleted),
    stoppedEarly: Boolean(reported.stoppedEarly),
    coverageSufficient,
  };
}

// Review completeness is computed independent of the Markdown/structured
// `decision` (Spec 056 FR-010): a review can be a perfectly valid, complete
// `Changes Requested` or a perfectly valid, complete `Approved` -- and,
// symmetrically, an `Approved` decision with explicitly-reported
// insufficient coverage evidence is `incomplete`, never trusted at face
// value.
//
// Backward compatibility (spec.md FR-020, clarifications.md): `reviewCoverage`
// is a brand-new, additive field. Every pre-Spec-056 review this workflow
// already treats as fully valid -- a plain Markdown-only decision with no
// structured JSON at all (the original, still-supported format), or a
// structured review that adopted Spec 050's schema but not this feature's
// `reviewCoverage` extension -- has no way to report it and MUST NOT be
// retroactively downgraded to `incomplete` merely because the new evidence
// is absent. Only an *explicit* negative signal (a reported stop, an
// explicit `checklistCompleted: false`, or reported inspected counts that
// fall short of the deterministic inventory) gates completeness; absence of
// the field is silently treated as `complete`, exactly like every other
// additive Spec 053-055 field this codebase has shipped.
// A plain (non-destructured-with-defaults) options parameter, destructured
// inside the body: TypeScript's allowJs inference for a destructured
// parameter with a mix of defaulted/non-defaulted fields produces a narrow
// inferred type that excludes the non-defaulted fields, which then rejects
// every call site passing them from a strict .ts test file. Every function
// in this module follows this same shape for that reason.
function computeReviewCompleteness(options) {
  const opts = options || {};
  const structuredAnalysis = opts.structuredAnalysis;
  const inventory = opts.inventory;
  const timedOut = Boolean(opts.timedOut);
  const executionFailed = Boolean(opts.executionFailed);
  const interrupted = Boolean(opts.interrupted);
  if (timedOut || executionFailed || interrupted) {
    return { status: COMPLETENESS.INVALID, reason: "reviewer-execution-did-not-complete", coverage: null };
  }
  if (!structuredAnalysis || structuredAnalysis.status === "absent") {
    return { status: COMPLETENESS.COMPLETE, reason: null, coverage: null };
  }
  if (structuredAnalysis.status !== "valid") {
    return { status: COMPLETENESS.INVALID, reason: "structured-review-invalid-or-unsupported", coverage: null };
  }

  const reviewCoverage = structuredAnalysis.review && structuredAnalysis.review.reviewCoverage;
  if (!reviewCoverage) {
    return { status: COMPLETENESS.COMPLETE, reason: null, coverage: null };
  }

  const coverage = validateReviewCoverage(reviewCoverage, inventory || []);
  if (reviewCoverage.stoppedEarly === true) {
    return { status: COMPLETENESS.INCOMPLETE, reason: "reviewer-reported-stopping-early", coverage };
  }
  if (reviewCoverage.checklistCompleted === false) {
    return { status: COMPLETENESS.INCOMPLETE, reason: "checklist-not-completed", coverage };
  }
  if (!coverage.coverageSufficient) {
    return { status: COMPLETENESS.INCOMPLETE, reason: "changed-or-high-risk-file-coverage-insufficient", coverage };
  }
  return { status: COMPLETENESS.COMPLETE, reason: null, coverage };
}

function formatInventoryForPrompt(inventory) {
  if (!inventory.length) return "(no changed files detected)";
  return inventory.map((entry) => {
    const riskTag = entry.highRisk ? "HIGH-RISK" : "low-risk";
    return `- [${riskTag}] ${entry.status}: ${entry.path} (+${entry.additions}/-${entry.deletions})`;
  }).join("\n");
}

module.exports = {
  COMPLETENESS,
  DEFAULT_HIGH_RISK_LINE_THRESHOLD,
  HIGH_RISK_FILENAMES,
  buildChangedFileInventory,
  classifyHighRisk,
  computeReviewCompleteness,
  formatInventoryForPrompt,
  summarizeInventory,
  validateReviewCoverage,
};
