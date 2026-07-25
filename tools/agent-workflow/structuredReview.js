const { detectDecision } = require("./agentWorkflow.js");

const SUPPORTED_SCHEMA_VERSION = 1;
const STRUCTURED_REVIEW_STATUSES = {
  VALID: "valid",
  ABSENT: "absent",
  INVALID: "invalid",
  UNSUPPORTED: "unsupported",
};
const STRUCTURED_DECISION_TO_WORKFLOW = {
  approved: "Approved",
  changes_requested: "Changes Requested",
  questions: "Questions",
};
const VALID_SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const STRING_FIELDS = ["id", "severity", "filePath", "location", "summary", "reason", "recommendation"];
const QUESTION_STRING_FIELDS = ["id", "question", "reason"];
const UNSAFE_QUESTION_PATTERNS = [
  /\b(secret|token|credential|password|api[-_\s]?key|private\s+env(?:ironment)?)\b/i,
  /\b(git\s+push|gh\s+pr\s+(?:create|merge|ready|edit)|gh\s+api|delete\s+remote\s+branch)\b/i,
  /\b(run|execute|invoke)\s+(?:this\s+)?(?:command|shell|powershell|bash|cmd)\b/i,
  /\b(skip|bypass|disable)\s+(?:validation|tests?|safety|permission|review)\b/i,
  /\bunrelated\s+(?:work|feature|change|task)\b/i,
];
const UNSAFE_NORMALIZED_SECRET_PATTERNS = [
  /\bapi\s+key\b/,
  /\baccess\s+token\b/,
  /\brefresh\s+token\b/,
  /\bprivate\s+key\b/,
  /\bclient\s+secret\b/,
  /\bsecret\s+access\s+key\b/,
  /\b(?:github|gh)\s+token\b/,
  /\baws\s+access\s+key\s+id\b/,
  /\baws\s+secret\s+access\s+key\b/,
  /\bazure\s+client\s+secret\b/,
];
const UNSAFE_COMPACT_SECRET_PATTERNS = [
  /apikey/,
  /accesstoken/,
  /refreshtoken/,
  /privatekey/,
  /clientsecret/,
  /secretaccesskey/,
  /githubtoken/,
  /ghtoken/,
  /awsaccesskeyid/,
  /awssecretaccesskey/,
  /azureclientsecret/,
];

function sectionRanges(markdown) {
  const content = String(markdown || "").replace(/\r\n/g, "\n");
  const headingPattern = /^##\s+Structured Review\s*$/gim;
  const ranges = [];
  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    const sectionStart = match.index + match[0].length;
    const rest = content.slice(sectionStart);
    const nextHeading = rest.search(/^##\s+.+/gim);
    const sectionEnd = nextHeading === -1 ? content.length : sectionStart + nextHeading;
    ranges.push(content.slice(sectionStart, sectionEnd));
  }
  return ranges;
}

