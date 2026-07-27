const { RUN_STATUSES } = require("./runSummarySchema.js");

const STATUS_LABELS = {
  [RUN_STATUSES.PLANNED]: "Planned (not started)",
  [RUN_STATUSES.RUNNING]: "Running",
  [RUN_STATUSES.BLOCKED]: "Blocked",
  [RUN_STATUSES.FAILED]: "Failed",
  [RUN_STATUSES.INTERRUPTED]: "Interrupted",
  [RUN_STATUSES.TIMED_OUT]: "Timed out",
  [RUN_STATUSES.COMPLETED]: "Completed",
  [RUN_STATUSES.AWAITING_HUMAN_DECISION]: "Awaiting human merge decision",
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "unknown";
}

const VALIDATION_STRATEGY_LABELS = {
  "focused-final-full": "Focused, then final full",
  "full-every-cycle": "Full validation every cycle",
};

const VALIDATION_STATUS_LABELS = {
  passed: "Passed",
  failed: "Failed",
  "timed-out": "Timed out",
  interrupted: "Interrupted",
  skipped: "Skipped",
  "not-run": "Not run",
};

function validationStrategyLabel(strategy) {
  return VALIDATION_STRATEGY_LABELS[strategy] || strategy || "unknown";
}

function validationStatusLabel(status) {
  return VALIDATION_STATUS_LABELS[status] || status || "unknown";
}

function formatTarget(target) {
  if (!target || !target.commit) return "unknown";
  return target.dirty ? `${target.commit} (dirty:${target.dirtyHash})` : target.commit;
}

function formatValue(value, fallback = "unknown") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatYesNo(value) {
  return value ? "Yes" : "No";
}

const CONVERGENCE_STATUS_LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  converged: "Converged",
  "budget-exhausted": "Budget exhausted",
  "incomplete-review": "Incomplete review",
  blocked: "Blocked",
};

function convergenceStatusLabel(status) {
  return CONVERGENCE_STATUS_LABELS[status] || status || "unknown";
}

function formatDurationMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function renderTable(headers, rows) {
  if (!rows.length) return undefined;
  const headerLine = `| ${headers.join(" | ")} |`;
  const dividerLine = `|${headers.map(() => "---").join("|")}|`;
  const rowLines = rows.map((row) => `| ${row.join(" | ")} |`);
  return [headerLine, dividerLine, ...rowLines].join("\n");
}

