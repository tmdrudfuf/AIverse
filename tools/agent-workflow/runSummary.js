const fs = require("fs");
const path = require("path");

const { getRunDirectory } = require("./agentWorkflow.js");
const {
  SCHEMA_VERSION,
  RUN_STATUSES,
  STOP_REASONS,
  VALIDATION_STATUSES,
  HUMAN_GATE_STATES,
} = require("./runSummarySchema.js");

function getOrchestration(state) {
  return state && state.orchestration && typeof state.orchestration === "object" ? state.orchestration : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function readJsonArtifactSafe(cwd, relativeFilePath, warnings) {
  if (!relativeFilePath) return undefined;
  try {
    const fullPath = path.resolve(cwd, relativeFilePath);
    return JSON.parse(fs.readFileSync(fullPath, "utf8").replace(new RegExp("^\\uFEFF"), ""));
  } catch (error) {
    warnings.push({
      code: "missing-or-malformed-artifact",
      message: `Could not read ${relativeFilePath}: ${error.message}`,
    });
    return undefined;
  }
}

// --- Roles -----------------------------------------------------------------

function buildRoles(state) {
  const orchestration = getOrchestration(state);
  const implementerId = orchestration.resolvedImplementerId
    || (state.latestResolvedRoles && state.latestResolvedRoles.implementer)
    || orchestration.implementerId
    || null;
  const reviewerId = orchestration.resolvedReviewerId
    || (state.latestResolvedRoles && state.latestResolvedRoles.reviewer)
    || orchestration.reviewerId
    || null;
  const source = orchestration.roleResolutionSource
    || state.latestRoleResolutionSource
    || (implementerId || reviewerId ? "unknown" : null);

  return {
    implementer: {
      agentId: implementerId,
      displayName: orchestration.implementerIdentity || implementerId || null,
    },
    reviewer: {
      agentId: reviewerId,
      displayName: orchestration.reviewerIdentity || reviewerId || null,
    },
    source,
  };
}

// --- Stage timeline ----------------------------------------------------------
//
// Reconstructed by replaying the same fixed stage-transition rules
// `orchestrateCommand.js#nextStageAfterCompleted` already encodes, driven
// entirely by the *outcome*/`status` fields already recorded in
// `state.orchestrationRuns`/`state.reviewRuns`/`state.validationRuns`. This
// needs no timestamps (none of these records carry one uniformly) and can
// never disagree with what the orchestrator actually did, since it only
// consumes records the orchestrator itself already wrote, in the order it
// wrote them.

const VALIDATION_STAGES = new Set(["validate", "revalidate", "final-verification"]);

function roleForStage(stage) {
  if (stage === "review" || stage === "re-review" || stage === "final-review") return "reviewer";
  if (VALIDATION_STAGES.has(stage)) return null;
  return "implementer";
}

function buildStageTimeline(state, roles) {
  const orchestrationRuns = asArray(state.orchestrationRuns);
  const reviewRuns = asArray(state.reviewRuns);
  const validationRuns = asArray(state.validationRuns);

  const queues = {
    implement: orchestrationRuns.filter((r) => r.stage === "implement").slice(),
    fix: orchestrationRuns.filter((r) => r.stage === "fix").slice(),
    "answer-questions": orchestrationRuns.filter((r) => r.stage === "answer-questions").slice(),
    validate: validationRuns.filter((r) => r.stage === "validate").slice(),
    revalidate: validationRuns.filter((r) => r.stage === "revalidate").slice(),
    "final-verification": validationRuns.filter((r) => r.stage === "final-verification").slice(),
    review: reviewRuns.filter((r) => (r.stage || "review") === "review").slice(),
    "re-review": reviewRuns.filter((r) => r.stage === "re-review").slice(),
    "final-review": reviewRuns.filter((r) => r.stage === "final-review").slice(),
  };

  const attemptCounts = {};
  const timeline = [];

  function consume(stage) {
    const queue = queues[stage];
    return queue && queue.length ? queue.shift() : undefined;
  }

  function push(stage, record, extra = {}) {
    attemptCounts[stage] = (attemptCounts[stage] || 0) + 1;
    const artifactPaths = [];
    if (record) {
      // orchestrationRuns/validationRuns records use `path`; reviewRuns records
      // use `executionPath` for the same purpose (no shared field name).
      if (record.path) artifactPaths.push(record.path);
      if (record.executionPath) artifactPaths.push(record.executionPath);
      if (record.resultPath) artifactPaths.push(record.resultPath);
      if (record.structuredReviewPath) artifactPaths.push(record.structuredReviewPath);
    }
    timeline.push({
      stage,
      role: roleForStage(stage),
      agentId: (roles && roles[roleForStage(stage)] && roles[roleForStage(stage)].agentId) || null,
      status: extra.status || "unknown",
      attempt: attemptCounts[stage],
      artifactPaths,
      result: extra.result !== undefined ? extra.result : null,
    });
  }

  let record = consume("implement");
  if (!record) return timeline;
  push("implement", record, { status: record.status === "completed" ? "completed" : "failed" });
  if (record.status !== "completed") return timeline;

  record = consume("validate");
  if (!record) return timeline;
  push("validate", record, { status: record.status });
  if (record.status !== "passed") return timeline;

  let reviewStageName = "review";
  for (let guard = 0; guard < 50; guard += 1) {
    const reviewRecord = consume(reviewStageName);
    if (!reviewRecord) break;
    push(reviewStageName, reviewRecord, { status: "completed", result: reviewRecord.outcome || null });

    if (reviewRecord.outcome === "Questions") {
      const answerRecord = consume("answer-questions");
      if (!answerRecord) break;
      push("answer-questions", answerRecord, { status: answerRecord.status === "completed" ? "completed" : "failed" });
      if (answerRecord.status !== "completed") break;
      reviewStageName = "final-review";
      continue;
    }

    if (reviewRecord.outcome === "Approved") {
      const finalVerificationRecord = consume("final-verification");
      if (finalVerificationRecord) push("final-verification", finalVerificationRecord, { status: finalVerificationRecord.status });
      break;
    }

    if (reviewRecord.outcome === "Changes Requested") {
      const fixRecord = consume("fix");
      if (!fixRecord) break;
      push("fix", fixRecord, { status: fixRecord.status === "completed" ? "completed" : "failed" });
      if (fixRecord.status !== "completed") break;
      const revalidateRecord = consume("revalidate");
      if (!revalidateRecord) break;
      push("revalidate", revalidateRecord, { status: revalidateRecord.status });
      if (revalidateRecord.status !== "passed") break;
      reviewStageName = "re-review";
      continue;
    }

    // Unknown / Timed Out / Execution Failed -> terminal; nothing further ran.
    break;
  }

  return timeline;
}

// --- Validation summary ------------------------------------------------------

function buildValidationSummary(state) {
  const orchestration = getOrchestration(state);
  const validationRuns = asArray(state.validationRuns);
  const commands = validationRuns.map((record) => ({
    stage: record.stage || "unknown",
    command: record.command || "",
    status: record.status || VALIDATION_STATUSES.NOT_RUN,
    exitCode: typeof record.exitCode === "number" ? record.exitCode : null,
    durationMs: typeof record.durationMs === "number" ? record.durationMs : null,
    artifactPath: record.path || null,
  }));

  let status;
  if (validationRuns.length) {
    // The most recent validation attempt reflects the run's current validation
    // state: a failure/timeout/interruption immediately blocks the run (no
    // further validation attempts follow it in this architecture), and a run
    // that reaches human-merge-decision always has its last attempt "passed"
    // (final-verification). Earlier failed-then-fixed-then-passed cycles are
    // a normal part of the fix loop, not a reason to report overall failure.
    status = validationRuns[validationRuns.length - 1].status || VALIDATION_STATUSES.NOT_RUN;
  } else if (orchestration.validationSkipped) {
    status = VALIDATION_STATUSES.SKIPPED;
  } else {
    status = VALIDATION_STATUSES.NOT_RUN;
  }

  return { status, commands };
}

// --- Review summary -----------------------------------------------------------

function buildReviewSummary(state) {
  const reviewRuns = asArray(state.reviewRuns);
  const last = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
  const orchestration = getOrchestration(state);
  const blockingCount = asArray(orchestration.activeBlockingFindings).length;
  const findingHistory = asArray(getFindingHistory(state));
  const nonBlockingOpenCount = findingHistory.filter((entry) => entry.kind === "non_blocking" && entry.currentStatus !== "resolved").length;

  return {
    finalDecision: last ? last.outcome : (state.latestReviewDecision || "Unknown"),
    structuredReviewStatus: last ? last.structuredReviewStatus : (state.latestStructuredReviewStatus || "absent"),
    reviewerAgentId: last ? last.reviewerId : (orchestration.reviewerId || null),
    reviewAttempts: reviewRuns.length,
    questionCycles: Number(state.questionCycle || orchestration.questionCycle || 0),
    fixCycles: Number(state.fixCycleCount || orchestration.fixCycleCount || 0),
    blockingFindingCount: blockingCount,
    nonBlockingFindingCount: nonBlockingOpenCount,
    exactReviewedCommitMatch: "unknown",
  };
}

// --- Findings -------------------------------------------------------------

function getFindingHistory(state) {
  const orchestration = getOrchestration(state);
  if (Array.isArray(state.findingHistory)) return state.findingHistory;
  if (Array.isArray(orchestration.findingHistory)) return orchestration.findingHistory;
  return [];
}

function buildFindingsSummary(state) {
  const history = asArray(getFindingHistory(state));
  const items = history.map((entry) => ({
    findingId: entry.findingId,
    severity: entry.severity || null,
    summary: entry.summary || null,
    kind: entry.kind || null,
    status: entry.currentStatus || "unknown",
    openedReviewAttempt: entry.firstSeenReviewSequence ?? null,
    resolvedReviewAttempt: entry.resolvedReviewSequence ?? null,
    artifactPaths: [entry.latestReviewArtifactPath, entry.latestStructuredReviewPath].filter(Boolean),
  }));

  const resolved = history.filter((entry) => entry.currentStatus === "resolved").length;
  const carriedForward = history.filter((entry) => entry.currentStatus === "still_open").length;
  const remainingBlocking = history.filter((entry) => entry.kind === "blocking" && entry.currentStatus !== "resolved").length;
  const remainingNonBlocking = history.filter((entry) => entry.kind === "non_blocking" && entry.currentStatus !== "resolved").length;

  return {
    opened: history.length,
    resolved,
    carriedForward,
    remainingBlocking,
    remainingNonBlocking,
    items,
  };
}

// --- Run status / stop reason -------------------------------------------------

function statusFromRecordFlags(record) {
  if (!record) return undefined;
  if (record.timedOut) return RUN_STATUSES.TIMED_OUT;
  if (record.interrupted || record.signal) return RUN_STATUSES.INTERRUPTED;
  return undefined;
}

function computeStatusAndStopReason(state, cwd, warnings) {
  const orchestration = getOrchestration(state);
  const currentStage = orchestration.currentStage;

  if (!orchestration.startedAt) {
    return { status: RUN_STATUSES.PLANNED, stopReason: null };
  }

  if (currentStage === "human-merge-decision") {
    return { status: RUN_STATUSES.AWAITING_HUMAN_DECISION, stopReason: null };
  }

  if (currentStage !== "blocked") {
    // Still in progress (not reachable from a single synchronous
    // runOrchestration invocation today, but tolerated defensively).
    return { status: RUN_STATUSES.RUNNING, stopReason: null };
  }

  const validationRuns = asArray(state.validationRuns);
  const lastValidation = validationRuns.length ? validationRuns[validationRuns.length - 1] : undefined;
  const latestReviewDecision = state.latestReviewDecision;
  const reason = orchestration.reason || "";

  if (lastValidation && lastValidation.status !== "passed") {
    if (lastValidation.status === "timed-out") return { status: RUN_STATUSES.TIMED_OUT, stopReason: STOP_REASONS.TIMEOUT };
    if (lastValidation.status === "interrupted") return { status: RUN_STATUSES.INTERRUPTED, stopReason: STOP_REASONS.INTERRUPTED };
    return { status: RUN_STATUSES.FAILED, stopReason: STOP_REASONS.VALIDATION_FAILED };
  }

  if (latestReviewDecision === "Timed Out") {
    return { status: RUN_STATUSES.TIMED_OUT, stopReason: STOP_REASONS.TIMEOUT };
  }
  if (latestReviewDecision === "Unknown") {
    return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.REVIEW_DECISION_UNKNOWN };
  }
  if (latestReviewDecision === "Execution Failed") {
    const reviewRuns = asArray(state.reviewRuns);
    const lastReview = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
    const executionRecord = lastReview ? readJsonArtifactSafe(cwd, lastReview.executionPath, warnings) : undefined;
    const refined = statusFromRecordFlags(executionRecord);
    return { status: refined || RUN_STATUSES.BLOCKED, stopReason: refined === RUN_STATUSES.TIMED_OUT ? STOP_REASONS.TIMEOUT : (refined === RUN_STATUSES.INTERRUPTED ? STOP_REASONS.INTERRUPTED : STOP_REASONS.COMMAND_FAILED) };
  }

  if (/^Maximum fix cycles reached/.test(reason)) return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.CHANGES_REQUESTED_LIMIT_REACHED };
  if (/^Maximum question cycles reached/.test(reason) || /asked questions after the allowed clarification round/.test(reason)) {
    return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.REVIEWER_QUESTIONS_UNRESOLVED };
  }
  if (/^(validate|revalidate|final-verification) failed:/.test(reason)) return { status: RUN_STATUSES.FAILED, stopReason: STOP_REASONS.VALIDATION_FAILED };
  if (/questions were invalid|Finding lifecycle invalid|without actionable findings|answers were invalid/.test(reason)) {
    return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.STRUCTURED_REVIEW_INVALID };
  }
  if (/Branch changed from|Unsupported orchestration stage|modified repository files/.test(reason)) {
    return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.STATE_INVALID };
  }
  if (/execution failed$/.test(reason) || /produced no repository diff$/.test(reason)) {
    const orchestrationRuns = asArray(state.orchestrationRuns);
    const lastRun = orchestrationRuns.length ? orchestrationRuns[orchestrationRuns.length - 1] : undefined;
    const executionRecord = lastRun ? readJsonArtifactSafe(cwd, lastRun.path, warnings) : undefined;
    const refined = statusFromRecordFlags(executionRecord);
    return { status: refined || RUN_STATUSES.BLOCKED, stopReason: refined === RUN_STATUSES.TIMED_OUT ? STOP_REASONS.TIMEOUT : (refined === RUN_STATUSES.INTERRUPTED ? STOP_REASONS.INTERRUPTED : STOP_REASONS.COMMAND_FAILED) };
  }

  return { status: RUN_STATUSES.BLOCKED, stopReason: STOP_REASONS.MANUAL_STOP };
}

