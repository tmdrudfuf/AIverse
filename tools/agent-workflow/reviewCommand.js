const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const {
  DEFAULT_SAFETY_RULES,
  HUMAN_ONLY_COMMANDS,
  createRunFilePath,
  detectDecision,
  formatList,
  getRunDirectory,
  readState,
  writeState,
} = require("./agentWorkflow.js");
const {
  DEFAULT_STAGE_AGENTS,
  assertSafeCommand,
  createDefaultProcessAdapter,
  createPromptInvocation,
  resolveAgentConfig,
} = require("./agentRunner.js");

const DEFAULT_REVIEW_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_DIFF_LIMITS = { maxChars: 6000, maxLines: 200 };
const DEFAULT_STAT_LIMITS = { maxChars: 1500, maxLines: 60 };
const DEFAULT_TEXT_LIMITS = { maxChars: 4000, maxLines: 150 };

const SAME_RUNNER_WARNING = [
  "Warning: Implementer and Reviewer resolve to the same runner.",
  "Independent review is not guaranteed.",
].join("\n");

const NEXT_ACTION_BY_OUTCOME = {
  Approved: "human approval before commit, push, PR, or merge.",
  "Changes Requested": "return findings to the Implementer for a fix cycle.",
  Unknown: "inspect the saved review output and rerun the Reviewer.",
  "Execution Failed": "inspect the saved execution error and rerun the Reviewer once resolved.",
  "Timed Out": "increase --timeout-ms or investigate the Reviewer for hangs, then rerun.",
};

function truncate(text, limits = DEFAULT_DIFF_LIMITS) {
  const content = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!content) return "(none)";
  const lines = content.split("\n");
  let result = content;
  let truncated = false;
  if (lines.length > limits.maxLines) {
    result = lines.slice(0, limits.maxLines).join("\n");
    truncated = true;
  }
  if (result.length > limits.maxChars) {
    result = result.slice(0, limits.maxChars);
    truncated = true;
  }
  return truncated ? `${result}\n... (truncated)` : result;
}

function createDefaultGitAdapter() {
  return {
    run(args, cwd) {
      try {
        return execFileSync("git", args, {
          cwd,
          encoding: "utf8",
          maxBuffer: 20 * 1024 * 1024,
          windowsHide: true,
        }).trim();
      } catch (error) {
        return "";
      }
    },
    verify(ref, cwd) {
      try {
        execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], {
          cwd,
          windowsHide: true,
          stdio: "ignore",
        });
        return true;
      } catch (error) {
        return false;
      }
    },
  };
}

function resolveBaseBranchRef(gitAdapter, cwd, explicitBase) {
  const candidates = [
    explicitBase,
    explicitBase ? `origin/${explicitBase}` : undefined,
    "origin/main",
    "origin/master",
    "main",
    "master",
  ].filter(Boolean);
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (gitAdapter.verify(candidate, cwd)) return candidate;
  }
  return explicitBase || "main";
}

function collectGitContext(options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitAdapter = options.gitAdapter || createDefaultGitAdapter();

  const repositoryPath = gitAdapter.run(["rev-parse", "--show-toplevel"], cwd) || cwd;
  const currentBranch = gitAdapter.run(["rev-parse", "--abbrev-ref", "HEAD"], cwd) || "unknown-branch";
  const baseBranchInput = options.baseBranch || "main";
  const baseBranchRef = resolveBaseBranchRef(gitAdapter, cwd, baseBranchInput);
  const mergeBase = gitAdapter.verify(baseBranchRef, cwd)
    ? gitAdapter.run(["merge-base", "HEAD", baseBranchRef], cwd)
    : "";

  const stagedDiffStat = gitAdapter.run(["diff", "--cached", "--stat"], cwd);
  const stagedDiff = gitAdapter.run(["diff", "--cached"], cwd);
  const unstagedDiffStat = gitAdapter.run(["diff", "--stat"], cwd);
  const unstagedDiff = gitAdapter.run(["diff"], cwd);
  const committedLog = mergeBase ? gitAdapter.run(["log", "--oneline", `${mergeBase}..HEAD`], cwd) : "";
  const committedDiffStat = mergeBase ? gitAdapter.run(["diff", `${mergeBase}..HEAD`, "--stat"], cwd) : "";
  const committedDiff = mergeBase ? gitAdapter.run(["diff", `${mergeBase}..HEAD`], cwd) : "";
  const statusPorcelain = gitAdapter.run(["status", "--porcelain"], cwd);

  return {
    repositoryPath,
    currentBranch,
    baseBranch: baseBranchInput,
    baseBranchRef,
    mergeBase,
    stagedDiffStat,
    stagedDiff,
    unstagedDiffStat,
    unstagedDiff,
    committedLog,
    committedDiffStat,
    committedDiff,
    statusPorcelain,
    hasStagedChanges: Boolean(stagedDiffStat),
    hasUnstagedChanges: Boolean(unstagedDiffStat),
    hasCommittedChanges: Boolean(committedLog),
  };
}

