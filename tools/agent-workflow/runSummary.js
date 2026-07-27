const fs = require("fs");
const path = require("path");

const { getRunDirectory } = require("./agentWorkflow.js");
const {
  SCHEMA_VERSION,
  RUN_STATUSES,
  STOP_REASONS,
  VALIDATION_STATUSES,
  HUMAN_GATE_STATES,
  normalizeValidationStatus,
  normalizeStopReason,
} = require("./runSummarySchema.js");
const { DEFAULT_VALIDATION_STRATEGY, targetsMatch } = require("./validationPolicy.js");
const { isFullPhaseRecord, isFocusedPhaseRecord } = require("./validationPhase.js");
const { isFinalValidationSatisfied } = require("./validationPlan.js");
const { computeConvergenceStatus } = require("./reviewConvergence.js");
const { buildPerformanceSummary } = require("./performanceMetrics.js");
const { REVIEW_CONVERGENCE_FAILED_STOP_REASON } = require("./reviewBudget.js");

function getOrchestration(state) {
  return state && state.orchestration && typeof state.orchestration === "object" ? state.orchestration : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

// Persisted records store paths relative to the repository cwd (via
// agentWorkflow.js/orchestrateCommand.js's `relativePath(cwd, fullPath)`).
// The summary schema requires run-directory-relative paths, so normalize
// before they ever reach the summary model.
function toRunRelativePath(cwd, state, repoRelativePath, options, warnings) {
  if (!repoRelativePath) return undefined;
  const runDirectory = getRunDirectory(state, { ...options, cwd });
  const absolutePath = path.resolve(cwd, repoRelativePath);
  // path.relative() escapes the run directory as either a "../"-prefixed
  // path (same drive) or -- on Windows, when the two paths are on different
  // drives -- an unchanged absolute (drive-qualified) path with no relative
  // form at all. Both must be rejected; neither is a valid run-directory-
  // relative path.
  const rawRelative = path.relative(runDirectory, absolutePath);
  const escapesRunDirectory = rawRelative === ".." || rawRelative.startsWith(`..${path.sep}`) || path.isAbsolute(rawRelative);
  if (escapesRunDirectory) {
    if (warnings) {
      warnings.push({
        code: "artifact-path-outside-run-directory",
        message: `Referenced artifact path resolves outside the run directory and was omitted: ${repoRelativePath}`,
      });
    }
    return undefined;
  }
  return rawRelative.replace(/\\/g, "/");
}

// Shared existence check reused everywhere a repo-relative artifact path
// enters the summary model (stage timeline, findings, validation commands),
// so "missing artifact" is warned on consistently rather than only for the
// paths a given call site happened to check.
function checkArtifactExists(cwd, repoRelativePath, warnings) {
  if (!repoRelativePath) return true;
  if (fs.existsSync(path.resolve(cwd, repoRelativePath))) return true;
  warnings.push({
    code: "missing-or-malformed-artifact",
    message: `Could not find ${repoRelativePath}: referenced artifact is missing.`,
  });
  return false;
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
  if (VALIDATION_STAGES.has(stage) || stage === "unknown") return null;
  return "implementer";
}

function buildStageTimeline(state, roles, cwd, options, warnings) {
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
    review: reviewRuns.filter((r) => r.stage === "review").slice(),
    "re-review": reviewRuns.filter((r) => r.stage === "re-review").slice(),
    "final-review": reviewRuns.filter((r) => r.stage === "final-review").slice(),
  };
  // Pre-Spec-054 reviewRuns entries have no `stage` field at all. Rather than
  // guessing which review stage produced them, report them as their own
  // `unknown` stage so backward-compat data is visible without being
  // misattributed to "review".
  const legacyUnstagedReviews = reviewRuns.filter((r) => !r.stage).slice();

  const attemptCounts = {};
  const timeline = [];

  function consume(stage) {
    const queue = queues[stage];
    return queue && queue.length ? queue.shift() : undefined;
  }

  // A single validate/revalidate/final-verification *stage occurrence* can
  // produce multiple validationRuns records (one per configured command --
  // see runValidationCommands in orchestrateCommand.js). Consume every
  // record belonging to that occurrence, using the explicit `batchId`
  // orchestrateCommand.js stamps on every record from one call (grouping by
  // identity, not by outcome, is the only way to correctly separate two
  // fully-passing occurrences of the same named stage -- e.g. two successful
  // revalidate cycles -- which share no other distinguishing signal). Legacy
  // records predating this field (`batchId` undefined) fall back to draining
  // up to and including the first non-"passed" record, the best inference
  // available without it.
  function consumeValidationBatch(stage) {
    const queue = queues[stage];
    if (!queue || !queue.length) return undefined;
    const batch = [];
    const firstBatchId = queue[0].batchId;
    if (firstBatchId !== undefined && firstBatchId !== null) {
      while (queue.length && queue[0].batchId === firstBatchId) {
        batch.push(queue.shift());
      }
      return batch;
    }
    while (queue.length) {
      const record = queue.shift();
      batch.push(record);
      if (record.status !== "passed") break;
    }
    return batch;
  }

  function push(stage, record, extra = {}) {
    attemptCounts[stage] = (attemptCounts[stage] || 0) + 1;
    const artifactPaths = [];
    if (record) {
      // orchestrationRuns/validationRuns records use `path`; reviewRuns records
      // use `executionPath` for the same purpose (no shared field name). Paths
      // are persisted repo-relative; normalize to run-directory-relative here.
      const rawPaths = [record.path, record.executionPath, record.resultPath, record.structuredReviewPath].filter(Boolean);
      for (const rawPath of rawPaths) {
        checkArtifactExists(cwd, rawPath, warnings);
        const normalized = toRunRelativePath(cwd, state, rawPath, options, warnings);
        if (normalized) artifactPaths.push(normalized);
      }
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

  function pushValidationBatch(stage, batch) {
    attemptCounts[stage] = (attemptCounts[stage] || 0) + 1;
    const artifactPaths = [];
    for (const record of batch) {
      if (!record.path) continue;
      const normalized = toRunRelativePath(cwd, state, record.path, options, warnings);
      if (normalized) artifactPaths.push(normalized);
    }
    const lastRecord = batch[batch.length - 1];
    timeline.push({
      stage,
      role: roleForStage(stage),
      agentId: null,
      status: lastRecord.status || "unknown",
      attempt: attemptCounts[stage],
      artifactPaths,
      result: null,
    });
  }

  // Always appends any legacy (pre-Spec-054, stage-less) reviewRuns entries
  // before returning, regardless of which exit path below is taken -- so
  // that persisted review evidence is never silently dropped just because
  // the implement/validate reconstruction couldn't start or continue.
  function finalize() {
    for (const legacyRecord of legacyUnstagedReviews) {
      push("unknown", legacyRecord, { status: "unknown", result: legacyRecord.outcome || null });
    }
    // Safety net for partial/corrupted state (e.g. staged validate/review
    // records exist but no leading implement record, so the chronology
    // reconstruction above never started or stopped early): every durable
    // persisted record must appear in the timeline somewhere. Anything left
    // in any queue at this point could not be placed in its reconstructed
    // chronological position, so append it out of sequence with a warning
    // rather than silently dropping evidence that summary.review/validation
    // (which read the full arrays directly, not through this replay) still
    // report as having happened.
    const reviewStageNames = new Set(["review", "re-review", "final-review"]);
    for (const stageName of Object.keys(queues)) {
      if (VALIDATION_STAGES.has(stageName)) {
        let leftoverBatch = consumeValidationBatch(stageName);
        while (leftoverBatch) {
          pushValidationBatch(stageName, leftoverBatch);
          warnings.push({
            code: "unreconciled-stage-record",
            message: `Persisted ${stageName} record(s) could not be placed in their expected chronological position and were appended out of sequence.`,
          });
          leftoverBatch = consumeValidationBatch(stageName);
        }
        continue;
      }
      const queue = queues[stageName];
      while (queue && queue.length) {
        const leftover = queue.shift();
        if (reviewStageNames.has(stageName)) {
          push(stageName, leftover, { status: "completed", result: leftover.outcome || null });
        } else {
          push(stageName, leftover, { status: leftover.status === "completed" ? "completed" : "failed" });
        }
        warnings.push({
          code: "unreconciled-stage-record",
          message: `A persisted ${stageName} record could not be placed in its expected chronological position and was appended out of sequence.`,
        });
      }
    }
    return timeline;
  }

  const record = consume("implement");
  if (!record) return finalize();
  push("implement", record, { status: record.status === "completed" ? "completed" : "failed" });
  if (record.status !== "completed") return finalize();

  const validateBatch = consumeValidationBatch("validate");
  if (!validateBatch) return finalize();
  pushValidationBatch("validate", validateBatch);
  if (validateBatch[validateBatch.length - 1].status !== "passed") return finalize();

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
      const finalVerificationBatch = consumeValidationBatch("final-verification");
      if (finalVerificationBatch) pushValidationBatch("final-verification", finalVerificationBatch);
      break;
    }

    if (reviewRecord.outcome === "Changes Requested") {
      const fixRecord = consume("fix");
      if (!fixRecord) break;
      push("fix", fixRecord, { status: fixRecord.status === "completed" ? "completed" : "failed" });
      if (fixRecord.status !== "completed") break;
      const revalidateBatch = consumeValidationBatch("revalidate");
      if (!revalidateBatch) break;
      pushValidationBatch("revalidate", revalidateBatch);
      if (revalidateBatch[revalidateBatch.length - 1].status !== "passed") break;
      reviewStageName = "re-review";
      continue;
    }

    // Unknown / Timed Out / Execution Failed -> terminal; nothing further ran.
    break;
  }

  return finalize();
}