function renderRunSummaryMarkdown(summary) {
  const lines = [];
  lines.push("# Agent Workflow Run Summary");
  lines.push("");

  lines.push("## Outcome");
  lines.push("");
  lines.push(`- Status: ${statusLabel(summary.run.status)}`);
  if (summary.run.stopReason) lines.push(`- Stop reason: ${summary.run.stopReason}`);
  lines.push(`- Final review: ${formatValue(summary.review.finalDecision)}`);
  lines.push(`- Validation: ${formatValue(summary.validation.status)}`);
  lines.push(`- Exact reviewed commit: ${summary.review.exactReviewedCommitMatch === true ? "Yes" : (summary.review.exactReviewedCommitMatch === false ? "No" : "Unknown")}`);
  lines.push("");

  lines.push("## Roles");
  lines.push("");
  lines.push(`- Implementer: ${formatValue(summary.roles.implementer.displayName)} (\`${formatValue(summary.roles.implementer.agentId)}\`)`);
  lines.push(`- Reviewer: ${formatValue(summary.roles.reviewer.displayName)} (\`${formatValue(summary.roles.reviewer.agentId)}\`)`);
  lines.push(`- Resolution source: ${formatValue(summary.roles.source)}`);
  lines.push("");

  lines.push("## Run");
  lines.push("");
  lines.push(`- Feature: ${formatValue(summary.run.featureId)}`);
  lines.push(`- Run ID: ${formatValue(summary.run.runId)}`);
  lines.push(`- Started: ${formatValue(summary.run.startedAt)}`);
  lines.push(`- Completed: ${formatValue(summary.run.completedAt)}`);
  lines.push(`- Duration: ${summary.run.durationMs === null || summary.run.durationMs === undefined ? "unknown" : `${summary.run.durationMs}ms`}`);
  lines.push("");

  const stageTable = renderTable(
    ["Stage", "Role", "Agent", "Attempt", "Status", "Result"],
    summary.stageTimeline.map((entry) => [
      entry.stage,
      formatValue(entry.role, "-"),
      formatValue(entry.agentId, "-"),
      String(entry.attempt),
      entry.status,
      formatValue(entry.result, "-"),
    ]),
  );
  lines.push("## Stage timeline");
  lines.push("");
  lines.push(stageTable || "_No stages have run yet._");
  lines.push("");

  const validationTable = renderTable(
    ["Command", "Phase", "Status", "Exit code", "Duration"],
    summary.validation.commands.map((command) => [
      command.command || "(unknown)",
      formatValue(command.phase, "-"),
      command.status,
      command.exitCode === null ? "-" : String(command.exitCode),
      command.durationMs === null ? "-" : `${command.durationMs}ms`,
    ]),
  );
  lines.push("## Validation");
  lines.push("");
  // Never a bare "Validation: Passed" line unless the full phase specifically
  // passed -- summary.validation.status already mirrors the full phase only
  // (see runSummary.js buildValidationSummary), so this line is safe by
  // construction, not by a separate check here.
  lines.push(`- Strategy: ${validationStrategyLabel(summary.validation.strategy)}`);
  lines.push(`- Focused validation attempts: ${summary.validation.focused.attempts}`);
  lines.push(`- Focused result: ${validationStatusLabel(summary.validation.focused.status)}`);
  lines.push(`- Final full validation attempts: ${summary.validation.full.attempts}`);
  lines.push(`- Final full result: ${validationStatusLabel(summary.validation.full.status)}`);
  lines.push("");
  lines.push(validationTable || "_No validation commands recorded._");
  lines.push("");

  lines.push("## Review");
  lines.push("");
  lines.push(`- Decision: ${formatValue(summary.review.finalDecision)}`);
  lines.push(`- Structured review: ${formatValue(summary.review.structuredReviewStatus)}`);
  lines.push(`- Review attempts: ${summary.review.reviewAttempts}`);
  lines.push(`- Question cycles: ${summary.review.questionCycles}`);
  lines.push(`- Fix cycles: ${summary.review.fixCycles}`);
  lines.push("");

  lines.push("## Review Convergence");
  lines.push("");
  lines.push(`- Review attempts: ${summary.reviewConvergence.reviewAttempts}`);
  lines.push(`- First-review blocking findings: ${summary.reviewConvergence.firstReviewBlockingFindings}`);
  lines.push(`- New blocking findings after first review: ${summary.reviewConvergence.newBlockingFindingsAfterFirstReview}`);
  lines.push(`- Reopened findings: ${summary.reviewConvergence.reopenedFindings}`);
  lines.push(`- Automatic fix cycles: ${summary.reviewConvergence.automaticFixCycles}`);
  lines.push(`- Status: ${convergenceStatusLabel(summary.reviewConvergence.status)}`);
  lines.push("");

  lines.push("## Performance");
  lines.push("");
  lines.push(`- Reviewer time: ${formatDurationMs(summary.performance.reviewDurationMs)}`);
  lines.push(`- Focused validation time: ${formatDurationMs(summary.performance.focusedValidationDurationMs)}`);
  lines.push(`- Final full validation time: ${formatDurationMs(summary.performance.fullValidationDurationMs)}`);
  lines.push("");

  lines.push("## Findings");
  lines.push("");
  lines.push(`- Opened: ${summary.findings.opened}`);
  lines.push(`- Resolved: ${summary.findings.resolved}`);
  lines.push(`- Carried forward: ${summary.findings.carriedForward}`);
  lines.push(`- Remaining blocking: ${summary.findings.remainingBlocking}`);
  lines.push(`- Remaining non-blocking: ${summary.findings.remainingNonBlocking}`);
  lines.push("");

  lines.push("## Commit provenance");
  lines.push("");
  lines.push(`- Current branch head: ${formatValue(summary.commits.currentBranchHead)}`);
  lines.push(`- Implementation commit: ${formatValue(summary.commits.implementationCommit)}`);
  lines.push(`- Reviewed commit: ${formatValue(summary.commits.reviewedCommit)}`);
  lines.push(`- Reviewed target: ${formatTarget(summary.commits.reviewedTarget)}`);
  lines.push(`- Full validation target: ${formatTarget(summary.commits.fullValidationTarget)}`);
  lines.push(`- Exact match: ${summary.commits.exactCommitMatch === true ? "Yes" : (summary.commits.exactCommitMatch === false ? "No" : "Unknown")}`);
  lines.push("");

  lines.push("## Warnings");
  lines.push("");
  if (summary.warnings.length) {
    for (const warning of summary.warnings) lines.push(`- ${warning.code}: ${warning.message}`);
  } else {
    lines.push("- None");
  }
  lines.push("");

  lines.push("## Human decision");
  lines.push("");
  if (summary.humanGate.state === "ready-for-merge-decision") {
    lines.push("Ready for human merge decision.");
  } else if (!summary.humanGate.required) {
    lines.push("No human decision is pending yet.");
  } else {
    lines.push("Not ready for a human merge decision.");
  }
  lines.push("");
  lines.push("No push, PR creation, PR approval, or merge was performed automatically.");
  lines.push("");

  lines.push("## Detailed artifacts");
  lines.push("");
  if (summary.artifacts.length) {
    for (const artifactPath of summary.artifacts) lines.push(`- ${artifactPath}`);
  } else {
    lines.push("- None recorded.");
  }

  return `${lines.join("\n")}\n`;
}

module.exports = {
  renderRunSummaryMarkdown,
};
