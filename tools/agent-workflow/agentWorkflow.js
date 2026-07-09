const fs = require("fs");
const path = require("path");

const WORKFLOW_STAGES = [
  "implement",
  "review",
  "fix",
  "re-review",
  "final-verification",
  "human-merge-decision",
];

const DEFAULT_VALIDATION_COMMANDS = [
  "npm test",
  "npx tsc --noEmit",
  "npm run build",
  "git diff --check",
];

const DEFAULT_SAFETY_RULES = [
  "Do not push.",
  "Do not open pull requests.",
  "Do not mark pull requests ready for review.",
  "Do not merge pull requests.",
  "Do not delete branches.",
  "Do not call paid AI APIs or external AI tools automatically.",
  "Do not call GitHub APIs or any external network service automatically.",
];

const HUMAN_ONLY_COMMANDS = [
  "HUMAN-ONLY: git push -u origin <branch>",
  "HUMAN-ONLY: gh pr create --draft --base <base> --head <branch>",
  "HUMAN-ONLY: gh pr ready <number>",
  "HUMAN-ONLY: gh pr merge <number>",
  "HUMAN-ONLY: git branch -d <branch>",
  "HUMAN-ONLY: git push origin --delete <branch>",
];

const REVIEW_DECISION_FORMAT = [
  "Approved",
  "Changes Requested with exact file/line comments and behavioral risk",
].join("\n");

function sanitizeFeatureId(featureId) {
  const sanitized = String(featureId || "unknown-feature")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized && sanitized !== "." && sanitized !== ".." ? sanitized : "unknown-feature";
}

function normalizeList(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.map((item) => String(item));
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatOptionalList(value, emptyText) {
  if (!Array.isArray(value) || value.length === 0) return emptyText;
  return formatList(value);
}

function detectDecision(text) {
  const content = String(text || "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^#+\s*/, "").replace(/^\*\*(.+)\*\*$/, "$1").trim())
    .filter(Boolean);
  const hasChangesRequested = lines.some((line) => (
    line === "Changes Requested"
    || line.startsWith("Changes Requested ")
    || /^Review Decision:\s*Changes Requested\b/i.test(line)
  ));
  const hasApproved = lines.some((line) => (
    line === "Approved"
    || line.startsWith("Approved ")
    || /^Review Decision:\s*Approved\b/i.test(line)
  ));
  if (hasChangesRequested && hasApproved) return "Unknown";
  if (hasChangesRequested) return "Changes Requested";
  if (hasApproved) return "Approved";
  return "Unknown";
}

function getLatestResult(state) {
  const results = Array.isArray(state.results) ? state.results : [];
  return results.length > 0 ? results[results.length - 1] : undefined;
}

function determineNextStage(state) {
  const latest = getLatestResult(state);
  if (!latest) return "implement";

  if (latest.stage === "implement") return "review";
  if (latest.stage === "fix") return "re-review";
  if (latest.stage === "final-verification") return "human-merge-decision";
  if (latest.stage === "human-merge-decision") return "human-merge-decision";

  if (latest.stage === "review" || latest.stage === "re-review") {
    if (latest.decision === "Changes Requested") return "fix";
    if (latest.decision === "Approved") return "final-verification";
    return latest.stage === "review" ? "review" : "re-review";
  }

  return "implement";
}

function assertValidStage(stage) {
  if (!WORKFLOW_STAGES.includes(stage)) {
    throw new Error(`Unsupported workflow stage: ${stage}`);
  }
}

function getTemplatePath(stage, templatesDir = path.join(__dirname, "templates")) {
  assertValidStage(stage);
  return path.join(templatesDir, `${stage}.md`);
}

function renderTemplate(template, state) {
  const validationCommands = normalizeList(state.validationCommands, DEFAULT_VALIDATION_COMMANDS);
  const scopeConstraints = normalizeList(state.scopeConstraints, ["Keep the change scoped to the active feature."]);
  const expectedCommit = state.expectedCommit ? String(state.expectedCommit) : "not provided";
  const repositoryPath = state.repositoryPath ? String(state.repositoryPath) : "not provided";
  const taskScope = state.taskScope ? String(state.taskScope) : "not provided";
  const changedFiles = formatOptionalList(state.changedFiles, "- not provided");
  const validationEvidence = formatOptionalList(state.validationEvidence, "- not provided");
  const reviewFindings = formatOptionalList(state.reviewFindings, "- none recorded");
  const primaryWorktreeRule = state.primaryWorktreePath
    ? `Primary worktree safety: do not modify, checkout, reset, stash, clean, or otherwise interfere with ${state.primaryWorktreePath}.`
    : "Primary worktree safety: if another worktree is active, do not modify or interfere with it.";

  const values = {
    featureId: state.featureId || "unknown-feature",
    featureName: state.featureName || state.featureId || "Unknown Feature",
    currentBranch: state.currentBranch || "unknown-branch",
    baseBranch: state.baseBranch || "main",
    expectedCommit,
    repositoryPath,
    taskScope,
    changedFiles,
    validationEvidence,
    reviewFindings,
    validationCommands: formatList(validationCommands),
    scopeConstraints: formatList(scopeConstraints),
    reviewDecisionFormat: REVIEW_DECISION_FORMAT,
    safetyRules: formatList(DEFAULT_SAFETY_RULES),
    humanOnlyCommands: formatList(HUMAN_ONLY_COMMANDS),
    primaryWorktreeRule,
  };

  return template.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : "";
  });
}