// --- Secret redaction --------------------------------------------------------
//
// Configured validation command text is user-controlled and may contain
// inline secret-bearing environment assignments or recognizable token
// values (FR-019: never copy secrets into the summary). This is a
// best-effort textual redaction, not a guarantee that no secret can ever
// leak through an unrecognized format.

// Value alternation tries a double-quoted, then single-quoted, then bare
// non-whitespace token, in that order -- a bare \S+ alone would stop at the
// first space inside "API_SECRET=\"top secret value\"", leaving everything
// after the first word of a quoted value unredacted.
const SECRET_ASSIGNMENT_PATTERN = /\b([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD|PASSWD|PASS|CREDENTIAL|AUTH)[A-Za-z0-9_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi;
const SECRET_VALUE_PATTERNS = [
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgho_[A-Za-z0-9]{20,}\b/g,
  /\bghs_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}\b/gi,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
];

function redactSecretsFromText(text) {
  if (!text) return text;
  let redacted = String(text).replace(SECRET_ASSIGNMENT_PATTERN, (match, name) => `${name}=***REDACTED***`);
  for (const pattern of SECRET_VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, "***REDACTED***");
  }
  return redacted;
}

// --- Validation summary ------------------------------------------------------

// validationRuns records from one runValidationCommands call share a single
// monotonically increasing batchId (Spec 054 round 9); since batchId only
// ever increases, counting distinct values (rather than replaying the
// consumeValidationBatch heuristic buildStageTimeline needs) is sufficient
// and correct here. Legacy records predating batchId (none expected in
// practice, but never assumed) each count as their own attempt.
function countPhaseAttempts(records) {
  const batchIds = new Set();
  let legacyCount = 0;
  for (const record of records) {
    if (record.batchId !== undefined && record.batchId !== null) {
      batchIds.add(record.batchId);
    } else {
      legacyCount += 1;
    }
  }
  return batchIds.size + legacyCount;
}

