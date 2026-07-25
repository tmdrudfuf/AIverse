const ANSWER_STATUSES = {
  VALID: "valid",
  ABSENT: "absent",
  INVALID: "invalid",
  UNSUPPORTED: "unsupported",
};
const SUPPORTED_ANSWER_SCHEMA_VERSION = 1;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sectionRanges(markdown) {
  const content = String(markdown || "").replace(/\r\n/g, "\n");
  const headingPattern = /^##\s+Structured Answers\s*$/gim;
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

function extractStructuredAnswerPayload(markdown) {
  const ranges = sectionRanges(markdown);
  if (!ranges.length) return { status: ANSWER_STATUSES.ABSENT, blockCount: 0, diagnostics: [] };
  const blocks = [];
  for (const range of ranges) {
    const fencePattern = /```json\s*\n([\s\S]*?)\n```/gi;
    let match;
    while ((match = fencePattern.exec(range)) !== null) blocks.push(match[1]);
  }
  if (blocks.length !== 1) {
    return {
      status: ANSWER_STATUSES.INVALID,
      blockCount: blocks.length,
      diagnostics: [`Expected exactly one structured answers JSON block; found ${blocks.length}.`],
    };
  }
  return { status: ANSWER_STATUSES.VALID, blockCount: 1, payload: blocks[0], diagnostics: [] };
}

function normalizeQuestionIds(questions) {
  return (Array.isArray(questions) ? questions : [])
    .map((question) => normalizeString(question && question.id))
    .filter(Boolean);
}

function validateAnswerObject(value, questions) {
  const diagnostics = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { status: ANSWER_STATUSES.INVALID, diagnostics: ["Structured answers must be a JSON object."] };
  }
  if (value.schemaVersion !== SUPPORTED_ANSWER_SCHEMA_VERSION) {
    return {
      status: ANSWER_STATUSES.UNSUPPORTED,
      diagnostics: [`Unsupported structured answers schemaVersion: ${String(value.schemaVersion)}.`],
    };
  }
  if (!Array.isArray(value.answers)) {
    return { status: ANSWER_STATUSES.INVALID, diagnostics: ["answers must be an array."] };
  }

  const questionIds = normalizeQuestionIds(questions);
  const knownQuestionIds = new Set(questionIds);
  const seenAnswerIds = new Set();
  const normalizedAnswers = [];

  for (const answer of value.answers) {
    if (!answer || typeof answer !== "object" || Array.isArray(answer)) {
      diagnostics.push("answers contains a non-object answer.");
      continue;
    }
    const questionId = normalizeString(answer.questionId);
    const answerText = normalizeString(answer.answer);
    if (!questionId) diagnostics.push("answer is missing questionId.");
    if (!answerText) diagnostics.push(`answer ${questionId || "(missing questionId)"} is missing answer.`);
    if (questionId && !knownQuestionIds.has(questionId)) {
      diagnostics.push(`answer references unknown questionId: ${questionId}.`);
    }
    if (questionId && seenAnswerIds.has(questionId)) {
      diagnostics.push(`Duplicate answer for questionId: ${questionId}.`);
    }
    if (questionId) seenAnswerIds.add(questionId);

    const normalized = { questionId, answer: answerText };
    if (Object.prototype.hasOwnProperty.call(answer, "evidence")) {
      if (!Array.isArray(answer.evidence)) {
        diagnostics.push(`answer ${questionId || "(missing questionId)"} evidence must be an array when present.`);
      } else {
        normalized.evidence = answer.evidence
          .map((item) => normalizeString(item))
          .filter(Boolean);
      }
    }
    normalizedAnswers.push(normalized);
  }

  for (const questionId of questionIds) {
    if (!seenAnswerIds.has(questionId)) diagnostics.push(`Missing answer for questionId: ${questionId}.`);
  }

  if (diagnostics.length) return { status: ANSWER_STATUSES.INVALID, diagnostics };
  return {
    status: ANSWER_STATUSES.VALID,
    diagnostics: [],
    answers: {
      schemaVersion: SUPPORTED_ANSWER_SCHEMA_VERSION,
      answers: normalizedAnswers,
    },
  };
}

function parseStructuredAnswers(markdown, questions) {
  const extracted = extractStructuredAnswerPayload(markdown);
  if (extracted.status !== ANSWER_STATUSES.VALID) return extracted;
  let parsed;
  try {
    parsed = JSON.parse(extracted.payload);
  } catch (error) {
    return {
      status: ANSWER_STATUSES.INVALID,
      blockCount: extracted.blockCount,
      diagnostics: [`Structured answers JSON is malformed: ${error.message}`],
    };
  }
  return {
    ...validateAnswerObject(parsed, questions),
    blockCount: extracted.blockCount,
  };
}

module.exports = {
  ANSWER_STATUSES,
  SUPPORTED_ANSWER_SCHEMA_VERSION,
  extractStructuredAnswerPayload,
  parseStructuredAnswers,
  validateAnswerObject,
};