function generatePrompt(state, options = {}) {
  const stage = options.stage || determineNextStage(state);
  const templatePath = getTemplatePath(stage, options.templatesDir);
  const template = fs.readFileSync(templatePath, "utf8");
  return {
    stage,
    prompt: renderTemplate(template, state),
  };
}

function readState(statePath) {
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function assertRunRoot(runRoot) {
  const normalized = runRoot.replace(/\\/g, "/").replace(/\/+$/g, "");
  if (normalized !== ".agent-workflow/runs" && !normalized.startsWith(".agent-workflow/runs/")) {
    throw new Error("Run output path must be under .agent-workflow/runs/");
  }
}

function getRunDirectory(state, options = {}) {
  const runRoot = options.runRoot || ".agent-workflow/runs";
  assertRunRoot(runRoot);
  const cwd = options.cwd || process.cwd();
  const featureId = sanitizeFeatureId(state.featureId);
  return path.resolve(cwd, runRoot, featureId);
}

function createRunFilePath(state, label, options = {}) {
  const runDirectory = getRunDirectory(state, options);
  const now = options.now || (() => new Date().toISOString());
  const timestamp = sanitizeFeatureId(now());
  const safeLabel = sanitizeFeatureId(label);
  return path.join(runDirectory, `${timestamp}-${safeLabel}.md`);
}

function ensurePathInsideRunRoot(filePath, state, options = {}) {
  const runDirectory = getRunDirectory(state, options);
  const resolvedFile = path.resolve(filePath);
  const relative = path.relative(runDirectory, resolvedFile);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Run output path must stay under .agent-workflow/runs/<feature-id>/");
  }
}

function recordAgentResult(state, input, options = {}) {
  const stage = input.stage;
  assertValidStage(stage);

  let content = input.resultText;
  if (input.resultFile) {
    content = fs.readFileSync(input.resultFile, "utf8");
  }
  if (typeof content !== "string") {
    throw new Error("recordAgentResult requires resultText or resultFile");
  }

  const outputPath = input.outputPath || createRunFilePath(state, `${stage}-${input.agent || "agent"}-result`, options);
  ensurePathInsideRunRoot(outputPath, state, options);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");

  const result = {
    stage,
    agent: input.agent || "agent",
    decision: detectDecision(content),
    recordedAt: options.recordedAt || new Date().toISOString(),
    path: path.relative(options.cwd || process.cwd(), outputPath).replace(/\\/g, "/"),
  };
  if ((stage === "review" || stage === "re-review") && result.decision === "Changes Requested") {
    result.findings = content;
  }

  const nextState = {
    ...state,
    results: [...(Array.isArray(state.results) ? state.results : []), result],
  };
  if (result.findings) {
    nextState.reviewFindings = [...(Array.isArray(state.reviewFindings) ? state.reviewFindings : []), result.findings];
  }

  return { state: nextState, result, outputPath };
}

function writeGeneratedPrompt(state, options = {}) {
  const generated = generatePrompt(state, options);
  const outputPath = createRunFilePath(state, `${generated.stage}-prompt`, options);
  ensurePathInsideRunRoot(outputPath, state, options);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated.prompt, "utf8");
  return { ...generated, outputPath };
}

function listForbiddenExecutablePatterns() {
  return [
    "git push",
    "gh pr create",
    "gh pr merge",
    "gh pr ready",
    "git branch -d",
    "git push origin --delete",
  ];
}

module.exports = {
  DEFAULT_SAFETY_RULES,
  DEFAULT_VALIDATION_COMMANDS,
  HUMAN_ONLY_COMMANDS,
  WORKFLOW_STAGES,
  detectDecision,
  determineNextStage,
  createRunFilePath,
  generatePrompt,
  getRunDirectory,
  listForbiddenExecutablePatterns,
  readState,
  recordAgentResult,
  sanitizeFeatureId,
  writeGeneratedPrompt,
  writeState,
};
