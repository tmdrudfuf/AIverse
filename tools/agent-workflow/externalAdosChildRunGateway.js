// Trusted external ADOS child-run gateway (Spec 148, human-authorized
// child-run architecture). Node-only (real git/process spawning) -- never
// imported from browser-bundled office code directly; consumed only through
// ExternalAdosChildRunImplementerProvider's window/env-var guarded boundary,
// mirroring ClaudeImplementerRuntimeProvider's existing real-spawn pattern.
//
// Implements the three-phase protocol named by the operator authorization
// (explicitHumanDecisions.childProtocol: "external-run prepare/continue/
// inspect"): prepare() creates a fresh disposable local git repository and a
// real tools/agent-workflow state file; continueRun() spawns the real,
// unmodified `cli.js orchestrate` engine against it (the same engine that
// develops this repository -- no second orchestration engine is created);
// inspect() re-derives readiness from that engine's own real
// getRunSummaryForDisplay() output. The child run id
// (childRunIdAuthority: "ADOS") is summary.run.runId -- computed by
// runSummary.js from the real timestamp of the real first agent invocation,
// never a value this gateway invents or the parent Spec 148 run's own id.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { readState, writeState } = require("./agentWorkflow.js");
const { getRunSummaryForDisplay } = require("./summaryCommand.js");

const CHILD_RUN_ROOT = ".agent-workflow/disposable-projects";
const CLI_PATH = path.join(__dirname, "cli.js");
const IMPLEMENTER_FIXTURE = path.join(__dirname, "fixtures", "deterministicChildImplementer.js");
const REVIEWER_FIXTURE = path.join(__dirname, "fixtures", "deterministicChildReviewer.js");
const DEFAULT_CONTINUE_TIMEOUT_MS = 60000;

// Per explicitHumanDecisions.forbiddenRepositories: this gateway must never
// bind a verification run to a real user project.
const FORBIDDEN_REPOSITORY_HINTS = new Set(["dailyproof", "real_user_project"]);