function readTextFileSafe(filePath, limits) {
  try {
    return truncate(fs.readFileSync(filePath, "utf8"), limits);
  } catch (error) {
    return "(not found)";
  }
}

function resolveSpecPaths(state, repoRoot) {
  if (state.specPath) return [String(state.specPath)];
  const featureId = String(state.featureId || "").trim();
  if (!featureId) return [];
  const specsDir = path.join(repoRoot, "specs");
  let entries = [];
  try {
    entries = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error) {
    return [];
  }
  const numericPrefix = featureId.split("-")[0];
  const match = entries.find((name) => name === featureId)
    || entries.find((name) => name.startsWith(`${featureId}-`))
    || entries.find((name) => numericPrefix && name.startsWith(`${numericPrefix}-`));
  if (!match) return [];
  const specPath = path.join(specsDir, match, "spec.md");
  return fs.existsSync(specPath) ? [path.relative(repoRoot, specPath).replace(/\\/g, "/")] : [];
}

function renderTemplate(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ""
  ));
}

function buildIndependentReviewPrompt(state, gitContext, options = {}) {
  const cwd = options.cwd || process.cwd();
  const repoRoot = gitContext.repositoryPath || cwd;
  const templatePath = options.templatePath || path.join(__dirname, "templates", "independent-review.md");
  const template = fs.readFileSync(templatePath, "utf8");

  const implementer = options.implementerConfig;
  const reviewer = options.reviewerConfig;

  const specPaths = resolveSpecPaths(state, repoRoot);
  const specSummary = specPaths.length
    ? specPaths.map((relPath) => (
      `### ${relPath}\n\n${readTextFileSafe(path.join(repoRoot, relPath), DEFAULT_TEXT_LIMITS)}`
    )).join("\n\n")
    : "(no active feature spec found)";

  const agentsInstructions = readTextFileSafe(path.join(repoRoot, "AGENTS.md"), DEFAULT_TEXT_LIMITS);
  const claudeMdPath = path.join(repoRoot, "CLAUDE.md");
  const claudeInstructions = fs.existsSync(claudeMdPath)
    ? readTextFileSafe(claudeMdPath, { maxChars: 2000, maxLines: 80 })
    : "(not present)";

  const changedFilesSummary = gitContext.statusPorcelain
    ? truncate(gitContext.statusPorcelain, { maxChars: 3000, maxLines: 150 })
    : "(no changes)";

  const validationEvidence = Array.isArray(state.validationEvidence) && state.validationEvidence.length
    ? formatList(state.validationEvidence)
    : "- not provided";

  const latestResult = Array.isArray(state.results) && state.results.length
    ? state.results[state.results.length - 1]
    : undefined;
  const workflowStateSummary = [
    `Feature: ${state.featureId || "unknown-feature"} - ${state.featureName || "Unknown Feature"}`,
    `Latest recorded stage: ${latestResult ? latestResult.stage : "none"}`,
    `Latest recorded decision: ${latestResult ? (latestResult.decision || "Unknown") : "none"}`,
  ].join("\n");

  const values = {
    featureId: state.featureId || "unknown-feature",
    featureName: state.featureName || state.featureId || "Unknown Feature",
    repositoryPath: repoRoot,
    currentBranch: gitContext.currentBranch,
    baseBranch: gitContext.baseBranchRef || gitContext.baseBranch,
    mergeBase: gitContext.mergeBase || "(no common ancestor found)",
    implementerIdentity: implementer ? implementer.identity : "not configured",
    reviewerIdentity: reviewer ? reviewer.identity : "not configured",
    specSummary,
    agentsInstructions,
    claudeInstructions,
    workflowStateSummary,
    validationEvidence,
    changedFilesSummary,
    stagedDiff: `${truncate(gitContext.stagedDiffStat, DEFAULT_STAT_LIMITS)}\n\n${truncate(gitContext.stagedDiff)}`,
    unstagedDiff: `${truncate(gitContext.unstagedDiffStat, DEFAULT_STAT_LIMITS)}\n\n${truncate(gitContext.unstagedDiff)}`,
    committedLog: gitContext.committedLog
      ? truncate(gitContext.committedLog, { maxChars: 2000, maxLines: 100 })
      : "(no commits ahead of base)",
    committedDiff: `${truncate(gitContext.committedDiffStat, DEFAULT_STAT_LIMITS)}\n\n${truncate(gitContext.committedDiff)}`,
    safetyRules: formatList(DEFAULT_SAFETY_RULES),
    humanOnlyCommands: formatList(HUMAN_ONLY_COMMANDS),
  };

  return renderTemplate(template, values);
}