// --- Human gate -----------------------------------------------------------

function buildHumanGate(status, review, validation, findings) {
  if (status === RUN_STATUSES.PLANNED) {
    return { required: false, action: null, ready: false, state: HUMAN_GATE_STATES.NOT_READY };
  }
  if (status !== RUN_STATUSES.AWAITING_HUMAN_DECISION) {
    return { required: true, action: null, ready: false, state: HUMAN_GATE_STATES.NOT_READY };
  }
  // "absent" (no structured review block at all) is legitimate Markdown-only
  // Approved compatibility (Spec 050); only "invalid" (malformed structured
  // data) blocks readiness -- never reinterpret malformed data as approval.
  const ready = review.finalDecision === "Approved"
    && review.structuredReviewStatus !== "invalid"
    && validation.status === VALIDATION_STATUSES.PASSED
    && findings.remainingBlocking === 0;
  return {
    required: true,
    action: "merge-decision",
    ready,
    state: ready ? HUMAN_GATE_STATES.READY_FOR_MERGE_DECISION : HUMAN_GATE_STATES.NOT_READY,
  };
}

// --- Artifacts / warnings ---------------------------------------------------

function buildArtifactIndex(stageTimeline) {
  const paths = [];
  for (const entry of stageTimeline) {
    for (const artifactPath of entry.artifactPaths) {
      if (!paths.includes(artifactPath)) paths.push(artifactPath);
    }
  }
  return paths;
}

