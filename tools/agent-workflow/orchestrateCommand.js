const fs = require("fs");
const path = require("path");

const {
  DEFAULT_SAFETY_RULES,
  HUMAN_ONLY_COMMANDS,
  createRunFilePath,
  formatList,
  getRunDirectory,
  readState,
  writeState,
} = require("./agentWorkflow.js");
const {
  assertSafeCommand,
  createDefaultProcessAdapter,
  createPromptInvocation,
  isRemoteMutatingCommand,
  resolveAgentConfig,
} = require("./agentRunner.js");
const {
  buildIndependentReviewPrompt,
  collectGitContext,
  classifyReviewOutcome,
  resolveRoleRunner,
  resolveSpecPaths,
  runnersMatch,
} = require("./reviewCommand.js");
const { analyzeStructuredReview } = require("./structuredReview.js");
const { parseStructuredAnswers } = require("./structuredAnswers.js");
const { formatFindingHistoryForPrompt, normalizeFindingLifecycle } = require("./findingLifecycle.js");
const { resolveEffectiveRoles } = require("./roleResolver.js");
const { refreshRunSummary } = require("./runSummary.js");
const {
  FULL_STAGE_NAME,
  VALIDATION_TRIGGER_REASONS,
  commandsForPhase,
  computeValidationTarget,
  resolvePhaseForStage,
  resolveValidationPolicy,
} = require("./validationPolicy.js");
const { buildValidationRecordFields } = require("./validationPhase.js");
const { buildValidationPlanPreview } = require("./validationPlan.js");

const ORCHESTRATION_STAGES = [
  "implement",
  "validate",
  "review",
  "answer-questions",
  "final-review",
  "fix",
  "revalidate",
  "re-review",
  "final-verification",
  "human-merge-decision",
  "blocked",
];

const DEFAULT_MAX_FIX_CYCLES = 2;
const DEFAULT_MAX_QUESTION_CYCLES = 1;
const DEFAULT_VALIDATION_TIMEOUT_MS = 5 * 60 * 1000;
const TERMINAL_STAGES = new Set(["human-merge-decision", "blocked"]);

function normalizeMaxFixCycles(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_MAX_FIX_CYCLES;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : DEFAULT_MAX_FIX_CYCLES;
}

function normalizeMaxQuestionCycles(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_MAX_QUESTION_CYCLES;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(Math.floor(parsed), DEFAULT_MAX_QUESTION_CYCLES) : DEFAULT_MAX_QUESTION_CYCLES;
}

function getOrchestration(state) {
  return state.orchestration && typeof state.orchestration === "object" ? state.orchestration : {};
}

function getCurrentStage(state) {
  const orchestration = getOrchestration(state);
  if (ORCHESTRATION_STAGES.includes(orchestration.currentStage)) return orchestration.currentStage;
  if (state.terminalState === "human-merge-decision") return "human-merge-decision";
  if (state.terminalState === "blocked") return "blocked";
  return "implement";
}

function getPinnedRunRoles(state) {
  const orchestration = getOrchestration(state);
  if (
    orchestration.startedAt
    && orchestration.resolvedImplementerId
    && orchestration.resolvedReviewerId
    && !TERMINAL_STAGES.has(getCurrentStage(state))
  ) {
    return {
      implementer: orchestration.resolvedImplementerId,
      reviewer: orchestration.resolvedReviewerId,
      source: orchestration.roleResolutionSource || "resume",
    };
  }
  return undefined;
}

function resolveOrchestrationRoles(state, options = {}) {
  const resolution = resolveEffectiveRoles({
    state,
    requestedImplementerId: options.implementerAgentId,
    existingRunRoles: getPinnedRunRoles(state),
  });
  if (!resolution.ok) {
    throw new Error(resolution.diagnostics.join(" "));
  }
  return resolution;
}

// Retained for prompt display (the full command list is the ultimate bar an
// Implementer's change must clear) and dry-run/back-compat consumers; the
// real phase-aware command selection for a specific stage occurrence lives in
// resolveValidationPolicy/resolvePhaseForStage/commandsForPhase below, which
// this function now delegates to rather than duplicating the resolution
// precedence.
function getValidationCommands(state, options = {}) {
  if (options.skipValidation) return [];
  return resolveValidationPolicy(state, options).fullCommands;
}

function createCommandPreview(agent) {
  const args = agent.args.map((arg) => (arg === "{{prompt}}" || arg === "{prompt}" ? "{{prompt}}" : arg));
  return [agent.command, ...args].filter(Boolean).join(" ");
}

function renderTemplate(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ""
  ));
}

function readTextFileSafe(filePath, maxChars = 4000) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.length > maxChars ? `${content.slice(0, maxChars)}\n... (truncated)` : content;
  } catch (error) {
    return "(not found)";
  }
}

function buildSpecSummary(state, repoRoot) {
  const specPaths = resolveSpecPaths(state, repoRoot);
  if (!specPaths.length) return "(no active feature spec found)";
  return specPaths.map((specPath) => (
    `### ${specPath}\n\n${readTextFileSafe(path.join(repoRoot, specPath))}`
  )).join("\n\n");
}

function formatFindings(findings, rawOutput) {
  if (Array.isArray(findings) && findings.length) {
    return findings.map((finding, index) => {
      const lines = [`Finding ${finding.id || index + 1}:`];
      if (finding.severity) lines.push(`Severity: ${finding.severity}`);
      if (finding.filePath) lines.push(`File: ${finding.filePath}`);
      if (finding.location) lines.push(`Location: ${finding.location}`);
      if (finding.summary) lines.push(`Summary: ${finding.summary}`);
      if (finding.problem) lines.push(`Problem: ${finding.problem}`);
      if (finding.impact) lines.push(`Impact: ${finding.impact}`);
      if (finding.reason) lines.push(`Reason: ${finding.reason}`);
      if (finding.recommendation) lines.push(`Recommended correction: ${finding.recommendation}`);
      if (finding.rawText) lines.push(`Raw text: ${finding.rawText}`);
      return lines.join("\n");
    }).join("\n\n");
  }
  return rawOutput || "- none recorded";
}

function getFindingHistory(state) {
  const orchestration = getOrchestration(state);
  return Array.isArray(state.findingHistory)
    ? state.findingHistory
    : (Array.isArray(orchestration.findingHistory) ? orchestration.findingHistory : []);
}

function getActiveBlockingFindings(state) {
  const orchestration = getOrchestration(state);
  if (Array.isArray(orchestration.activeBlockingFindings)) return orchestration.activeBlockingFindings;
  return getFindingHistory(state)
    .filter((entry) => entry.kind === "blocking" && entry.currentStatus !== "resolved" && entry.finding)
    .map((entry) => entry.finding);
}