function buildValidationSummary(state, cwd, options, warnings) {
  const orchestration = getOrchestration(state);
  const validationRuns = asArray(state.validationRuns);
  const commands = validationRuns.map((record) => {
    checkArtifactExists(cwd, record.path, warnings);
    const artifactPath = toRunRelativePath(cwd, state, record.path, options, warnings);
    return {
      stage: record.stage || "unknown",
      phase: isFullPhaseRecord(record) ? "full" : "focused",
      command: redactSecretsFromText(record.command || ""),
      status: normalizeValidationStatus(record.status),
      exitCode: typeof record.exitCode === "number" ? record.exitCode : null,
      durationMs: typeof record.durationMs === "number" ? record.durationMs : null,
      artifactPath: artifactPath || null,
    };
  });

  // A record with no `phase` field predates Spec 055 (every occurrence was
  // uniformly "full" then), so isFullPhaseRecord already buckets it as full;
  // this preserves Spec 054's exact aggregate-status behavior for old data.
  const focusedRecords = validationRuns.filter((record) => isFocusedPhaseRecord(record));
  const fullRecords = validationRuns.filter((record) => isFullPhaseRecord(record));

  // orchestration.validationSkipped is freshly (re)set on every
  // runValidationCommands call to reflect only the current occurrence (see
  // orchestrateCommand.js): an explicit skip on the run's latest
  // validation-stage occurrence must not be masked by an earlier, unrelated
  // occurrence's stale "passed"/"failed" record, for the aggregate status or
  // either phase breakdown.
  let full;
  let status;
  if (orchestration.validationSkipped) {
    status = VALIDATION_STATUSES.SKIPPED;
    full = { status: VALIDATION_STATUSES.SKIPPED, attempts: countPhaseAttempts(fullRecords) };
  } else if (fullRecords.length) {
    // The aggregate `status` mirrors the full phase's status, never the
    // focused phase's (Architecture Decision 5): a focused-only pass must
    // never be reported as aggregate "passed" -- that is exactly the
    // false-success failure mode this feature exists to prevent.
    const fullStatus = normalizeValidationStatus(fullRecords[fullRecords.length - 1].status);
    full = { status: fullStatus, attempts: countPhaseAttempts(fullRecords) };
    status = fullStatus;
  } else {
    full = { status: VALIDATION_STATUSES.NOT_RUN, attempts: 0 };
    status = VALIDATION_STATUSES.NOT_RUN;
  }

  const focused = {
    status: orchestration.validationSkipped
      ? VALIDATION_STATUSES.SKIPPED
      : (focusedRecords.length ? normalizeValidationStatus(focusedRecords[focusedRecords.length - 1].status) : VALIDATION_STATUSES.NOT_RUN),
    attempts: countPhaseAttempts(focusedRecords),
  };

  // orchestration.effectiveValidationStrategy (persisted by runValidationCommands
  // every time validation actually runs) reflects what was really resolved for
  // this invocation, including a CLI-only --validation-strategy override that
  // was never written into state.validationPolicy; only fall back to reading
  // state.validationPolicy.strategy directly for states where validation has
  // not run yet (e.g. dry-run preview construction, or a brand-new state).
  const strategy = orchestration.effectiveValidationStrategy
    || (state.validationPolicy && state.validationPolicy.strategy)
    || DEFAULT_VALIDATION_STRATEGY;

  return {
    status,
    strategy,
    commands,
    focused,
    full,
    finalReadinessSatisfied: isFinalValidationSatisfied(state).satisfied,
  };
}

