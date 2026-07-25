const LIFECYCLE_STATUSES = {
  VALID: "valid",
  ABSENT: "absent",
  INVALID: "invalid",
};

const OPEN_STATUSES = new Set(["new", "still_open"]);

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFinding(finding, kind, reviewSequence, paths = {}) {
  return {
    findingId: normalizeString(finding.id),
    kind,
    severity: normalizeString(finding.severity),
    summary: normalizeString(finding.summary),
    recommendation: normalizeString(finding.recommendation),
    firstSeenReviewSequence: reviewSequence,
    lastSeenReviewSequence: reviewSequence,
    currentStatus: "new",
    sourceReviewArtifactPath: paths.reviewPath,
    latestReviewArtifactPath: paths.reviewPath,
    latestStructuredReviewPath: paths.structuredReviewPath,
    finding: { ...finding, kind },
  };
}

function getCurrentFindings(review) {
  return [
    ...(Array.isArray(review.blockingFindings) ? review.blockingFindings.map((finding) => ({ ...finding, kind: "blocking" })) : []),
    ...(Array.isArray(review.nonBlockingFindings) ? review.nonBlockingFindings.map((finding) => ({ ...finding, kind: "non_blocking" })) : []),
  ];
}

function getOpenHistory(history) {
  return (Array.isArray(history) ? history : []).filter((entry) => entry.currentStatus !== "resolved");
}

function compareContinuity(previous, current, diagnostics) {
  if (!current) return;
  if (previous.severity && current.severity && previous.severity !== current.severity) {
    diagnostics.push(`finding ${previous.findingId} changed severity from ${previous.severity} to ${current.severity}.`);
  }
  if (previous.summary && current.summary && previous.summary !== current.summary) {
    diagnostics.push(`finding ${previous.findingId} changed summary under a reused ID.`);
  }
  if (previous.recommendation && current.recommendation && previous.recommendation !== current.recommendation) {
    diagnostics.push(`finding ${previous.findingId} changed recommendation under a reused ID.`);
  }
  if (previous.kind && current.kind && previous.kind !== current.kind) {
    diagnostics.push(`finding ${previous.findingId} changed kind from ${previous.kind} to ${current.kind}.`);
  }
}

function lifecycleMap(entries, diagnostics) {
  const map = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const findingId = normalizeString(entry.findingId);
    if (!findingId) continue;
    if (map.has(findingId)) diagnostics.push(`Duplicate lifecycle classification for findingId: ${findingId}.`);
    map.set(findingId, {
      findingId,
      status: normalizeString(entry.status),
      explanation: normalizeString(entry.explanation),
    });
  }
  return map;
}

function buildArtifact({ status, reviewSequence, previousFindings, classifications, newFindings, stillOpenFindings, resolvedFindings, activeBlockingFindings, diagnostics }) {
  return {
    schemaVersion: 1,
    reviewSequence,
    status,
    previousFindings,
    classifications,
    newFindings,
    stillOpenFindings,
    resolvedFindings,
    activeBlockingFindings,
    diagnostics,
  };
}

function applyInitialLifecycle(review, options = {}) {
  const reviewSequence = options.reviewSequence || 1;
  const existingHistory = Array.isArray(options.previousHistory) ? options.previousHistory : [];
  if (existingHistory.length) {
    const diagnostics = ["Initial lifecycle cannot replace existing finding history."];
    return {
      status: LIFECYCLE_STATUSES.INVALID,
      reviewSequence,
      history: existingHistory,
      activeBlockingFindings: existingHistory
        .filter((entry) => entry.kind === "blocking" && OPEN_STATUSES.has(entry.currentStatus))
        .map((entry) => entry.finding)
        .filter(Boolean),
      lifecycle: buildArtifact({
        status: LIFECYCLE_STATUSES.INVALID,
        reviewSequence,
        previousFindings: existingHistory.map((entry) => ({
          findingId: entry.findingId,
          kind: entry.kind,
          severity: entry.severity,
          currentStatus: entry.currentStatus,
        })),
        classifications: [],
        newFindings: [],
        stillOpenFindings: [],
        resolvedFindings: [],
        activeBlockingFindings: [],
        diagnostics,
      }),
      diagnostics,
    };
  }
  const currentFindings = getCurrentFindings(review);
  const history = currentFindings.map((finding) => normalizeFinding(finding, finding.kind, reviewSequence, options));
  const activeBlockingFindings = history
    .filter((entry) => entry.kind === "blocking" && OPEN_STATUSES.has(entry.currentStatus))
    .map((entry) => entry.finding);
  return {
    status: LIFECYCLE_STATUSES.VALID,
    reviewSequence,
    history,
    activeBlockingFindings,
    lifecycle: buildArtifact({
      status: LIFECYCLE_STATUSES.VALID,
      reviewSequence,
      previousFindings: [],
      classifications: currentFindings.map((finding) => ({
        findingId: finding.id,
        status: "new",
        explanation: "Initial review finding.",
      })),
      newFindings: history.map((entry) => entry.findingId),
      stillOpenFindings: [],
      resolvedFindings: [],
      activeBlockingFindings,
      diagnostics: [],
    }),
    diagnostics: [],
  };
}