// --- Public: buildRunSummary --------------------------------------------------

function buildRunSummary(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const warnings = [];
  const orchestration = getOrchestration(state);

  const { status, stopReason } = computeStatusAndStopReason(state, cwd, warnings);
  const roles = buildRoles(state);
  const stageTimeline = buildStageTimeline(state, roles);
  const validation = buildValidationSummary(state);
  const review = buildReviewSummary(state);
  const findings = buildFindingsSummary(state);
  const humanGate = buildHumanGate(status, review, validation, findings);

  const startedAt = orchestration.startedAt || null;
  const completedAt = (status === RUN_STATUSES.AWAITING_HUMAN_DECISION || status === RUN_STATUSES.BLOCKED || status === RUN_STATUSES.FAILED || status === RUN_STATUSES.TIMED_OUT || status === RUN_STATUSES.INTERRUPTED)
    ? (orchestration.updatedAt || null)
    : null;
  const durationMs = startedAt && completedAt ? (new Date(completedAt).getTime() - new Date(startedAt).getTime()) : null;

  return {
    schemaVersion: SCHEMA_VERSION,
    run: {
      runId: startedAt ? `run-${startedAt}` : null,
      featureId: state.featureId || "unknown-feature",
      status,
      stopReason,
      startedAt,
      completedAt,
      durationMs: Number.isFinite(durationMs) ? durationMs : null,
    },
    roles,
    execution: {
      stagesAttempted: stageTimeline.map((entry) => entry.stage),
      stagesCompleted: stageTimeline.filter((entry) => entry.status === "completed" || entry.status === "passed").map((entry) => entry.stage),
      currentStage: orchestration.currentStage || null,
    },
    stageTimeline,
    validation,
    review,
    findings,
    commits: {
      implementationCommit: null,
      reviewedCommit: null,
      currentBranchHead: options.currentBranchHead || null,
      exactCommitMatch: "unknown",
    },
    humanGate,
    artifacts: buildArtifactIndex(stageTimeline),
    warnings,
  };
}