function resolveRoleRunner(state, role, explicitAgentId) {
  const stageAgents = { ...DEFAULT_STAGE_AGENTS, ...(state.stageAgents || {}) };
  const stageKey = role === "reviewer" ? "review" : "implement";
  const fallbackId = role === "reviewer" ? "reviewer" : "implementer";
  const agentId = explicitAgentId || stageAgents[stageKey] || fallbackId;
  return resolveAgentConfig(state, agentId);
}

function runnersMatch(a, b) {
  if (!a || !b) return false;
  return a.command === b.command && JSON.stringify(a.args) === JSON.stringify(b.args);
}

function classifyReviewOutcome(result, outputText) {
  if (result.timedOut) return "Timed Out";
  if (result.errorMessage || result.interrupted || result.signal || result.exitCode !== 0) {
    return "Execution Failed";
  }
  return detectDecision(outputText);
}

function previewIndependentReview(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = collectGitContext({
    cwd,
    baseBranch: options.baseBranch || state.baseBranch,
    gitAdapter: options.gitAdapter,
  });
  const implementerConfig = resolveRoleRunner(state, "implementer");
  const reviewerConfig = resolveRoleRunner(state, "reviewer", options.agentId);
  assertSafeCommand(reviewerConfig);
  const sameRunner = runnersMatch(implementerConfig, reviewerConfig);

  const prompt = buildIndependentReviewPrompt(state, gitContext, { cwd, implementerConfig, reviewerConfig });
  const invocation = createPromptInvocation(reviewerConfig, "{{prompt}}");
  const promptPath = createRunFilePath(state, "independent-review-prompt", { cwd }).replace(/\\/g, "/");
  const runDirectory = getRunDirectory(state, { cwd }).replace(/\\/g, "/");

  return {
    dryRun: true,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    implementerId: implementerConfig.agentId,
    implementerIdentity: implementerConfig.identity,
    sameRunner,
    commandPreview: [reviewerConfig.command, ...invocation.args].filter(Boolean).join(" "),
    promptPreview: truncate(prompt, { maxChars: 1200, maxLines: 40 }),
    promptPath,
    runDirectory,
    repositoryContext: {
      repositoryPath: gitContext.repositoryPath,
      currentBranch: gitContext.currentBranch,
      baseBranch: gitContext.baseBranchRef,
      mergeBase: gitContext.mergeBase,
      hasStagedChanges: gitContext.hasStagedChanges,
      hasUnstagedChanges: gitContext.hasUnstagedChanges,
      hasCommittedChanges: gitContext.hasCommittedChanges,
    },
    willSpawn: false,
  };
}