function extractStructuredReviewPayload(markdown) {
  const ranges = sectionRanges(markdown);
  if (!ranges.length) {
    return { status: STRUCTURED_REVIEW_STATUSES.ABSENT, blockCount: 0, diagnostics: [] };
  }

  const blocks = [];
  for (const range of ranges) {
    const fencePattern = /```json\s*\n([\s\S]*?)\n```/gi;
    let match;
    while ((match = fencePattern.exec(range)) !== null) {
      blocks.push(match[1]);
    }
  }

  if (blocks.length !== 1) {
    return {
      status: STRUCTURED_REVIEW_STATUSES.INVALID,
      blockCount: blocks.length,
      diagnostics: [`Expected exactly one structured review JSON block; found ${blocks.length}.`],
    };
  }

  return {
    status: STRUCTURED_REVIEW_STATUSES.VALID,
    blockCount: 1,
    payload: blocks[0],
    diagnostics: [],
  };
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function copyStringField(target, source, field) {
  if (Object.prototype.hasOwnProperty.call(source, field)) {
    if (typeof source[field] !== "string") return false;
    const value = source[field].trim();
    if (value) target[field] = value;
  }
  return true;
}

function validateFinding(finding, collectionName, requireActionable) {
  const diagnostics = [];
  if (!finding || typeof finding !== "object" || Array.isArray(finding)) {
    return { diagnostics: [`${collectionName} contains a non-object finding.`] };
  }

  const normalized = {};
  for (const field of STRING_FIELDS) {
    if (!copyStringField(normalized, finding, field)) {
      diagnostics.push(`${collectionName} finding field ${field} must be a string when present.`);
    }
  }

  if (!normalized.id) diagnostics.push(`${collectionName} finding is missing id.`);
  if (!VALID_SEVERITIES.has(normalized.severity)) {
    diagnostics.push(`${collectionName} finding ${normalized.id || "(missing id)"} has invalid severity.`);
  }
  if (!normalized.summary) {
    diagnostics.push(`${collectionName} finding ${normalized.id || "(missing id)"} is missing summary.`);
  }
  if (requireActionable && !normalized.recommendation) {
    diagnostics.push(`${collectionName} finding ${normalized.id || "(missing id)"} is missing recommendation.`);
  }
  if (requireActionable && !["filePath", "location", "reason", "recommendation"].some((field) => normalized[field])) {
    diagnostics.push(`${collectionName} finding ${normalized.id || "(missing id)"} has no actionable context.`);
  }

  return { normalized, diagnostics };
}

function validateFindingCollection(value, collectionName, requireActionable) {
  const diagnostics = [];
  const normalized = [];
  if (!Array.isArray(value)) {
    return { diagnostics: [`${collectionName} must be an array.`], normalized };
  }

  for (const finding of value) {
    const result = validateFinding(finding, collectionName, requireActionable);
    diagnostics.push(...result.diagnostics);
    if (result.normalized) normalized.push(result.normalized);
  }

  return { diagnostics, normalized };
}

function normalizeQuestionSafetyText(text) {
  return String(text || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUnsafeQuestionText(question) {
  const text = `${question.question || ""}\n${question.reason || ""}`;
  if (UNSAFE_QUESTION_PATTERNS.some((pattern) => pattern.test(text))) return true;
  const normalized = normalizeQuestionSafetyText(text);
  const compact = normalized.replace(/\s+/g, "");
  return (
    UNSAFE_NORMALIZED_SECRET_PATTERNS.some((pattern) => pattern.test(normalized))
    || UNSAFE_COMPACT_SECRET_PATTERNS.some((pattern) => pattern.test(compact))
  );
}

function validateQuestion(question) {
  const diagnostics = [];
  if (!question || typeof question !== "object" || Array.isArray(question)) {
    return { diagnostics: ["questions contains a non-object question."] };
  }
  const normalized = {};
  for (const field of QUESTION_STRING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(question, field)) {
      if (typeof question[field] !== "string") {
        diagnostics.push(`question field ${field} must be a string.`);
        continue;
      }
      const value = question[field].trim();
      if (value) normalized[field] = value;
    }
  }
  if (!normalized.id) diagnostics.push("question is missing id.");
  if (!normalized.question) diagnostics.push(`question ${normalized.id || "(missing id)"} is missing question.`);
  if (!normalized.reason) diagnostics.push(`question ${normalized.id || "(missing id)"} is missing reason.`);
  if (isUnsafeQuestionText(normalized)) {
    diagnostics.push(`question ${normalized.id || "(missing id)"} contains unsafe or out-of-scope content.`);
  }
  return { normalized, diagnostics };
}

function validateQuestions(value) {
  if (value === undefined) return { diagnostics: [], normalized: [] };
  if (!Array.isArray(value)) return { diagnostics: ["questions must be an array."], normalized: [] };
  const diagnostics = [];
  const normalized = [];
  const seenIds = new Set();
  for (const question of value) {
    const result = validateQuestion(question);
    diagnostics.push(...result.diagnostics);
    if (!result.normalized) continue;
    if (result.normalized.id) {
      if (seenIds.has(result.normalized.id)) {
        diagnostics.push(`Duplicate structured review question id: ${result.normalized.id}.`);
      }
      seenIds.add(result.normalized.id);
    }
    normalized.push(result.normalized);
  }
  return { diagnostics, normalized };
}

function validateStructuredReviewObject(value) {
  const diagnostics = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: STRUCTURED_REVIEW_STATUSES.INVALID, diagnostics: ["Structured review must be a JSON object."] };
  }

  if (value.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return {
      status: STRUCTURED_REVIEW_STATUSES.UNSUPPORTED,
      diagnostics: [`Unsupported structured review schemaVersion: ${String(value.schemaVersion)}.`],
    };
  }

  const decision = normalizeString(value.decision).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(STRUCTURED_DECISION_TO_WORKFLOW, decision)) {
    diagnostics.push(`Invalid structured review decision: ${String(value.decision)}.`);
  }

  const blocking = validateFindingCollection(value.blockingFindings, "blockingFindings", true);
  diagnostics.push(...blocking.diagnostics);

  const nonBlocking = validateFindingCollection(
    value.nonBlockingFindings === undefined ? [] : value.nonBlockingFindings,
    "nonBlockingFindings",
    false,
  );
  diagnostics.push(...nonBlocking.diagnostics);

  const questions = validateQuestions(value.questions);
  diagnostics.push(...questions.diagnostics);

  const seenIds = new Set();
  for (const finding of [...blocking.normalized, ...nonBlocking.normalized]) {
    if (!finding.id) continue;
    if (seenIds.has(finding.id)) diagnostics.push(`Duplicate structured review finding id: ${finding.id}.`);
    seenIds.add(finding.id);
  }

  if (diagnostics.length) {
    return { status: STRUCTURED_REVIEW_STATUSES.INVALID, diagnostics };
  }

  if (decision === "approved" && (blocking.normalized.length || questions.normalized.length)) {
    diagnostics.push("approved structured review must not include blocking findings or questions.");
  }
  if (decision === "changes_requested" && (questions.normalized.length || !blocking.normalized.length)) {
    diagnostics.push("changes_requested structured review must include blocking findings and no questions.");
  }
  if (decision === "questions" && (blocking.normalized.length || !questions.normalized.length)) {
    diagnostics.push("questions structured review must include questions and no blocking findings.");
  }

  if (diagnostics.length) {
    return { status: STRUCTURED_REVIEW_STATUSES.INVALID, diagnostics };
  }

  const review = {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    decision,
    blockingFindings: blocking.normalized,
    nonBlockingFindings: nonBlocking.normalized,
    questions: questions.normalized,
  };
  if (typeof value.summary === "string" && value.summary.trim()) review.summary = value.summary.trim();

  return {
    status: STRUCTURED_REVIEW_STATUSES.VALID,
    review,
    diagnostics: [],
  };
}