// --- Public: refreshRunSummary (the only filesystem-touching function) --------

function atomicWriteFileSafe(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(tempPath, content, "utf8");
  fs.renameSync(tempPath, filePath);
}

function refreshRunSummary({ state, cwd, currentBranchHead } = {}) {
  const resolvedCwd = cwd || process.cwd();
  try {
    const summary = buildRunSummary(state, { cwd: resolvedCwd, currentBranchHead });
    const runDirectory = getRunDirectory(state, { cwd: resolvedCwd });
    const jsonPath = path.join(runDirectory, "run-summary.json");
    const markdownPath = path.join(runDirectory, "run-summary.md");
    // Renderer is required lazily to avoid a require-cycle at module load time
    // (runSummaryRenderer.js has no dependency back on this module, but this
    // keeps the dependency direction explicit and load order irrelevant).
    const { renderRunSummaryMarkdown } = require("./runSummaryRenderer.js");
    const markdown = renderRunSummaryMarkdown(summary);
    atomicWriteFileSafe(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
    atomicWriteFileSafe(markdownPath, markdown.endsWith("\n") ? markdown : `${markdown}\n`);
    return {
      ok: true,
      summary,
      jsonPath: path.relative(resolvedCwd, jsonPath).replace(/\\/g, "/"),
      markdownPath: path.relative(resolvedCwd, markdownPath).replace(/\\/g, "/"),
      warning: null,
    };
  } catch (error) {
    return { ok: false, summary: null, jsonPath: null, markdownPath: null, warning: error.message };
  }
}

module.exports = {
  buildRunSummary,
  refreshRunSummary,
};