async function runIndependentReview(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const now = options.now || (() => new Date().toISOString());
  const gitContext = collectGitContext({
    cwd,
    baseBranch: options.baseBranch || state.baseBranch,
    gitAdapter: options.gitAdapter,
  });
  const implementerConfig = resolveRoleRunner(state, "implementer");
  const reviewerConfig = resolveRoleRunner(state, "reviewer", options.agentId);
  assertSafeCommand(reviewerConfig);
  const sameRunner = runnersMatch(implementerConfig, reviewerConfig);

  const prompt = buildIndependentReviewPrompt(state, gitContext, { cwd, implementerConfig, reviewerConfig });
  const promptPath = createRunFilePath(state, "independent-review-prompt", { cwd, now });
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt, "utf8");

  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const invocation = createPromptInvocation(reviewerConfig, prompt);
  const timeoutMs = options.timeoutMs || reviewerConfig.timeoutMs || DEFAULT_REVIEW_TIMEOUT_MS;
  const startedAt = now();
  const result = await adapter.run(reviewerConfig.command, invocation.args, {
    cwd,
    input: invocation.input,
    timeoutMs,
  });
  const completedAt = now();
  const outputText = [result.stdout || "", result.stderr || ""].filter(Boolean).join("\n");
  const outcome = classifyReviewOutcome(result, outputText);

  const executionRecord = {
    featureId: state.featureId,
    kind: "independent-review",
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    implementerId: implementerConfig.agentId,
    implementerIdentity: implementerConfig.identity,
    sameRunner,
    command: reviewerConfig.command,
    args: invocation.args,
    startedAt,
    completedAt,
    durationMs: result.durationMs || 0,
    exitCode: result.exitCode,
    signal: result.signal || null,
    timedOut: Boolean(result.timedOut),
    interrupted: Boolean(result.interrupted),
    errorMessage: result.errorMessage || "",
    outcome,
    currentBranch: gitContext.currentBranch,
    baseBranch: gitContext.baseBranchRef,
    mergeBase: gitContext.mergeBase,
  };

  const executionPath = createRunFilePath(state, "independent-review-execution", { cwd, now });
  fs.mkdirSync(path.dirname(executionPath), { recursive: true });
  fs.writeFileSync(executionPath, `${JSON.stringify(executionRecord, null, 2)}\n`, "utf8");

  const resultPath = createRunFilePath(state, "independent-review-result", { cwd, now });
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, outputText || "(empty reviewer output)", "utf8");

  const reviewRunRecord = {
    outcome,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    implementerId: implementerConfig.agentId,
    sameRunner,
    recordedAt: completedAt,
    promptPath: path.relative(cwd, promptPath).replace(/\\/g, "/"),
    executionPath: path.relative(cwd, executionPath).replace(/\\/g, "/"),
    resultPath: path.relative(cwd, resultPath).replace(/\\/g, "/"),
  };

  const nextState = {
    ...state,
    reviewRuns: [...(Array.isArray(state.reviewRuns) ? state.reviewRuns : []), reviewRunRecord],
  };

  return {
    state: nextState,
    outcome,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    implementerId: implementerConfig.agentId,
    sameRunner,
    executionRecord,
    promptPath,
    executionPath,
    resultPath,
  };
}

async function runIndependentReviewAndPersist(statePath, options = {}) {
  const state = readState(statePath);
  const run = await runIndependentReview(state, options);
  writeState(statePath, run.state);
  return { ...run, statePath };
}

module.exports = {
  DEFAULT_REVIEW_TIMEOUT_MS,
  NEXT_ACTION_BY_OUTCOME,
  SAME_RUNNER_WARNING,
  buildIndependentReviewPrompt,
  classifyReviewOutcome,
  collectGitContext,
  createDefaultGitAdapter,
  previewIndependentReview,
  resolveRoleRunner,
  resolveSpecPaths,
  runIndependentReview,
  runIndependentReviewAndPersist,
  runnersMatch,
};