function buildImplementerPrompt(state, stage, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = options.gitContext || collectGitContext({ cwd, baseBranch: state.baseBranch });
  const repoRoot = gitContext.repositoryPath || cwd;
  const templatePath = options.templatePath || path.join(__dirname, "templates", "orchestrate-implement.md");
  const template = fs.readFileSync(templatePath, "utf8");
  const orchestration = getOrchestration(state);
  const values = {
    stageTitle: stage === "fix" ? "Fix" : "Implement",
    featureId: state.featureId || "unknown-feature",
    featureName: state.featureName || state.featureId || "Unknown Feature",
    repositoryPath: repoRoot,
    currentBranch: gitContext.currentBranch || state.currentBranch || "unknown-branch",
    baseBranch: gitContext.baseBranchRef || state.baseBranch || "main",
    stage,
    specSummary: buildSpecSummary(state, repoRoot),
    taskScope: state.taskScope || `Complete the active Spec Kit tasks for ${state.featureId || "this feature"}.`,
    reviewFindings: stage === "fix"
      ? (orchestration.pendingFixTriggerReason === VALIDATION_TRIGGER_REASONS.FULL_VALIDATION_RETRY
        ? `Final full validation must pass before this feature can be ready; no Reviewer findings are pending. Full validation reported:\n\n${orchestration.latestFullValidationFailureSummary || "(no summary recorded)"}`
        : formatFindings(getActiveBlockingFindings(state).length ? getActiveBlockingFindings(state) : orchestration.latestFindings, orchestration.latestReviewOutput || ""))
      : "- none for initial implementation",
    previousReviewPath: orchestration.latestReviewPath || "none",
    validationCommands: formatList(getValidationCommands(state, options)),
    scopeConstraints: formatList(Array.isArray(state.scopeConstraints) && state.scopeConstraints.length
      ? state.scopeConstraints
      : ["Keep changes scoped to the active feature.", "Do not make unrelated refactors."]),
    safetyRules: formatList(DEFAULT_SAFETY_RULES),
    humanOnlyCommands: formatList(HUMAN_ONLY_COMMANDS),
  };
  return renderTemplate(template, values);
}

function formatJson(value) {
  return JSON.stringify(value || null, null, 2);
}

function buildAnswerPrompt(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = options.gitContext || collectGitContext({ cwd, baseBranch: state.baseBranch });
  const repoRoot = gitContext.repositoryPath || cwd;
  const templatePath = options.templatePath || path.join(__dirname, "templates", "orchestrate-answer-questions.md");
  const template = fs.readFileSync(templatePath, "utf8");
  const orchestration = getOrchestration(state);
  const values = {
    featureId: state.featureId || "unknown-feature",
    featureName: state.featureName || state.featureId || "Unknown Feature",
    repositoryPath: repoRoot,
    currentBranch: gitContext.currentBranch || state.currentBranch || "unknown-branch",
    baseBranch: gitContext.baseBranchRef || state.baseBranch || "main",
    specSummary: buildSpecSummary(state, repoRoot),
    taskScope: state.taskScope || `Answer Reviewer clarification questions for ${state.featureId || "this feature"}.`,
    questionReviewPath: orchestration.latestReviewPath || "none",
    structuredQuestionPath: orchestration.latestReviewerQuestionPath || "none",
    questionsJson: formatJson(orchestration.latestReviewerQuestions || state.latestReviewerQuestions || []),
    rawQuestionReview: orchestration.latestReviewOutput || "",
    safetyRules: formatList(DEFAULT_SAFETY_RULES),
    humanOnlyCommands: formatList(HUMAN_ONLY_COMMANDS),
  };
  return renderTemplate(template, values);
}

function buildFinalReviewPrompt(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = options.gitContext || collectGitContext({ cwd, baseBranch: state.baseBranch });
  const repoRoot = gitContext.repositoryPath || cwd;
  const templatePath = options.templatePath || path.join(__dirname, "templates", "orchestrate-final-review.md");
  const template = fs.readFileSync(templatePath, "utf8");
  const orchestration = getOrchestration(state);
  const values = {
    featureId: state.featureId || "unknown-feature",
    featureName: state.featureName || state.featureId || "Unknown Feature",
    repositoryPath: repoRoot,
    currentBranch: gitContext.currentBranch || state.currentBranch || "unknown-branch",
    baseBranch: gitContext.baseBranchRef || state.baseBranch || "main",
    mergeBase: gitContext.mergeBase || "(no common ancestor found)",
    specSummary: buildSpecSummary(state, repoRoot),
    taskScope: state.taskScope || `Complete final review for ${state.featureId || "this feature"}.`,
    originalReviewPath: orchestration.latestReviewPath || "none",
    structuredQuestionPath: orchestration.latestReviewerQuestionPath || "none",
    rawQuestionReview: orchestration.latestReviewOutput || "",
    questionsJson: formatJson(orchestration.latestReviewerQuestions || state.latestReviewerQuestions || []),
    answerPath: orchestration.latestImplementerAnswerPath || "none",
    rawAnswerOutput: orchestration.latestImplementerAnswerOutput || "",
    answersJson: formatJson(orchestration.latestImplementerAnswers || state.latestImplementerAnswers || {}),
    findingHistory: formatFindingHistoryForPrompt(getFindingHistory(state)),
    validationCommands: formatList(getValidationCommands(state, options)),
    safetyRules: formatList(DEFAULT_SAFETY_RULES),
    humanOnlyCommands: formatList(HUMAN_ONLY_COMMANDS),
  };
  return renderTemplate(template, values);
}

function parseValidationCommand(commandText) {
  const text = String(commandText || "").trim();
  const args = [];
  let current = "";
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === "\\" && quote === "\"" && index + 1 < text.length) {
        index += 1;
        current += text[index];
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === "\"") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }
    if (char === "\\" && index + 1 < text.length) {
      index += 1;
      current += text[index];
      continue;
    }
    current += char;
  }
  if (quote) throw new Error("Validation command contains an unterminated quote");
  if (current) args.push(current);
  if (!args.length) throw new Error("Validation command is required");
  return { command: args[0], args: args.slice(1) };
}

function assertSafeValidationCommand(invocation) {
  if (isRemoteMutatingCommand(invocation.command, invocation.args)) {
    throw new Error("Remote-mutating validation commands are human-only and cannot be executed by the orchestrator");
  }
  const commandName = path.basename(invocation.command).toLowerCase().replace(/\.(cmd|exe)$/i, "");
  const shellPayloadFlags = new Set(["-c", "/c", "-command"]);
  if (["sh", "bash", "zsh", "cmd", "powershell", "pwsh"].includes(commandName)) {
    for (let index = 0; index < invocation.args.length - 1; index += 1) {
      if (shellPayloadFlags.has(String(invocation.args[index]).toLowerCase())) {
        assertSafeValidationCommand(parseValidationCommand(invocation.args[index + 1]));
      }
    }
  }
}