function preserveResolvedHistoryLifecycle(review, history, options = {}) {
  const reviewSequence = options.reviewSequence || 1;
  const diagnostics = [];
  const currentFindings = getCurrentFindings(review);
  const currentById = new Map(currentFindings.map((finding) => [finding.id, finding]));
  const previousById = new Map(history.map((entry) => [entry.findingId, entry]));
  const lifecycleEntries = Array.isArray(review.findingLifecycle) ? review.findingLifecycle : [];
  const classifications = lifecycleMap(lifecycleEntries, diagnostics);
  const nextHistoryById = new Map(history.map((entry) => [entry.findingId, { ...entry }]));
  const newFindings = [];

  for (const current of currentFindings) {
    const findingId = normalizeString(current.id);
    if (previousById.has(findingId)) {
      diagnostics.push(`Resolved finding ${findingId} cannot be reused as a current finding.`);
      compareContinuity(previousById.get(findingId), current, diagnostics);
      continue;
    }
    const classification = classifications.get(findingId);
    if (!classification) {
      diagnostics.push(`New current finding ${findingId || "(missing id)"} is missing lifecycle classification.`);
      continue;
    }
    if (classification.status !== "new") {
      diagnostics.push(`New current finding ${findingId} must be classified as new.`);
      continue;
    }
    newFindings.push(findingId);
    nextHistoryById.set(findingId, normalizeFinding(current, current.kind, reviewSequence, options));
  }

  for (const classification of classifications.values()) {
    if (previousById.has(classification.findingId)) {
      diagnostics.push(`Resolved previous finding ${classification.findingId} must not receive a new lifecycle transition.`);
    } else if (!currentById.has(classification.findingId)) {
      diagnostics.push(`Lifecycle entry references unknown findingId: ${classification.findingId}.`);
    }
  }

  const activeBlockingFindings = Array.from(nextHistoryById.values())
    .filter((entry) => entry.kind === "blocking" && OPEN_STATUSES.has(entry.currentStatus))
    .map((entry) => entry.finding)
    .filter(Boolean);

  if (review.decision === "approved" && activeBlockingFindings.length) {
    diagnostics.push(`approved review has active blocking findings: ${activeBlockingFindings.map((finding) => finding.id).join(", ")}.`);
  }
  if (review.decision === "changes_requested" && activeBlockingFindings.length === 0) {
    diagnostics.push("changes_requested lifecycle review must leave at least one active blocking finding.");
  }

  const lifecycle = buildArtifact({
    status: diagnostics.length ? LIFECYCLE_STATUSES.INVALID : LIFECYCLE_STATUSES.VALID,
    reviewSequence,
    previousFindings: history.map((entry) => ({
      findingId: entry.findingId,
      kind: entry.kind,
      severity: entry.severity,
      currentStatus: entry.currentStatus,
    })),
    classifications: Array.from(classifications.values()),
    newFindings,
    stillOpenFindings: [],
    resolvedFindings: [],
    activeBlockingFindings,
    diagnostics,
  });

  if (diagnostics.length) {
    return { status: LIFECYCLE_STATUSES.INVALID, reviewSequence, history, activeBlockingFindings, lifecycle, diagnostics };
  }
  return {
    status: LIFECYCLE_STATUSES.VALID,
    reviewSequence,
    history: Array.from(nextHistoryById.values()),
    activeBlockingFindings,
    lifecycle,
    diagnostics: [],
  };
}

