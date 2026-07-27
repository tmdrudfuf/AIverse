const SCHEMA_VERSION = 1;

const RUN_STATUSES = {
  PLANNED: "planned",
  RUNNING: "running",
  BLOCKED: "blocked",
  FAILED: "failed",
  INTERRUPTED: "interrupted",
  TIMED_OUT: "timed-out",
  COMPLETED: "completed",
  AWAITING_HUMAN_DECISION: "awaiting-human-decision",
};

const STOP_REASONS = {
  VALIDATION_FAILED: "validation-failed",
  CHANGES_REQUESTED_LIMIT_REACHED: "changes-requested-limit-reached",
  REVIEWER_QUESTIONS_UNRESOLVED: "reviewer-questions-unresolved",
  STRUCTURED_REVIEW_INVALID: "structured-review-invalid",
  REVIEW_DECISION_UNKNOWN: "review-decision-unknown",
  TIMEOUT: "timeout",
  INTERRUPTED: "interrupted",
  UNSAFE_RUNNER: "unsafe-runner",
  ROLE_RESOLUTION_FAILED: "role-resolution-failed",
  COMMAND_FAILED: "command-failed",
  STATE_INVALID: "state-invalid",
  MANUAL_STOP: "manual-stop",
  REVIEW_CONVERGENCE_FAILED: "review-convergence-failed",
};

const VALIDATION_STATUSES = {
  PASSED: "passed",
  FAILED: "failed",
  TIMED_OUT: "timed-out",
  INTERRUPTED: "interrupted",
  SKIPPED: "skipped",
  NOT_RUN: "not-run",
};

const HUMAN_GATE_STATES = {
  NOT_READY: "not-ready",
  READY_FOR_COMMIT: "ready-for-commit",
  READY_FOR_PUSH_DECISION: "ready-for-push-decision",
  READY_FOR_PR_DECISION: "ready-for-pr-decision",
  READY_FOR_MERGE_DECISION: "ready-for-merge-decision",
  COMPLETED_WITHOUT_REMOTE_ACTION: "completed-without-remote-action",
};

const RUN_STATUS_VALUES = new Set(Object.values(RUN_STATUSES));
const STOP_REASON_VALUES = new Set(Object.values(STOP_REASONS));
const VALIDATION_STATUS_VALUES = new Set(Object.values(VALIDATION_STATUSES));
const HUMAN_GATE_STATE_VALUES = new Set(Object.values(HUMAN_GATE_STATES));

function normalizeRunStatus(value) {
  return RUN_STATUS_VALUES.has(value) ? value : RUN_STATUSES.BLOCKED;
}

function normalizeStopReason(value) {
  if (value === null || value === undefined) return null;
  return STOP_REASON_VALUES.has(value) ? value : null;
}

function normalizeValidationStatus(value) {
  return VALIDATION_STATUS_VALUES.has(value) ? value : VALIDATION_STATUSES.NOT_RUN;
}

function normalizeHumanGateState(value) {
  return HUMAN_GATE_STATE_VALUES.has(value) ? value : HUMAN_GATE_STATES.NOT_READY;
}

module.exports = {
  SCHEMA_VERSION,
  RUN_STATUSES,
  STOP_REASONS,
  VALIDATION_STATUSES,
  HUMAN_GATE_STATES,
  normalizeRunStatus,
  normalizeStopReason,
  normalizeValidationStatus,
  normalizeHumanGateState,
};