function findOnPath(command) {
  const commandText = String(command || "");
  const candidates = [];
  const hasPathSegment = commandText.includes("/") || commandText.includes("\\");
  const extensions = process.platform === "win32"
    ? ["", ".exe", ".cmd", ".bat", ".ps1"]
    : [""];
  if (hasPathSegment) {
    candidates.push(commandText);
  } else {
    const pathDirs = String(process.env.PATH || "").split(path.delimiter).filter(Boolean);
    for (const dir of pathDirs) {
      for (const extension of extensions) candidates.push(path.join(dir, `${commandText}${extension}`));
    }
  }
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function resolveValidationInvocation(invocation) {
  if (process.platform !== "win32") return invocation;
  const commandName = path.basename(invocation.command).toLowerCase().replace(/\.(cmd|exe|ps1)$/i, "");
  if (!["npm", "npx"].includes(commandName)) return invocation;
  const shimPath = findOnPath(invocation.command);
  if (!shimPath) return invocation;
  const shimDir = path.dirname(shimPath);
  const nodeExe = fs.existsSync(path.join(shimDir, "node.exe")) ? path.join(shimDir, "node.exe") : process.execPath;
  const cliName = commandName === "npm" ? "npm-cli.js" : "npx-cli.js";
  const cliPath = path.join(shimDir, "node_modules", "npm", "bin", cliName);
  if (!fs.existsSync(cliPath)) return invocation;
  return {
    command: nodeExe,
    args: [cliPath, ...invocation.args],
    originalCommand: invocation.command,
  };
}

function relativePath(cwd, filePath) {
  return filePath ? path.relative(cwd, filePath).replace(/\\/g, "/") : undefined;
}

function appendRecord(state, key, record) {
  return {
    ...state,
    [key]: [...(Array.isArray(state[key]) ? state[key] : []), record],
  };
}

function setOrchestration(state, patch) {
  return {
    ...state,
    orchestration: {
      ...getOrchestration(state),
      ...patch,
      updatedAt: patch.updatedAt || new Date().toISOString(),
    },
  };
}

function markBlocked(state, reason, extra = {}) {
  return setOrchestration({
    ...state,
    terminalState: "blocked",
    nextExpectedAction: reason,
  }, {
    currentStage: "blocked",
    terminalState: "blocked",
    decision: "Blocked",
    reason,
    nextExpectedAction: reason,
    ...extra,
  });
}

function markHumanGate(state) {
  return setOrchestration({
    ...state,
    terminalState: "human-merge-decision",
    nextExpectedAction: "human merge decision",
  }, {
    currentStage: "human-merge-decision",
    terminalState: "human-merge-decision",
    decision: "Ready for human merge decision",
    nextExpectedAction: "human approval before push, PR, readiness, approval, merge, or remote deletion.",
  });
}

function statusFromResult(result) {
  if (result.timedOut) return "timed-out";
  if (result.interrupted || result.signal) return "interrupted";
  if (result.errorMessage || result.exitCode !== 0) return "failed";
  return "passed";
}

// final-verification's own trigger reason never depends on how it got here
// (it is always because a valid Approval candidate exists); validate is
// always the first occurrence after implement; revalidate's reason depends on
// which kind of fix preceded it, tracked via the pendingFixTriggerReason
// marker set immediately before entering "fix" (see the review-stage and
// full-validation-failure handling below) -- never inferred, always read from
// what was explicitly set.
function determineValidationTriggerReason(state, stage, phase, options) {
  if (stage === FULL_STAGE_NAME) return VALIDATION_TRIGGER_REASONS.FULL_VALIDATION_CANDIDATE;
  if (phase === "full" && options.forceFullValidation) return VALIDATION_TRIGGER_REASONS.MANUAL_REQUEST;
  if (stage === "validate") return VALIDATION_TRIGGER_REASONS.INITIAL_IMPLEMENTATION;
  const pending = getOrchestration(state).pendingFixTriggerReason;
  return pending === VALIDATION_TRIGGER_REASONS.FULL_VALIDATION_RETRY
    ? VALIDATION_TRIGGER_REASONS.FULL_VALIDATION_RETRY
    : VALIDATION_TRIGGER_REASONS.REVIEWER_FIX;
}

async function runValidationCommands(state, stage, options = {}) {
  const cwd = options.cwd || process.cwd();
  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const policy = resolveValidationPolicy(state, options);
  const phase = options.skipValidation ? null : resolvePhaseForStage(policy, stage, options);
  const commands = options.skipValidation ? [] : commandsForPhase(policy, phase);
  const triggerReason = options.skipValidation ? null : determineValidationTriggerReason(state, stage, phase, options);
  const gitContextForTarget = options.gitContext || collectGitContext({ cwd, baseBranch: state.baseBranch });
  const target = options.skipValidation ? null : computeValidationTarget(gitContextForTarget);
  const records = [];
  // Always set explicitly (never conditionally left stale): this must
  // reflect whether *this* occurrence was skipped, not "was any occurrence
  // ever skipped" -- otherwise a later invocation that runs real validation
  // commands would still be masked behind an earlier skip.
  let nextState = setOrchestration(state, { validationSkipped: Boolean(options.skipValidation) });
  // A monotonically increasing marker shared by every command in this one
  // call, so consumers (the run-summary stage-timeline reconstruction) can
  // reliably group records into the occurrence they actually belong to,
  // regardless of whether every command in it passed (no other signal --
  // like "stops at the first failure" -- can distinguish a fully-passing
  // occurrence from the next one).
  const validationBatchId = Number(getOrchestration(nextState).nextValidationBatchId || 0) + 1;
  nextState = setOrchestration(nextState, { nextValidationBatchId: validationBatchId });

  for (const commandText of commands) {
    const validationInvocation = parseValidationCommand(commandText);
    assertSafeValidationCommand(validationInvocation);
    const spawnInvocation = resolveValidationInvocation(validationInvocation);
    const startedAt = new Date().toISOString();
    const result = await adapter.run(spawnInvocation.command, spawnInvocation.args, {
      cwd,
      timeoutMs: options.timeoutMs || DEFAULT_VALIDATION_TIMEOUT_MS,
    });
    const completedAt = new Date().toISOString();
    const record = {
      featureId: state.featureId,
      stage,
      batchId: validationBatchId,
      command: commandText,
      commandExecutable: spawnInvocation.command,
      args: spawnInvocation.args,
      originalCommandExecutable: spawnInvocation.originalCommand || validationInvocation.command,
      startedAt,
      completedAt,
      durationMs: result.durationMs || 0,
      exitCode: result.exitCode,
      signal: result.signal || null,
      timedOut: Boolean(result.timedOut),
      interrupted: Boolean(result.interrupted),
      errorMessage: result.errorMessage || "",
      terminationReason: result.terminationReason || "",
      terminationRequestedAt: result.terminationRequestedAt || null,
      terminationRequestedBy: result.terminationRequestedBy || "",
      configuredTimeoutMs: result.configuredTimeoutMs || options.timeoutMs || DEFAULT_VALIDATION_TIMEOUT_MS,
      gracePeriodMs: result.gracePeriodMs || null,
      parentSignal: result.parentSignal || null,
      childCloseObservedAt: result.childCloseObservedAt || null,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      status: statusFromResult(result),
      ...buildValidationRecordFields({ phase, triggerReason, target }),
    };
    const artifactPath = createRunFilePath(state, `${stage}-validation`, { cwd });
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    record.path = relativePath(cwd, artifactPath);
    records.push(record);
    nextState = appendRecord(nextState, "validationRuns", record);
    if (record.status !== "passed") {
      return { state: nextState, records, passed: false, failedRecord: record, phase, target };
    }
  }

  return { state: nextState, records, passed: true, phase, target };
}

async function runAgentPrompt(state, stage, agent, prompt, options = {}) {
  const cwd = options.cwd || process.cwd();
  assertSafeCommand(agent);
  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const promptPath = createRunFilePath(state, `${stage}-${agent.agentId}-prompt`, { cwd });
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt, "utf8");
  const invocation = createPromptInvocation(agent, prompt);
  const startedAt = new Date().toISOString();
  const result = await adapter.run(agent.command, invocation.args, {
    cwd,
    input: invocation.input,
    timeoutMs: options.timeoutMs || agent.timeoutMs,
  });
  const completedAt = new Date().toISOString();
  const outputText = [result.stdout || "", result.stderr || ""].filter(Boolean).join("\n");
  const successful = result.exitCode === 0 && !result.timedOut && !result.interrupted && !result.signal && !result.errorMessage;
  const record = {
    featureId: state.featureId,
    stage,
    agentId: agent.agentId,
    agentIdentity: agent.identity,
    command: agent.command,
    args: invocation.args,
    startedAt,
    completedAt,
    durationMs: result.durationMs || 0,
    exitCode: result.exitCode,
    signal: result.signal || null,
    timedOut: Boolean(result.timedOut),
    interrupted: Boolean(result.interrupted),
    errorMessage: result.errorMessage || "",
    terminationReason: result.terminationReason || "",
    terminationRequestedAt: result.terminationRequestedAt || null,
    terminationRequestedBy: result.terminationRequestedBy || "",
    configuredTimeoutMs: result.configuredTimeoutMs || options.timeoutMs || agent.timeoutMs,
    gracePeriodMs: result.gracePeriodMs || null,
    parentSignal: result.parentSignal || null,
    childCloseObservedAt: result.childCloseObservedAt || null,
    outputState: successful ? "ok" : statusFromResult(result),
    promptPath: relativePath(cwd, promptPath),
  };
  const executionPath = createRunFilePath(state, `${stage}-${agent.agentId}-execution`, { cwd });
  fs.writeFileSync(executionPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  const resultPath = createRunFilePath(state, `${stage}-${agent.agentId}-result`, { cwd });
  fs.writeFileSync(resultPath, outputText || "(empty output)", "utf8");
  return {
    successful,
    outputText,
    record: {
      ...record,
      path: relativePath(cwd, executionPath),
      resultPath: relativePath(cwd, resultPath),
    },
    promptPath,
    executionPath,
    resultPath,
  };
}

function extractReviewFindings(outputText) {
  const content = String(outputText || "").trim();
  if (!content) return [];
  const sections = content.split(/\n(?=(?:[-*]\s+)?(?:File|Path|Location|Problem|Impact|Recommended correction|Recommendation|Severity):)/i);
  const candidates = sections.length > 1 ? sections : content.split(/\n\s*\n/);
  return candidates.map((block) => {
    const rawText = block.trim();
    if (!rawText) return undefined;
    const filePath = matchField(rawText, "File|Path") || (rawText.match(/[\w./\\-]+\.(?:js|ts|tsx|md|json)(?::\d+)?/) || [])[0];
    const location = matchField(rawText, "Location|Line|Function") || (rawText.match(/(?:line|function)\s+[\w:.-]+/i) || [])[0];
    const problem = matchField(rawText, "Problem");
    const impact = matchField(rawText, "Impact|Why it matters");
    const recommendation = matchField(rawText, "Recommended correction|Recommendation|Fix");
    if (!filePath && !location && !problem && !recommendation) return undefined;
    return { filePath, location, problem, impact, recommendation, rawText };
  }).filter(Boolean);
}

function matchField(text, labelPattern) {
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:${labelPattern})\\s*:\\s*(.+)`, "i"));
  return match ? match[1].trim() : undefined;
}

function getDiffSignature(gitContext) {
  return [
    gitContext.statusPorcelain || "",
    gitContext.unstagedDiffStat || "",
    gitContext.stagedDiff || "",
    gitContext.unstagedDiff || "",
    gitContext.committedDiffStat || "",
    gitContext.committedDiff || "",
  ].join("\n").trim();
}

function getAnswerStageEditSignature(gitContext) {
  const nonWorkflowStatus = String(gitContext.statusPorcelain || "")
    .split(/\r?\n/)
    .filter((line) => line && !/^\?\?\s+\.agent-workflow(?:\/|\\|$)/.test(line))
    .join("\n");
  return [
    nonWorkflowStatus,
    gitContext.stagedDiff || "",
    gitContext.unstagedDiff || "",
    gitContext.committedLog || "",
    gitContext.committedDiffStat || "",
    gitContext.committedDiff || "",
  ].join("\n").trim();
}

function nextStageAfterCompleted(state, completedStage) {
  if (completedStage === "implement") return "validate";
  if (completedStage === "validate") return "review";
  if (completedStage === "answer-questions") return "final-review";
  if (completedStage === "fix") return "revalidate";
  if (completedStage === "revalidate") return "re-review";
  if (completedStage === "final-verification") return "human-merge-decision";
  return getCurrentStage(state);
}

function persistStage(statePath, state, currentStage, extra = {}) {
  const nextState = setOrchestration(state, {
    currentStage,
    ...extra,
  });
  if (statePath) writeState(statePath, nextState);
  return nextState;
}

async function executeReviewStage(state, reviewStage, options = {}) {
  const cwd = options.cwd || process.cwd();
  const reviewRun = await runReviewWithoutStateWrite(state, reviewStage, options);
  const findings = reviewRun.outcome === "Changes Requested"
    ? extractFindingsForHandoff(reviewRun.outputText, reviewRun.structuredReviewAnalysis)
    : [];
  const nextState = {
    ...reviewRun.state,
    latestReviewDecision: reviewRun.outcome,
    latestStructuredReviewStatus: reviewRun.structuredReviewAnalysis.status,
    latestStructuredReviewDiagnostics: reviewRun.structuredReviewAnalysis.diagnostics || [],
    latestStructuredReviewDecision: reviewRun.structuredReviewAnalysis.decision || "Unknown",
  };
  if (reviewRun.structuredReviewAnalysis.status === "valid") {
    nextState.latestStructuredReview = reviewRun.structuredReviewAnalysis.review;
    nextState.latestStructuredReviewPath = relativePath(cwd, reviewRun.structuredReviewPath);
  }
  return {
    ...reviewRun,
    state: setOrchestration(nextState, {
      currentStage: reviewStage,
      latestReviewDecision: reviewRun.outcome,
      latestReviewPath: relativePath(cwd, reviewRun.resultPath),
      latestReviewOutput: reviewRun.outputText,
      latestFindings: findings,
      latestStructuredReviewStatus: reviewRun.structuredReviewAnalysis.status,
      latestStructuredReviewPath: relativePath(cwd, reviewRun.structuredReviewPath),
      latestStructuredReviewDiagnostics: reviewRun.structuredReviewAnalysis.diagnostics || [],
    }),
    findings,
  };
}

function nextReviewSequence(state) {
  const orchestration = getOrchestration(state);
  return Number(state.reviewSequence || orchestration.reviewSequence || 0) + 1;
}

function writeLifecycleArtifact(state, lifecycle, label, options = {}) {
  const cwd = options.cwd || process.cwd();
  const artifactPath = createRunFilePath(state, `${label}-finding-lifecycle`, { cwd }).replace(/\.md$/i, ".json");
  fs.writeFileSync(artifactPath, `${JSON.stringify(lifecycle, null, 2)}\n`, "utf8");
  return relativePath(cwd, artifactPath);
}

function applyFindingLifecycle(state, review, reviewStage, options = {}) {
  if (!["Approved", "Changes Requested"].includes(review.outcome)) return { state, ok: true, findings: review.findings };
  const cwd = options.cwd || process.cwd();
  const previousHistory = getFindingHistory(state);
  if (review.structuredReviewAnalysis.status !== "valid") {
    if (previousHistory.length) {
      const diagnostics = ["Valid structured lifecycle data is required when previous structured findings exist."];
      const nextState = setOrchestration({
        ...state,
        latestFindingLifecycleStatus: review.structuredReviewAnalysis.status,
        latestFindingLifecycleDiagnostics: diagnostics,
      }, {
        latestFindingLifecycleStatus: review.structuredReviewAnalysis.status,
        latestFindingLifecycleDiagnostics: diagnostics,
      });
      return { state: nextState, ok: false, diagnostics };
    }
    return { state, ok: true, findings: review.findings };
  }

  const reviewSequence = nextReviewSequence(state);
  const lifecycleResult = normalizeFindingLifecycle(review.structuredReviewAnalysis.review, previousHistory, {
    reviewSequence,
    reviewPath: relativePath(cwd, review.resultPath),
    structuredReviewPath: relativePath(cwd, review.structuredReviewPath),
  });
  const lifecyclePath = lifecycleResult.lifecycle
    ? writeLifecycleArtifact(state, lifecycleResult.lifecycle, reviewStage, { cwd })
    : undefined;
  const patch = {
    reviewSequence,
    latestFindingLifecycleStatus: lifecycleResult.status,
    latestFindingLifecycleDiagnostics: lifecycleResult.diagnostics || [],
    latestFindingLifecyclePath: lifecyclePath,
  };
  if (lifecycleResult.status === "valid") {
    patch.findingHistory = lifecycleResult.history || [];
    patch.latestFindingLifecycle = lifecycleResult.lifecycle;
    patch.activeBlockingFindings = lifecycleResult.activeBlockingFindings || [];
    patch.latestFindings = lifecycleResult.activeBlockingFindings || [];
  }
  const nextState = setOrchestration({
    ...state,
    ...patch,
  }, patch);
  if (lifecycleResult.status !== "valid") {
    return { state: nextState, ok: false, diagnostics: lifecycleResult.diagnostics || [], lifecyclePath };
  }
  return {
    state: nextState,
    ok: true,
    findings: lifecycleResult.activeBlockingFindings || [],
    lifecyclePath,
  };
}

function isQuestionOutcome(review) {
  return review.outcome === "Questions";
}

function extractFindingsForHandoff(outputText, structuredAnalysis) {
  if (structuredAnalysis && structuredAnalysis.status === "valid") {
    return structuredAnalysis.review.blockingFindings || [];
  }
  if (structuredAnalysis && structuredAnalysis.status && structuredAnalysis.status !== "absent") {
    return [];
  }
  return extractReviewFindings(outputText);
}

async function runReviewWithoutStateWrite(state, reviewStage, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = collectGitContext({ cwd, baseBranch: options.baseBranch || state.baseBranch });
  const implementerConfig = resolveRoleRunner(state, "implementer", options.implementerAgentId);
  const reviewerConfig = resolveRoleRunner(state, "reviewer", options.reviewerAgentId);
  assertSafeCommand(reviewerConfig);
  const sameRunner = runnersMatch(implementerConfig, reviewerConfig);
  const prompt = options.reviewPrompt || buildIndependentReviewPrompt(state, gitContext, { cwd, implementerConfig, reviewerConfig });
  const promptPath = createRunFilePath(state, `${reviewStage}-independent-review-prompt`, { cwd });
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt, "utf8");
  const adapter = options.processAdapter || createDefaultProcessAdapter();
  const invocation = createPromptInvocation(reviewerConfig, prompt);
  const startedAt = new Date().toISOString();
  const result = await adapter.run(reviewerConfig.command, invocation.args, {
    cwd,
    input: invocation.input,
    timeoutMs: options.timeoutMs || reviewerConfig.timeoutMs,
  });
  const completedAt = new Date().toISOString();
  const outputText = [result.stdout || "", result.stderr || ""].filter(Boolean).join("\n");
  const decisionText = String(result.stdout || "").trim() ? result.stdout : outputText;
  const structuredReviewAnalysis = analyzeStructuredReview(decisionText);
  const outcome = classifyReviewOutcome(result, decisionText, { structuredAnalysis: structuredReviewAnalysis });
  const executionRecord = {
    featureId: state.featureId,
    kind: reviewStage,
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
    terminationReason: result.terminationReason || "",
    terminationRequestedAt: result.terminationRequestedAt || null,
    terminationRequestedBy: result.terminationRequestedBy || "",
    configuredTimeoutMs: result.configuredTimeoutMs || options.timeoutMs || reviewerConfig.timeoutMs,
    gracePeriodMs: result.gracePeriodMs || null,
    parentSignal: result.parentSignal || null,
    childCloseObservedAt: result.childCloseObservedAt || null,
    outcome,
    structuredReviewStatus: structuredReviewAnalysis.status,
    structuredReviewDecision: structuredReviewAnalysis.decision || "Unknown",
    structuredReviewDiagnostics: structuredReviewAnalysis.diagnostics || [],
    currentBranch: gitContext.currentBranch,
    baseBranch: gitContext.baseBranchRef,
    mergeBase: gitContext.mergeBase,
  };
  const executionPath = createRunFilePath(state, `${reviewStage}-independent-review-execution`, { cwd });
  fs.writeFileSync(executionPath, `${JSON.stringify(executionRecord, null, 2)}\n`, "utf8");
  const resultPath = createRunFilePath(state, `${reviewStage}-independent-review-result`, { cwd });
  fs.writeFileSync(resultPath, outputText || "(empty reviewer output)", "utf8");
  let structuredReviewPath;
  if (structuredReviewAnalysis.status === "valid") {
    structuredReviewPath = createRunFilePath(state, `${reviewStage}-structured-review`, { cwd })
      .replace(/\.md$/i, ".json");
    fs.writeFileSync(structuredReviewPath, `${JSON.stringify(structuredReviewAnalysis.review, null, 2)}\n`, "utf8");
  }
  const reviewRunRecord = {
    stage: reviewStage,
    outcome,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    implementerId: implementerConfig.agentId,
    sameRunner,
    recordedAt: completedAt,
    promptPath: relativePath(cwd, promptPath),
    executionPath: relativePath(cwd, executionPath),
    resultPath: relativePath(cwd, resultPath),
    structuredReviewStatus: structuredReviewAnalysis.status,
    structuredReviewDecision: structuredReviewAnalysis.decision || "Unknown",
    structuredReviewDiagnostics: structuredReviewAnalysis.diagnostics || [],
    target: computeValidationTarget(gitContext),
  };
  if (structuredReviewPath) reviewRunRecord.structuredReviewPath = relativePath(cwd, structuredReviewPath);
  return {
    state: {
      ...state,
      reviewRuns: [...(Array.isArray(state.reviewRuns) ? state.reviewRuns : []), reviewRunRecord],
    },
    outcome,
    outputText: decisionText,
    sameRunner,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    promptPath,
    executionPath,
    resultPath,
    structuredReviewPath,
    structuredReviewAnalysis,
    executionRecord,
  };
}

async function executeAnswerQuestionsStage(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = collectGitContext({ cwd, baseBranch: state.baseBranch });
  const beforeSignature = getAnswerStageEditSignature(gitContext);
  const implementer = resolveRoleRunner(state, "implementer", options.implementerAgentId);
  const prompt = buildAnswerPrompt(state, { ...options, cwd, gitContext });
  const run = await runAgentPrompt(state, "answer-questions", implementer, prompt, options);
  let nextState = appendRecord(state, "orchestrationRuns", {
    stage: "answer-questions",
    status: run.successful ? "completed" : "failed",
    path: run.record.path,
    resultPath: run.record.resultPath,
  });
  if (!run.successful) {
    return {
      state: markBlocked(nextState, "answer-questions execution failed"),
      run,
      answerAnalysis: { status: "invalid", diagnostics: ["answer-questions execution failed"] },
    };
  }
  const afterSignature = getAnswerStageEditSignature(collectGitContext({ cwd, baseBranch: state.baseBranch }));
  if (beforeSignature !== afterSignature) {
    return {
      state: markBlocked(nextState, "Answer stage modified repository files"),
      run,
      answerAnalysis: { status: "invalid", diagnostics: ["Answer stage modified repository files"] },
    };
  }

  const questions = getOrchestration(state).latestReviewerQuestions || state.latestReviewerQuestions || [];
  const answerAnalysis = parseStructuredAnswers(run.outputText, questions);
  let answerJsonPath;
  if (answerAnalysis.status === "valid") {
    answerJsonPath = createRunFilePath(state, "answer-questions-structured-answers", { cwd }).replace(/\.md$/i, ".json");
    fs.writeFileSync(answerJsonPath, `${JSON.stringify(answerAnalysis.answers, null, 2)}\n`, "utf8");
    nextState = {
      ...nextState,
      latestImplementerAnswerStatus: "valid",
      latestImplementerAnswers: answerAnalysis.answers,
      latestImplementerAnswerPath: relativePath(cwd, answerJsonPath),
      latestImplementerAnswerDiagnostics: [],
    };
    nextState = persistStage(options.statePath, nextState, "final-review", {
      latestImplementerAnswerStatus: "valid",
      latestImplementerAnswers: answerAnalysis.answers,
      latestImplementerAnswerPath: relativePath(cwd, answerJsonPath),
      latestImplementerAnswerDiagnostics: [],
      latestImplementerAnswerOutput: run.outputText,
      latestImplementerAnswerRawPath: run.record.resultPath,
    });
    return { state: nextState, run, answerAnalysis, answerJsonPath };
  }

  nextState = {
    ...nextState,
    latestImplementerAnswerStatus: answerAnalysis.status,
    latestImplementerAnswerDiagnostics: answerAnalysis.diagnostics || [],
  };
  return {
    state: markBlocked(nextState, "Implementer answers were invalid", {
      latestImplementerAnswerStatus: answerAnalysis.status,
      latestImplementerAnswerDiagnostics: answerAnalysis.diagnostics || [],
      latestImplementerAnswerOutput: run.outputText,
      latestImplementerAnswerRawPath: run.record.resultPath,
    }),
    run,
    answerAnalysis,
  };
}

// Best-effort projection for the dry-run preview: when currentStage is
// already a validation stage, preview it directly; otherwise infer the
// validation stage that would naturally follow on the Approved/success path.
// A Changes-Requested outcome from review/re-review/final-review actually
// leads to revalidate, not final-verification -- this preview cannot know
// the Reviewer's future decision, so it shows the Approved-path projection
// and is documented as such rather than claiming certainty it cannot have.
function inferNextValidationStage(currentStage) {
  if (currentStage === "validate" || currentStage === "revalidate" || currentStage === FULL_STAGE_NAME) return currentStage;
  if (currentStage === "fix") return "revalidate";
  if (currentStage === "review" || currentStage === "re-review" || currentStage === "final-review" || currentStage === "answer-questions") return FULL_STAGE_NAME;
  return "validate";
}

function previewOrchestration(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const gitContext = collectGitContext({ cwd, baseBranch: options.baseBranch || state.baseBranch });
  const roleResolution = resolveOrchestrationRoles(state, options);
  const implementer = resolveAgentConfig(state, roleResolution.roles.implementer);
  const reviewer = resolveAgentConfig(state, roleResolution.roles.reviewer);
  assertSafeCommand(implementer);
  assertSafeCommand(reviewer);
  const maxFixCycles = normalizeMaxFixCycles(options.maxFixCycles ?? state.maxFixCycles);
  const currentStage = getCurrentStage(state);
  const validationPlan = buildValidationPlanPreview(state, inferNextValidationStage(currentStage), options);
  return {
    dryRun: true,
    featureId: state.featureId || "unknown-feature",
    branch: gitContext.currentBranch,
    currentStage,
    roleSource: roleResolution.source,
    plannedStages: [
      "implement",
      "validate",
      "review",
      "conditional answer-questions/final-review when Reviewer asks questions",
      "conditional finding lifecycle normalization on re-review/final-review",
      "fix/revalidate/re-review until approved or max cycles",
      "final-verification",
      "human-merge-decision",
    ],
    implementer: { id: implementer.agentId, identity: implementer.identity, commandPreview: createCommandPreview(implementer) },
    reviewer: { id: reviewer.agentId, identity: reviewer.identity, commandPreview: createCommandPreview(reviewer) },
    sameRunner: runnersMatch(implementer, reviewer),
    validationCommands: getValidationCommands(state, options),
    validationPolicy: {
      strategy: validationPlan.strategy,
      focusedCommands: validationPlan.focusedCommands,
      fullCommands: validationPlan.fullCommands,
    },
    nextValidationPhase: {
      phase: validationPlan.phase,
      reason: validationPlan.reason,
    },
    maxFixCycles,
    maxQuestionCycles: normalizeMaxQuestionCycles(options.maxQuestionCycles ?? state.maxQuestionCycles),
    fixCycleCount: Number(state.fixCycleCount || getOrchestration(state).fixCycleCount || 0),
    questionCycle: Number(state.questionCycle || getOrchestration(state).questionCycle || 0),
    runDirectory: getRunDirectory(state, { cwd }).replace(/\\/g, "/"),
    promptPaths: {
      implement: createRunFilePath(state, "implement-implementer-prompt", { cwd }).replace(/\\/g, "/"),
      fix: createRunFilePath(state, "fix-implementer-prompt", { cwd }).replace(/\\/g, "/"),
      review: createRunFilePath(state, "review-independent-review-prompt", { cwd }).replace(/\\/g, "/"),
      answerQuestions: createRunFilePath(state, "answer-questions-implementer-prompt", { cwd }).replace(/\\/g, "/"),
      finalReview: createRunFilePath(state, "final-review-independent-review-prompt", { cwd }).replace(/\\/g, "/"),
      findingLifecycle: createRunFilePath(state, "review-finding-lifecycle", { cwd }).replace(/\.md$/i, ".json").replace(/\\/g, "/"),
    },
    findingLifecycle: {
      previousFindingsMayBeSupplied: getFindingHistory(state).length > 0,
      currentFindingCount: getFindingHistory(state).length,
      artifactMayBeGenerated: true,
    },
    summaryPaths: {
      json: path.join(getRunDirectory(state, { cwd }), "run-summary.json").replace(/\\/g, "/"),
      markdown: path.join(getRunDirectory(state, { cwd }), "run-summary.md").replace(/\\/g, "/"),
      willWrite: false,
    },
    nextExpectedStage: currentStage,
    willSpawn: false,
  };
}

async function runOrchestration(state, options = {}) {
  const cwd = options.cwd || process.cwd();
  const statePath = options.statePath;
  const roleResolution = resolveOrchestrationRoles(state, options);
  const pinnedOptions = {
    ...options,
    implementerAgentId: roleResolution.roles.implementer,
    reviewerAgentId: roleResolution.roles.reviewer,
  };
  const implementerConfig = resolveAgentConfig(state, roleResolution.roles.implementer);
  const reviewerConfig = resolveAgentConfig(state, roleResolution.roles.reviewer);
  assertSafeCommand(implementerConfig);
  assertSafeCommand(reviewerConfig);
  let currentState = setOrchestration(state, {
    currentStage: getCurrentStage(state),
    maxFixCycles: normalizeMaxFixCycles(options.maxFixCycles ?? state.maxFixCycles),
    maxQuestionCycles: normalizeMaxQuestionCycles(options.maxQuestionCycles ?? state.maxQuestionCycles),
    implementerId: implementerConfig.agentId,
    implementerIdentity: implementerConfig.identity,
    reviewerId: reviewerConfig.agentId,
    reviewerIdentity: reviewerConfig.identity,
    sameRunner: runnersMatch(implementerConfig, reviewerConfig),
    startedAt: getOrchestration(state).startedAt || new Date().toISOString(),
    resolvedImplementerId: roleResolution.roles.implementer,
    resolvedReviewerId: roleResolution.roles.reviewer,
    roleResolutionSource: roleResolution.source,
  });
  currentState = {
    ...currentState,
    latestResolvedRoles: { implementer: roleResolution.roles.implementer, reviewer: roleResolution.roles.reviewer },
    latestRoleResolutionSource: roleResolution.source,
  };
  const maxFixCycles = currentState.orchestration.maxFixCycles;
  const maxQuestionCycles = currentState.orchestration.maxQuestionCycles;
  const steps = [];
  const initialBranch = collectGitContext({ cwd, baseBranch: currentState.baseBranch }).currentBranch;

  while (!TERMINAL_STAGES.has(getCurrentStage(currentState))) {
    const gitContext = collectGitContext({ cwd, baseBranch: currentState.baseBranch });
    if (gitContext.currentBranch !== initialBranch) {
      currentState = markBlocked(currentState, `Branch changed from ${initialBranch} to ${gitContext.currentBranch}`);
      if (statePath) writeState(statePath, currentState);
      break;
    }
    const stage = getCurrentStage(currentState);
    if (stage === "implement" || stage === "fix") {
      const beforeSignature = getDiffSignature(gitContext);
      const implementer = resolveAgentConfig(currentState, roleResolution.roles.implementer);
      const prompt = buildImplementerPrompt(currentState, stage, { ...pinnedOptions, cwd, gitContext });
      const run = await runAgentPrompt(currentState, stage, implementer, prompt, pinnedOptions);
      currentState = appendRecord(currentState, "orchestrationRuns", { stage, status: run.successful ? "completed" : "failed", path: run.record.path, resultPath: run.record.resultPath });
      currentState = persistStage(statePath, currentState, nextStageAfterCompleted(currentState, stage), {
        latestImplementerPath: run.record.resultPath,
      });
      steps.push({ stage, status: run.successful ? "completed" : "failed", artifactPath: run.record.path });
      if (!run.successful) {
        currentState = markBlocked(currentState, `${stage} execution failed`);
        if (statePath) writeState(statePath, currentState);
        break;
      }
      if (stage === "fix") {
        const afterSignature = getDiffSignature(collectGitContext({ cwd, baseBranch: currentState.baseBranch }));
        if (beforeSignature === afterSignature) {
          currentState = markBlocked(currentState, "Fix cycle produced no repository diff");
          if (statePath) writeState(statePath, currentState);
          break;
        }
      }
      continue;
    }

    if (stage === "answer-questions") {
      const answer = await executeAnswerQuestionsStage(currentState, { ...pinnedOptions, statePath });
      currentState = answer.state;
      steps.push({ stage, status: answer.answerAnalysis.status, artifactPath: answer.run.record.path });
      if (getCurrentStage(currentState) === "blocked") {
        if (statePath) writeState(statePath, currentState);
        break;
      }
      continue;
    }

    if (stage === "validate" || stage === "revalidate" || stage === "final-verification") {
      // Captured only for final-verification: the tree signature immediately
      // before running the full command list, compared against the same
      // signature immediately after, to detect the full-validation-modified-
      // the-tree case (spec.md FR-007) using the exact same helper already
      // used to detect "fix produced no diff".
      const preValidationGitContext = stage === FULL_STAGE_NAME
        ? collectGitContext({ cwd, baseBranch: currentState.baseBranch })
        : null;
      const validationOptions = preValidationGitContext ? { ...options, gitContext: preValidationGitContext } : options;
      const validation = await runValidationCommands(currentState, stage, validationOptions);
      currentState = validation.state;
      steps.push({ stage, status: validation.passed ? "passed" : "failed", artifactPath: validation.records.at(-1)?.path });

      const treeModifiedByFullValidation = stage === FULL_STAGE_NAME
        && validation.passed
        && getDiffSignature(preValidationGitContext) !== getDiffSignature(collectGitContext({ cwd, baseBranch: currentState.baseBranch }));

      if (!validation.passed || treeModifiedByFullValidation) {
        if (stage !== FULL_STAGE_NAME) {
          // Focused validation (or full-every-cycle at validate/revalidate)
          // failing keeps today's hard-block behavior unchanged -- only a
          // final-verification failure/tree-modification is routed to a
          // fix-capable stage (see below).
          currentState = markBlocked(currentState, `${stage} failed: ${validation.failedRecord.command}`, { failedValidationPath: validation.failedRecord.path });
          if (statePath) writeState(statePath, currentState);
          break;
        }
        // final-verification failed, or passed but modified the tracked
        // working tree: do not treat the prior Approved decision as final.
        // Route back to fix (reusing the existing fix -> revalidate ->
        // re-review loop) up to a dedicated, separately-tracked ceiling, so a
        // defect the full suite found cannot silently consume the Reviewer's
        // own fix-cycle budget (spec.md FR-006/FR-007, Architecture Decision 3).
        const fullValidationFixCycleCount = Number(getOrchestration(currentState).fullValidationFixCycleCount || 0);
        const failureSummary = treeModifiedByFullValidation
          ? "final-verification passed, but its commands modified the tracked working tree (e.g. a formatter, generated snapshot, or build artifact under version control changed). Reconcile and commit this change so a fresh review can be obtained."
          : `final-verification failed: ${validation.failedRecord.command} (exit code ${validation.failedRecord.exitCode}).${validation.failedRecord.errorMessage ? ` ${validation.failedRecord.errorMessage}` : ""}`;
        if (fullValidationFixCycleCount >= maxFixCycles) {
          const extra = treeModifiedByFullValidation ? {} : { failedValidationPath: validation.failedRecord.path };
          currentState = markBlocked(currentState, `Maximum full-validation fix cycles reached (${failureSummary})`, extra);
          if (statePath) writeState(statePath, currentState);
          break;
        }
        currentState = persistStage(statePath, currentState, "fix", {
          fullValidationFixCycleCount: fullValidationFixCycleCount + 1,
          pendingFixTriggerReason: VALIDATION_TRIGGER_REASONS.FULL_VALIDATION_RETRY,
          latestFullValidationFailureSummary: failureSummary,
        });
        continue;
      }

      if (stage === "final-verification") {
        currentState = markHumanGate(currentState);
        if (statePath) writeState(statePath, currentState);
        break;
      }
      currentState = persistStage(statePath, currentState, nextStageAfterCompleted(currentState, stage));
      continue;
    }

    if (stage === "review" || stage === "re-review" || stage === "final-review") {
      const reviewOptions = stage === "final-review"
        ? { ...pinnedOptions, reviewPrompt: buildFinalReviewPrompt(currentState, pinnedOptions) }
        : pinnedOptions;
      const review = await executeReviewStage(currentState, stage, reviewOptions);
      currentState = review.state;
      steps.push({ stage, status: review.outcome, artifactPath: relativePath(cwd, review.resultPath) });
      if (isQuestionOutcome(review)) {
        if (stage === "final-review") {
          currentState = markBlocked(currentState, "Reviewer asked questions after the allowed clarification round");
          if (statePath) writeState(statePath, currentState);
          break;
        }
        if (review.structuredReviewAnalysis.status !== "valid") {
          currentState = markBlocked(currentState, "Reviewer questions were invalid");
          if (statePath) writeState(statePath, currentState);
          break;
        }
        const questionCycle = Number(currentState.questionCycle || 0);
        if (questionCycle >= maxQuestionCycles) {
          currentState = markBlocked(currentState, "Maximum question cycles reached");
          if (statePath) writeState(statePath, currentState);
          break;
        }
        const questions = review.structuredReviewAnalysis.review.questions || [];
        currentState = {
          ...currentState,
          questionCycle: questionCycle + 1,
          latestReviewerQuestionStatus: "valid",
          latestReviewerQuestions: questions,
          latestReviewerQuestionPath: relativePath(cwd, review.structuredReviewPath),
          latestReviewerQuestionDiagnostics: [],
        };
        currentState = persistStage(statePath, currentState, "answer-questions", {
          questionCycle: currentState.questionCycle,
          latestReviewerQuestionStatus: "valid",
          latestReviewerQuestions: questions,
          latestReviewerQuestionPath: relativePath(cwd, review.structuredReviewPath),
          latestReviewerQuestionDiagnostics: [],
        });
        continue;
      }
      const lifecycle = applyFindingLifecycle(currentState, review, stage, { cwd });
      currentState = lifecycle.state;
      if (!lifecycle.ok) {
        currentState = markBlocked(currentState, `Finding lifecycle invalid: ${(lifecycle.diagnostics || []).join("; ")}`);
        if (statePath) writeState(statePath, currentState);
        break;
      }
      if (review.outcome === "Approved") {
        currentState = persistStage(statePath, currentState, "final-verification");
        continue;
      }
      if (review.outcome !== "Changes Requested") {
        currentState = markBlocked(currentState, `Reviewer returned ${review.outcome}`);
        if (statePath) writeState(statePath, currentState);
        break;
      }
      const activeFindings = getOrchestration(currentState).latestFindings || lifecycle.findings || review.findings;
      if (!activeFindings.length) {
        currentState = markBlocked(currentState, "Reviewer requested changes without actionable findings");
        if (statePath) writeState(statePath, currentState);
        break;
      }
      const fixCycleCount = Number(currentState.fixCycleCount || 0);
      if (fixCycleCount >= maxFixCycles) {
        currentState = markBlocked(currentState, "Maximum fix cycles reached");
        if (statePath) writeState(statePath, currentState);
        break;
      }
      currentState = {
        ...currentState,
        fixCycleCount: fixCycleCount + 1,
      };
      // Always explicitly set (never left stale from a prior occurrence):
      // the next revalidate's triggerReason reads this marker, so a
      // Reviewer-requested fix must never be misattributed as a
      // full-validation retry, or vice versa.
      currentState = persistStage(statePath, currentState, "fix", {
        fixCycleCount: currentState.fixCycleCount,
        pendingFixTriggerReason: VALIDATION_TRIGGER_REASONS.REVIEWER_FIX,
      });
      continue;
    }

    currentState = markBlocked(currentState, `Unsupported orchestration stage: ${stage}`);
    if (statePath) writeState(statePath, currentState);
  }

  const finalGitContext = collectGitContext({ cwd, baseBranch: currentState.baseBranch });
  const summaryRefresh = refreshRunSummary({
    state: currentState,
    cwd,
    currentBranchHead: finalGitContext.headCommit || null,
  });

  return {
    state: currentState,
    steps,
    decision: getOrchestration(currentState).decision || (getCurrentStage(currentState) === "human-merge-decision" ? "Ready for human merge decision" : "Blocked"),
    reason: getOrchestration(currentState).reason || "",
    nextAction: currentState.nextExpectedAction || getOrchestration(currentState).nextExpectedAction || "",
    summary: summaryRefresh.summary,
    summaryPaths: summaryRefresh.ok ? { json: summaryRefresh.jsonPath, markdown: summaryRefresh.markdownPath } : null,
    summaryWarning: summaryRefresh.warning,
  };
}

async function runOrchestrationAndPersist(statePath, options = {}) {
  const state = readState(statePath);
  const run = await runOrchestration(state, { ...options, statePath });
  writeState(statePath, run.state);
  return { ...run, statePath };
}

module.exports = {
  DEFAULT_MAX_FIX_CYCLES,
  ORCHESTRATION_STAGES,
  buildImplementerPrompt,
  extractReviewFindings,
  getCurrentStage,
  getValidationCommands,
  previewOrchestration,
  runOrchestration,
  runOrchestrationAndPersist,
  runValidationCommands,
  extractFindingsForHandoff,
};