function parseStructuredReview(markdown) {
  const extracted = extractStructuredReviewPayload(markdown);
  if (extracted.status !== STRUCTURED_REVIEW_STATUSES.VALID) return extracted;

  let parsed;
  try {
    parsed = JSON.parse(extracted.payload);
  } catch (error) {
    return {
      status: STRUCTURED_REVIEW_STATUSES.INVALID,
      blockCount: extracted.blockCount,
      diagnostics: [`Structured review JSON is malformed: ${error.message}`],
    };
  }

  const validation = validateStructuredReviewObject(parsed);
  return {
    ...validation,
    blockCount: extracted.blockCount,
  };
}

function reconcileStructuredReview(markdownDecision, parseResult) {
  if (parseResult.status === STRUCTURED_REVIEW_STATUSES.ABSENT) {
    return {
      ...parseResult,
      decision: markdownDecision,
      decisionSource: "markdown",
    };
  }
  if (parseResult.status !== STRUCTURED_REVIEW_STATUSES.VALID) {
    return {
      ...parseResult,
      decision: "Unknown",
      decisionSource: "structured-review",
    };
  }

  const structuredDecision = STRUCTURED_DECISION_TO_WORKFLOW[parseResult.review.decision];
  if (markdownDecision === "Unknown" || markdownDecision === structuredDecision) {
    return {
      ...parseResult,
      decision: structuredDecision,
      decisionSource: "structured-review",
    };
  }

  return {
    ...parseResult,
    status: STRUCTURED_REVIEW_STATUSES.INVALID,
    decision: "Unknown",
    decisionSource: "conflict",
    diagnostics: [
      ...(parseResult.diagnostics || []),
      `Markdown decision ${markdownDecision} conflicts with structured decision ${structuredDecision}.`,
    ],
  };
}

function analyzeStructuredReview(markdown) {
  const markdownDecision = detectDecision(markdown);
  return reconcileStructuredReview(markdownDecision, parseStructuredReview(markdown));
}

module.exports = {
  STRUCTURED_REVIEW_STATUSES,
  SUPPORTED_SCHEMA_VERSION,
  VALID_SEVERITIES,
  UNSAFE_QUESTION_PATTERNS,
  analyzeStructuredReview,
  extractStructuredReviewPayload,
  parseStructuredReview,
  reconcileStructuredReview,
  validateStructuredReviewObject,
};