// --- Review summary -----------------------------------------------------------

function buildReviewSummary(state, exactReviewedCommitMatch) {
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
    // Mirrors commits.exactCommitMatch (computed once, from the same
    // reviewed/full-validation targets) rather than a second, independently
    // maintained "unknown" placeholder -- the two must never disagree.
    exactReviewedCommitMatch: exactReviewedCommitMatch,
    // Spec 056 Part B: additive. A record predating this feature has no
    // completenessStatus at all -- defaulting to "complete" preserves every
    // pre-Spec-056 run's readiness exactly as before (see
    // reviewCoverage.js#computeReviewCompleteness for the same
    // absence-is-not-incompleteness rule applied at the source).
    completenessStatus: last && last.completenessStatus ? last.completenessStatus : "complete",
    completenessReason: last ? (last.completenessReason || null) : null,
  };
}

// --- Review convergence (Spec 056 Part C/D) --------------------------------

// The single shared computation for "has review/fix converged", consulted
// here for reporting and by nothing else that could compute it differently
// (Spec 055 isFinalValidationSatisfied precedent). A state file predating
// this feature has no reviewConvergenceMetrics at all -- reported as
// `not-started` rather than a fabricated value (Spec 056 §26/FR-019).
function buildReviewConvergenceSummary(state, review, validation, findings, humanGateReady) {
  const orchestration = getOrchestration(state);
  const metrics = orchestration.reviewConvergenceMetrics;
  const hasAnyReviewAttempt = review.reviewAttempts > 0;
  if (!hasAnyReviewAttempt) {
    return {
      reviewAttempts: 0,
      firstReviewBlockingFindings: 0,
      newBlockingFindingsAfterFirstReview: 0,
      reopenedFindings: 0,
      resolvedFindingsVerified: 0,
      automaticFixCycles: review.fixCycles,
      status: "not-started",
    };
  }
  // Spec 056 Codex review round 3 fix (P2-001): derive budgetExhausted from
  // the authoritative orchestration.stopReason (normalized), not from
  // regex-matching orchestration.reason's free text. The prior two-string
  // regex missed the reviewer-question-cycle exhaustion path entirely
  // (different message, same stopReason) -- exactly the kind of "two
  // signals that can disagree" bug already fixed once for run.stopReason
  // (see computeStatusAndStopReason); every exhaustion path sets
  // orchestration.stopReason via buildExhaustionReport, so this single
  // check now covers all of them, including any future one, without
  // depending on message text at all.
  const budgetExhausted = normalizeStopReason(orchestration.stopReason) === REVIEW_CONVERGENCE_FAILED_STOP_REASON;
  const status = humanGateReady
    ? "converged"
    : computeConvergenceStatus({
      latestReviewOutcome: review.finalDecision,
      latestCompletenessStatus: review.completenessStatus,
      activeBlockingFindingsCount: findings.remainingBlocking,
      exactTargetMatch: validation.finalReadinessSatisfied,
      budgetExhausted,
      hasAnyReviewAttempt,
    });
  return {
    reviewAttempts: review.reviewAttempts,
    firstReviewBlockingFindings: metrics ? metrics.firstReviewBlockingFindings : 0,
    newBlockingFindingsAfterFirstReview: metrics ? metrics.newBlockingFindingsAfterFirstReview : 0,
    reopenedFindings: metrics ? metrics.reopenedFindings : 0,
    resolvedFindingsVerified: metrics ? metrics.resolvedFindingsVerified : 0,
    automaticFixCycles: review.fixCycles,
    status,
  };
}

