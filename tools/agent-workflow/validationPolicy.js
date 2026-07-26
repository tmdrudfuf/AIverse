const crypto = require("crypto");

const { DEFAULT_VALIDATION_COMMANDS } = require("./agentWorkflow.js");

const VALIDATION_STRATEGIES = {
  FOCUSED_FINAL_FULL: "focused-final-full",
  FULL_EVERY_CYCLE: "full-every-cycle",
};

const DEFAULT_VALIDATION_STRATEGY = VALIDATION_STRATEGIES.FULL_EVERY_CYCLE;

const VALIDATION_TRIGGER_REASONS = {
  INITIAL_IMPLEMENTATION: "initial-implementation",
  REVIEWER_FIX: "reviewer-fix",
  // Reserved for schema completeness: answer-questions cannot modify code
  // today (executeAnswerQuestionsStage hard-blocks on any file change), so
  // this value is never actually emitted -- see spec.md Clarifications.
  REVIEWER_QUESTION_ANSWER_CHANGE: "reviewer-question-answer-change",
  FULL_VALIDATION_CANDIDATE: "full-validation-candidate",
  FULL_VALIDATION_RETRY: "full-validation-retry",
  MANUAL_REQUEST: "manual-request",
  RESUME_REVALIDATION: "resume-revalidation",
};

const VALIDATION_STRATEGY_VALUES = new Set(Object.values(VALIDATION_STRATEGIES));
const FOCUSED_STAGE_NAMES = new Set(["validate", "revalidate"]);
const FULL_STAGE_NAME = "final-verification";

function getValidationPolicyState(state) {
  return state && state.validationPolicy && typeof state.validationPolicy === "object"
    ? state.validationPolicy
    : {};
}

function normalizeCommandList(value) {
  return Array.isArray(value) && value.length ? value.map((command) => String(command)) : undefined;
}

function normalizeValidationStrategy(value) {
  return VALIDATION_STRATEGY_VALUES.has(value) ? value : DEFAULT_VALIDATION_STRATEGY;
}

// Resolves the effective validation policy for one invocation. Never mutates
// state, never returns an empty fullCommands list (DEFAULT_VALIDATION_COMMANDS
// is the ultimate fallback, matching pre-Spec-055 getValidationCommands), and
// never returns an unrecognized strategy.
function resolveValidationPolicy(state, options = {}) {
  const policyState = getValidationPolicyState(state);
  const strategy = normalizeValidationStrategy(options.validationStrategy || policyState.strategy);

  const fullCommands = normalizeCommandList(options.fullValidationCommands)
    || normalizeCommandList(options.validationCommands)
    || normalizeCommandList(policyState.fullCommands)
    || normalizeCommandList(state && state.validationCommands)
    || DEFAULT_VALIDATION_COMMANDS;

  const focusedCommands = normalizeCommandList(options.focusedValidationCommands)
    || normalizeCommandList(policyState.focusedCommands);

  return {
    strategy,
    fullCommands,
    focusedCommands: focusedCommands || undefined,
    focusedCommandsConfigured: Boolean(focusedCommands),
    requiresFullValidation: Boolean(policyState.requiresFullValidation),
  };
}

// Rule order matches contracts/validation-policy-schema.md exactly:
// final-verification is always full; nothing may override that, since it is
// the sole gate for humanGate.ready.
function resolvePhaseForStage(policy, stage, options = {}) {
  if (stage === FULL_STAGE_NAME) return "full";
  if (options.forceFullValidation) return "full";
  if (policy.requiresFullValidation) return "full";
  if (policy.strategy === VALIDATION_STRATEGIES.FULL_EVERY_CYCLE) return "full";
  if (policy.strategy === VALIDATION_STRATEGIES.FOCUSED_FINAL_FULL) {
    return policy.focusedCommandsConfigured ? "focused" : "full";
  }
  return "full";
}

function commandsForPhase(policy, phase) {
  return phase === "focused" ? policy.focusedCommands : policy.fullCommands;
}

function hashDirtyState(gitContext) {
  const text = [
    gitContext.statusPorcelain || "",
    gitContext.stagedDiff || "",
    gitContext.unstagedDiff || "",
  ].join("\n");
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
}

// Pure function of already-collected git context; never shells out itself.
function computeValidationTarget(gitContext) {
  const context = gitContext || {};
  const dirty = Boolean(context.hasStagedChanges || context.hasUnstagedChanges);
  return {
    commit: context.headCommit || null,
    dirty,
    dirtyHash: dirty ? hashDirtyState(context) : null,
  };
}

function targetsMatch(a, b) {
  if (!a || !b) return false;
  if (a.commit !== b.commit) return false;
  if (Boolean(a.dirty) !== Boolean(b.dirty)) return false;
  if (a.dirty && a.dirtyHash !== b.dirtyHash) return false;
  return true;
}

module.exports = {
  VALIDATION_STRATEGIES,
  DEFAULT_VALIDATION_STRATEGY,
  VALIDATION_TRIGGER_REASONS,
  FOCUSED_STAGE_NAMES,
  FULL_STAGE_NAME,
  normalizeValidationStrategy,
  resolveValidationPolicy,
  resolvePhaseForStage,
  commandsForPhase,
  computeValidationTarget,
  targetsMatch,
};