function normalizeFindingLifecycle(review, previousHistory = [], options = {}) {
  const reviewSequence = options.reviewSequence || 1;
  const history = Array.isArray(previousHistory) ? previousHistory : [];
  const openPrevious = getOpenHistory(history);
  const diagnostics = [];

  if (!review || typeof review !== "object") {
    return {
      status: LIFECYCLE_STATUSES.INVALID,
      diagnostics: ["Structured review is required for lifecycle normalization."],
    };
  }

  if (!openPrevious.length) {
    if (history.length) return preserveResolvedHistoryLifecycle(review, history, { ...options, reviewSequence });
    return applyInitialLifecycle(review, { ...options, reviewSequence });
  }

  const lifecycleEntries = Array.isArray(review.findingLifecycle) ? review.findingLifecycle : undefined;
  if (!lifecycleEntries) {
    return {
      status: LIFECYCLE_STATUSES.ABSENT,
      diagnostics: ["findingLifecycle is required when previous structured findings exist."],
    };
  }

  const currentFindings = getCurrentFindings(review);
  const currentById = new Map(currentFindings.map((finding) => [finding.id, finding]));
  const previousById = new Map(openPrevious.map((entry) => [entry.findingId, entry]));
  const classifications = lifecycleMap(lifecycleEntries, diagnostics);
  const nextHistoryById = new Map(history.map((entry) => [entry.findingId, { ...entry }]));
  const newFindings = [];
  const stillOpenFindings = [];
  const resolvedFindings = [];

  for (const previous of openPrevious) {
    const classification = classifications.get(previous.findingId);
    if (!classification) {
      diagnostics.push(`Missing lifecycle classification for previous findingId: ${previous.findingId}.`);
      continue;
    }
    if (classification.status === "new") {
      diagnostics.push(`Previous finding ${previous.findingId} must not be classified as new.`);
    }
    if (classification.status === "still_open") {
      const current = currentById.get(previous.findingId);
      if (!current) diagnostics.push(`Still-open finding ${previous.findingId} is omitted from current findings.`);
      compareContinuity(previous, current, diagnostics);
      stillOpenFindings.push(previous.findingId);
      nextHistoryById.set(previous.findingId, {
        ...previous,
        lastSeenReviewSequence: reviewSequence,
        currentStatus: "still_open",
        latestReviewArtifactPath: options.reviewPath,
        latestStructuredReviewPath: options.structuredReviewPath,
        finding: current || previous.finding,
      });
    }
    if (classification.status === "resolved") {
      const current = currentById.get(previous.findingId);
      if (current && current.kind === "blocking") {
        diagnostics.push(`Resolved finding ${previous.findingId} is still present as a current blocking finding.`);
      }
      resolvedFindings.push(previous.findingId);
      nextHistoryById.set(previous.findingId, {
        ...previous,
        lastSeenReviewSequence: reviewSequence,
        currentStatus: "resolved",
        resolvedReviewSequence: reviewSequence,
        latestReviewArtifactPath: options.reviewPath,
        latestStructuredReviewPath: options.structuredReviewPath,
      });
    }
  }

  for (const current of currentFindings) {
    const findingId = normalizeString(current.id);
    const classification = classifications.get(findingId);
    if (previousById.has(findingId)) continue;
    if (!classification) {
      diagnostics.push(`New current finding ${findingId || "(missing id)"} is missing lifecycle classification.`);
      continue;
    }
    if (classification.status !== "new") {
      diagnostics.push(`New current finding ${findingId} must be classified as new.`);
      continue;
    }
    newFindings.push(findingId);
    nextHistoryById.set(findingId, normalizeFinding(current, current.kind, reviewSequence, options));
  }

  for (const classification of classifications.values()) {
    if (!previousById.has(classification.findingId) && !currentById.has(classification.findingId)) {
      diagnostics.push(`Lifecycle entry references unknown findingId: ${classification.findingId}.`);
    }
  }

  if (review.decision === "approved") {
    const stillOpenBlocking = stillOpenFindings.filter((findingId) => {
      const entry = previousById.get(findingId);
      return entry && entry.kind === "blocking";
    });
    if (stillOpenBlocking.length) diagnostics.push(`approved review has still-open blocking findings: ${stillOpenBlocking.join(", ")}.`);
    if ((Array.isArray(review.blockingFindings) ? review.blockingFindings : []).length) {
      diagnostics.push("approved review must not include current blocking findings.");
    }
  }

  const activeBlockingFindings = Array.from(nextHistoryById.values())
    .filter((entry) => entry.kind === "blocking" && OPEN_STATUSES.has(entry.currentStatus))
    .map((entry) => entry.finding)
    .filter(Boolean);

  if (review.decision === "changes_requested" && activeBlockingFindings.length === 0) {
    diagnostics.push("changes_requested lifecycle review must leave at least one active blocking finding.");
  }

  const lifecycle = buildArtifact({
    status: diagnostics.length ? LIFECYCLE_STATUSES.INVALID : LIFECYCLE_STATUSES.VALID,
    reviewSequence,
    previousFindings: openPrevious.map((entry) => ({
      findingId: entry.findingId,
      kind: entry.kind,
      severity: entry.severity,
      currentStatus: entry.currentStatus,
    })),
    classifications: Array.from(classifications.values()),
    newFindings,
    stillOpenFindings,
    resolvedFindings,
    activeBlockingFindings,
    diagnostics,
  });

  if (diagnostics.length) {
    return { status: LIFECYCLE_STATUSES.INVALID, reviewSequence, lifecycle, diagnostics };
  }

  return {
    status: LIFECYCLE_STATUSES.VALID,
    reviewSequence,
    history: Array.from(nextHistoryById.values()),
    activeBlockingFindings,
    lifecycle,
    diagnostics: [],
  };
}

function formatFindingHistoryForPrompt(history) {
  const entries = Array.isArray(history) ? history : [];
  if (!entries.length) return "- none";
  return entries.map((entry) => {
    const lines = [
      `Finding ${entry.findingId}:`,
      `Kind: ${entry.kind}`,
      `Severity: ${entry.severity}`,
      `Current status: ${entry.currentStatus}`,
      `First seen review sequence: ${entry.firstSeenReviewSequence}`,
    ];
    if (entry.summary) lines.push(`Summary: ${entry.summary}`);
    if (entry.recommendation) lines.push(`Recommendation: ${entry.recommendation}`);
    if (entry.latestReviewArtifactPath) lines.push(`Latest review artifact: ${entry.latestReviewArtifactPath}`);
    return lines.join("\n");
  }).join("\n\n");
}

module.exports = {
  LIFECYCLE_STATUSES,
  formatFindingHistoryForPrompt,
  normalizeFindingLifecycle,
};