// --- Findings -------------------------------------------------------------

function getFindingHistory(state) {
  const orchestration = getOrchestration(state);
  if (Array.isArray(state.findingHistory)) return state.findingHistory;
  if (Array.isArray(orchestration.findingHistory)) return orchestration.findingHistory;
  return [];
}

function buildFindingsSummary(state, cwd, options, warnings) {
  const history = asArray(getFindingHistory(state));
  const items = history.map((entry) => ({
    findingId: entry.findingId,
    severity: entry.severity || null,
    summary: entry.summary || null,
    kind: entry.kind || null,
    status: entry.currentStatus || "unknown",
    openedReviewAttempt: entry.firstSeenReviewSequence ?? null,
    resolvedReviewAttempt: entry.resolvedReviewSequence ?? null,
    artifactPaths: [entry.latestReviewArtifactPath, entry.latestStructuredReviewPath]
      .filter(Boolean)
      .map((rawPath) => {
        checkArtifactExists(cwd, rawPath, warnings);
        return toRunRelativePath(cwd, state, rawPath, options, warnings);
      })
      .filter(Boolean),
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

  // Spec 056: when the orchestration loop wrote an explicit stopReason
  // directly onto state (currently only the review-convergence budget
  // exhaustion paths), it is authoritative -- consulting it here, rather
  // than relying solely on regex-matching `reason`'s free text, guarantees
  // `run.stopReason` can never disagree with `orchestration.stopReason`.
  const explicitStopReason = normalizeStopReason(orchestration.stopReason);
  if (explicitStopReason && currentStage === "blocked"
    && (!lastValidation || lastValidation.status === "passed")
    && latestReviewDecision !== "Timed Out" && latestReviewDecision !== "Unknown" && latestReviewDecision !== "Execution Failed") {
    return { status: RUN_STATUSES.BLOCKED, stopReason: explicitStopReason };
  }

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

// Verifies the evidence backing the final Approved decision actually exists
// on disk (rather than trusting the persisted path reference alone), so
// readiness can never be claimed on the strength of a record whose
// underlying artifact was deleted, moved, or never actually written.
function verifyLatestReviewEvidence(state, cwd, warnings) {
  const reviewRuns = asArray(state.reviewRuns);
  const last = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
  if (!last) {
    warnings.push({ code: "missing-review-evidence", message: "No reviewRuns entry exists to back the final review decision." });
    return false;
  }
  let ok = true;
  if (last.resultPath && !checkArtifactExists(cwd, last.resultPath, warnings)) {
    ok = false;
  }
  if (last.structuredReviewStatus === "valid" && last.structuredReviewPath) {
    // Existence alone does not prove the evidence backing "Approved" is
    // intact -- verify the file actually contains valid, parseable JSON.
    if (readJsonArtifactSafe(cwd, last.structuredReviewPath, warnings) === undefined) {
      ok = false;
    }
  }
  return ok;
}

// buildValidationSummary trusts each record's persisted `status` field
// as-is and already warns (per-record, via checkArtifactExists) when an
// artifact is missing, but that warning alone does not affect readiness.
// Verify the artifact backing the *specific* validation record readiness is
// about to be claimed from actually exists -- not just checked-for-warning
// -- so a deleted/moved final-verification log cannot leave humanGate.ready
// true on the strength of a bare in-memory "passed" string alone. No
// separate warning is pushed here: buildValidationSummary already recorded
// one for this exact record if it is missing.
function verifyLatestValidationEvidence(state, cwd) {
  const validationRuns = asArray(state.validationRuns);
  const last = validationRuns.length ? validationRuns[validationRuns.length - 1] : undefined;
  if (!last || !last.path) return false;
  return fs.existsSync(path.resolve(cwd, last.path));
}

function buildHumanGate(status, review, validation, findings, evidenceVerified) {
  if (status === RUN_STATUSES.PLANNED) {
    return { required: false, action: null, ready: false, state: HUMAN_GATE_STATES.NOT_READY };
  }
  if (status !== RUN_STATUSES.AWAITING_HUMAN_DECISION) {
    return { required: true, action: null, ready: false, state: HUMAN_GATE_STATES.NOT_READY };
  }
  // "absent" (no structured review block at all) is legitimate Markdown-only
  // Approved compatibility (Spec 050); only "invalid" (malformed structured
  // data) blocks readiness -- never reinterpret malformed data as approval.
  // validation.status already mirrors the full phase only (never the focused
  // phase, see buildValidationSummary), and finalReadinessSatisfied
  // additionally requires the full-validation target to exactly match the
  // Approved review's target (Spec 055 FR-005/FR-010) -- a focused-only pass,
  // or a full pass against a target that no longer matches what was
  // reviewed, can never make a run ready.
  // Spec 056 FR-017: a complete Approved review is required for readiness --
  // an Approved decision that self-reported incomplete coverage (or that
  // this workflow independently classified as invalid) must not satisfy the
  // human gate, even if every other condition holds.
  const ready = review.finalDecision === "Approved"
    && review.structuredReviewStatus !== "invalid"
    && review.completenessStatus === "complete"
    && validation.status === VALIDATION_STATUSES.PASSED
    && validation.finalReadinessSatisfied
    && findings.remainingBlocking === 0
    && evidenceVerified;
  return {
    required: true,
    action: "merge-decision",
    ready,
    state: ready ? HUMAN_GATE_STATES.READY_FOR_MERGE_DECISION : HUMAN_GATE_STATES.NOT_READY,
  };
}

// --- Commit provenance -------------------------------------------------------

// reviewedCommit is preserved (always null) for strict backward compatibility
// with Spec 054 consumers that read it; it was never populated with real
// data even before this feature. reviewedTarget/fullValidationTarget are the
// new, additive fields that actually carry evidence, letting exactCommitMatch
// move from a permanent "unknown" placeholder to a real true/false once both
// targets exist.
function buildCommitProvenance(state, options) {
  const validationRuns = asArray(state.validationRuns);
  const reviewRuns = asArray(state.reviewRuns);
  const lastFullRecord = [...validationRuns].reverse().find((record) => isFullPhaseRecord(record));
  const lastReview = reviewRuns.length ? reviewRuns[reviewRuns.length - 1] : undefined;
  const reviewedTarget = (lastReview && lastReview.target) || null;
  const fullValidationTarget = (lastFullRecord && lastFullRecord.target) || null;
  const exactCommitMatch = (reviewedTarget && fullValidationTarget) ? targetsMatch(reviewedTarget, fullValidationTarget) : "unknown";
  return {
    implementationCommit: null,
    reviewedCommit: null,
    reviewedTarget,
    fullValidationTarget,
    currentBranchHead: options.currentBranchHead || null,
    exactCommitMatch,
  };
}

// --- Artifacts / warnings ---------------------------------------------------

function buildArtifactIndex(stageTimeline, state, cwd, options, warnings) {
  const paths = [];
  for (const entry of stageTimeline) {
    for (const artifactPath of entry.artifactPaths) {
      if (!paths.includes(artifactPath)) paths.push(artifactPath);
    }
  }
  // These orchestration-level paths (Reviewer question artifact, Implementer
  // answer artifact, finding lifecycle artifact) are persisted but do not
  // correspond to any orchestrationRuns/reviewRuns/validationRuns record
  // buildStageTimeline consumes, so they are never reachable through
  // stageTimeline[].artifactPaths and must be collected separately.
  const orchestration = getOrchestration(state);
  const supplementary = [
    orchestration.latestReviewerQuestionPath,
    orchestration.latestImplementerAnswerPath,
    orchestration.latestImplementerAnswerRawPath,
    orchestration.latestFindingLifecyclePath,
    orchestration.failedValidationPath,
  ].filter(Boolean);
  for (const rawPath of supplementary) {
    checkArtifactExists(cwd, rawPath, warnings);
    const normalized = toRunRelativePath(cwd, state, rawPath, options, warnings);
    if (normalized && !paths.includes(normalized)) paths.push(normalized);
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
  const stageTimeline = buildStageTimeline(state, roles, cwd, options, warnings);
  const validation = buildValidationSummary(state, cwd, options, warnings);
  const commits = buildCommitProvenance(state, options);
  const review = buildReviewSummary(state, commits.exactCommitMatch);
  const findings = buildFindingsSummary(state, cwd, options, warnings);
  let evidenceVerified = true;
  if (status === RUN_STATUSES.AWAITING_HUMAN_DECISION) {
    // Both calls must run regardless of the first result (not short-circuit
    // via &&), since verifyLatestReviewEvidence has warning side effects.
    const reviewEvidenceOk = verifyLatestReviewEvidence(state, cwd, warnings);
    const validationEvidenceOk = verifyLatestValidationEvidence(state, cwd);
    evidenceVerified = reviewEvidenceOk && validationEvidenceOk;
  }
  const humanGate = buildHumanGate(status, review, validation, findings, evidenceVerified);
  const reviewConvergence = buildReviewConvergenceSummary(state, review, validation, findings, humanGate.ready);
  const performance = buildPerformanceSummary({
    reviewRuns: asArray(state.reviewRuns),
    validationRuns: asArray(state.validationRuns),
    reviewAttempts: review.reviewAttempts,
  });

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
    commits,
    humanGate,
    performance,
    reviewConvergence,
    artifacts: buildArtifactIndex(stageTimeline, state, cwd, options, warnings),
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