function generateChildRunId() {
  return crypto.randomBytes(12).toString("hex");
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed in ${cwd}: ${result.stderr || result.stdout || "unknown error"}`);
  }
  return result.stdout;
}

/**
 * Phase 1: create a fresh, minimal, isolated disposable local repository
 * (explicitHumanDecisions.verificationRepository) and a real
 * tools/agent-workflow state file targeting it, with deterministic child
 * executables standing in for the Claude/Codex process boundary.
 */
function prepareChildRun(input = {}) {
  const repositoryHint = String(input.repositoryHint || "").trim().toLowerCase();
  if (FORBIDDEN_REPOSITORY_HINTS.has(repositoryHint)) {
    throw new Error("Refusing to bind the ADOS child run to a forbidden repository.");
  }
  const appRoot = input.appRoot || process.cwd();
  const disposableRoot = input.disposableRoot || path.resolve(appRoot, CHILD_RUN_ROOT);
  const childRunId = generateChildRunId();
  const repoPath = path.join(disposableRoot, childRunId);

  fs.mkdirSync(repoPath, { recursive: true });
  git(repoPath, ["init", "-q"]);
  git(repoPath, ["symbolic-ref", "HEAD", "refs/heads/main"]);
  git(repoPath, ["config", "user.email", "ados-child@example.invalid"]);
  git(repoPath, ["config", "user.name", "ADOS Child Implementer"]);
  fs.writeFileSync(path.join(repoPath, ".gitignore"), ".agent-workflow/\n", "utf8");
  fs.writeFileSync(
    path.join(repoPath, "VERIFICATION.md"),
    "# Disposable ADOS child verification repository\n\nCreated for a single Spec 148 runtime verification cycle.\n",
    "utf8",
  );
  git(repoPath, ["add", "-A"]);
  git(repoPath, ["commit", "-q", "-m", "init disposable verification repository"]);

  const statePath = path.join(disposableRoot, `${childRunId}.state.json`);
  writeState(statePath, {
    featureId: childRunId,
    featureName: "Spec 148 disposable verification change",
    baseBranch: "main",
    taskScope: input.taskScope || "Append one deterministic verification note to VERIFICATION.md.",
    results: [],
    validationCommands: input.validationCommands || ["node -e \"process.exit(0)\""],
    agentRunners: {
      implementer: {
        identity: "Deterministic Child Implementer",
        command: process.execPath,
        args: [IMPLEMENTER_FIXTURE],
        inputMode: "stdin",
        timeoutMs: 20000,
      },
      reviewer: {
        identity: "Deterministic Child Reviewer",
        command: process.execPath,
        args: [REVIEWER_FIXTURE],
        inputMode: "stdin",
        timeoutMs: 20000,
      },
    },
  });

  return { childRunId, repoPath, statePath };
}

/**
 * Phase 2: drive the real, unmodified orchestrate engine to completion
 * (or a block) as a genuine subprocess. Never fabricates the durable
 * .agent-workflow/runs/<childRunId>/ artifacts that this real process
 * produces on disk.
 */
function continueChildRun(prepared, options = {}) {
  const result = spawnSync(
    process.execPath,
    [CLI_PATH, "orchestrate", "--state", prepared.statePath, "--until-blocked"],
    {
      cwd: prepared.repoPath,
      timeout: options.timeoutMs || DEFAULT_CONTINUE_TIMEOUT_MS,
      encoding: "utf8",
    },
  );
  return {
    exitCode: result.status,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

/**
 * Phase 3: re-derive readiness from the real engine's own summary output --
 * never trust a caller-supplied confirmation. This is the sole authority
 * ExternalAdosChildRunImplementerProvider surfaces as evidence.
 */
function inspectChildRun(prepared) {
  const state = readState(prepared.statePath);
  const summary = getRunSummaryForDisplay(state, { cwd: prepared.repoPath });
  const headSha = git(prepared.repoPath, ["rev-parse", "HEAD"]).trim();
  return { childRunId: state.featureId, summary, headSha };
}

function deriveChildRunReadiness(inspected) {
  const summary = inspected.summary;
  const candidateSha = (summary.commits && summary.commits.reviewedTarget && summary.commits.reviewedTarget.commit) || "";
  const validatedSha = (summary.commits && summary.commits.fullValidationTarget && summary.commits.fullValidationTarget.commit) || "";
  const reviewDecision = (summary.review && summary.review.finalDecision) || "Unknown";
  const validatedMatchesCandidate = Boolean(candidateSha) && validatedSha === candidateSha;
  const reviewedMatchesCandidate = Boolean(candidateSha) && summary.review && summary.review.exactReviewedCommitMatch === true;
  const exactHeadMatch = Boolean(candidateSha) && candidateSha === inspected.headSha;
  const humanGateReady = Boolean(summary.humanGate && summary.humanGate.ready === true);
  const finalReadinessSatisfied = Boolean(summary.validation && summary.validation.finalReadinessSatisfied === true);
  const ready = humanGateReady
    && reviewDecision === "Approved"
    && finalReadinessSatisfied
    && validatedMatchesCandidate
    && reviewedMatchesCandidate
    && exactHeadMatch;

  return {
    // The same ADOS-authored identity surfaced as durableAdosRunId below
    // (summary.run.runId), not this gateway's own directory-naming choice
    // (inspected.childRunId / state.featureId) - see childRunIdAuthority.
    childRunId: summary.run.runId,
    candidateSha,
    reviewDecision,
    validatedMatchesCandidate,
    reviewedMatchesCandidate,
    exactHeadMatch,
    ready,
  };
}

/**
 * Runs all three phases once and returns a single evidence-shaped result.
 * This is what ExternalAdosChildRunImplementerProvider calls.
 */
function runExternalAdosChildRunCycle(input = {}) {
  const prepared = prepareChildRun(input);
  const continued = continueChildRun(prepared, input);
  const inspected = inspectChildRun(prepared);
  const readiness = deriveChildRunReadiness(inspected);
  return {
    childRunId: prepared.childRunId,
    repoPath: prepared.repoPath,
    statePath: prepared.statePath,
    exitCode: continued.exitCode,
    timedOut: continued.timedOut,
    stdout: continued.stdout,
    stderr: continued.stderr,
    durableAdosRunId: inspected.summary.run.runId,
    readiness,
  };
}

module.exports = {
  generateChildRunId,
  prepareChildRun,
  continueChildRun,
  inspectChildRun,
  deriveChildRunReadiness,
  runExternalAdosChildRunCycle,
  FORBIDDEN_REPOSITORY_HINTS,
};
